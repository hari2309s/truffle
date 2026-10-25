import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { startObservation } from '@langfuse/tracing'
import { visionModel, langfuseSpanProcessor } from '@truffle/ai'
import { requireUser } from '@/lib/supabase-server'
import { toAmount, toCategory } from '@/lib/toolArgs'
import { splitCSV, detectColumns, rowsFrom, hasRequired } from '@/lib/csv'

export const runtime = 'nodejs'
export const maxDuration = 30

const EXTRACT_PROMPT = (today: string) => `You are a financial data extraction assistant.
Look at this file and decide whether it is a single shop RECEIPT or a bank STATEMENT.

Return ONLY valid JSON — no markdown fences, no explanation, nothing else.

For a RECEIPT return:
{
  "kind": "receipt",
  "merchant": "shop name",
  "date": "YYYY-MM-DD",
  "currency": "EUR",
  "category": "food_groceries",
  "total": -45.20,
  "items": [{ "name": "Sourdough", "amount": -3.49 }],
  "itemsLegible": true
}

For a STATEMENT return:
{ "kind": "statement", "transactions": [
  { "date": "YYYY-MM-DD", "description": "merchant or short description", "amount": -12.50, "currency": "EUR", "category": "food_groceries" }
] }

amount: negative for purchases/expenses, positive for income/refunds/credits.
date: ISO YYYY-MM-DD; if only month/day is visible assume the year from context; if no date use today (${today}).
currency: infer from symbol (€ → EUR, £ → GBP, $ → USD); default EUR.
category: the single best fit from:
  food_groceries, food_delivery, transport, housing, utilities, subscriptions,
  health, entertainment, shopping, income, savings, other`

type Currency = 'EUR' | 'GBP' | 'USD'
const currencyOf = (raw: unknown): Currency =>
  ['EUR', 'GBP', 'USD'].includes(String(raw)) ? (String(raw) as Currency) : 'EUR'
const dateOf = (raw: unknown, today: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(raw)) ? String(raw) : today

const isObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

async function parseImageOrPdf(file: File, today: string) {
  const mimeType = file.type
  const isPDF = mimeType === 'application/pdf'
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const mediaPart = isPDF
    ? { type: 'file' as const, data: base64, mediaType: 'application/pdf' as const }
    : {
        type: 'image' as const,
        image: base64,
        mediaType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
      }

  const trace = startObservation('parse_chat_attachment', {
    input: EXTRACT_PROMPT(today),
    metadata: { fileType: isPDF ? 'pdf' : 'image', mimeType, fileSize: file.size },
  })
  const generation = trace.startObservation(
    'extractTransactions',
    { model: 'gemini-3.7-flash', input: EXTRACT_PROMPT(today) },
    { asType: 'generation' }
  )

  const { text, usage } = await generateText({
    model: visionModel,
    messages: [
      {
        role: 'user',
        content: [mediaPart, { type: 'text' as const, text: EXTRACT_PROMPT(today) }],
      },
    ],
  })

  generation
    .update({
      output: text,
      usageDetails: usage
        ? { input: usage.inputTokens ?? 0, output: usage.outputTokens ?? 0 }
        : undefined,
    })
    .end()
  trace.end()
  await langfuseSpanProcessor.forceFlush()

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')

  const raw = JSON.parse(cleaned) as unknown

  // Receipt
  if (isObject(raw) && raw.kind === 'receipt') {
    const total = toAmount(raw.total)
    if (raw.total === null || isNaN(total) || total === 0) {
      return { source: 'receipt' as const, sourceName: '', rows: [] }
    }
    const items = (Array.isArray(raw.items) ? raw.items : [])
      .filter(isObject)
      .map((item) => ({
        date: dateOf(raw.date, today),
        description: String(item.name ?? '').trim(),
        amount: -(Math.abs(toAmount(item.amount))),
        category: toCategory(raw.category),
      }))
      .filter((item) => item.description && !isNaN(item.amount))

    const merchant = String(raw.merchant ?? 'Receipt').trim() || 'Receipt'
    // If items are legible, use them; otherwise just show the total
    const rows =
      items.length > 0
        ? items
        : [{ date: dateOf(raw.date, today), description: merchant, amount: total, category: toCategory(raw.category) }]

    return {
      source: 'receipt' as const,
      sourceName: `${merchant} · ${dateOf(raw.date, today).replace(/-/g, ' ').slice(5).toUpperCase().replace(/^0/, '')}`,
      rows,
    }
  }

  // Statement
  const txRows = Array.isArray(raw)
    ? raw
    : isObject(raw) && Array.isArray(raw.transactions)
      ? raw.transactions
      : []

  const transactions = txRows
    .filter(isObject)
    .map((item) => ({
      date: dateOf(item.date, today),
      description: String(item.description ?? 'Unknown'),
      amount: toAmount(item.amount),
      category: toCategory(item.category),
    }))
    .filter((t) => !isNaN(t.amount) && t.amount !== 0)

  return {
    source: 'statement' as const,
    sourceName: 'BANK STATEMENT',
    rows: transactions,
  }
}

function parseCsv(csvText: string, today: string) {
  const { headers, records } = splitCSV(csvText)
  const cols = detectColumns(headers)
  if (!hasRequired(cols)) {
    return { source: 'csv' as const, sourceName: 'CSV IMPORT', rows: [] }
  }
  const rows = rowsFrom(records, cols)
    .filter((r) => !isNaN(r.amount) && r.amount !== 0)
    .map((r) => ({
      date: r.date || today,
      description: r.description || 'Unknown',
      amount: r.amount,
      category: r.category ?? ('other' as const),
    }))

  return {
    source: 'csv' as const,
    sourceName: 'CSV IMPORT',
    rows,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireUser(req)
    if (errorResponse) return errorResponse

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const allRows: Array<{
      date: string
      description: string
      amount: number
      category: string
    }> = []
    let source: 'receipt' | 'statement' | 'csv' = 'receipt'
    let sourceName = ''

    for (const file of files) {
      const isCSV = /csv/i.test(file.type) || /\.csv$/i.test(file.name)
      const isImage = file.type.startsWith('image/')
      const isPDF = file.type === 'application/pdf'

      if (isCSV) {
        const csvText = await file.text()
        const result = parseCsv(csvText, today)
        source = 'csv'
        sourceName = result.sourceName
        allRows.push(...result.rows)
      } else if (isImage || isPDF) {
        const result = await parseImageOrPdf(file, today)
        source = result.source
        sourceName = result.sourceName
        allRows.push(...result.rows)
      }
    }

    return NextResponse.json({ source, sourceName, rows: allRows })
  } catch (err) {
    console.error('[chat/attachments]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
