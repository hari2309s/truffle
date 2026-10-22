import { NextRequest, NextResponse } from 'next/server'
import { generateText } from 'ai'
import { startObservation } from '@langfuse/tracing'
import { visionModel, langfuseSpanProcessor } from '@truffle/ai'
import { requireUser } from '@/lib/supabase-server'
import { toAmount, toCategory } from '@/lib/toolArgs'

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
  "items": [{ "name": "Sourdough", "amount": 3.49 }],
  "itemsLegible": true
}
- total: the amount paid, negative for a purchase, positive for a refund
- items: each line item with its positive price, in the order printed; [] if you cannot read them
- itemsLegible: false when the total is readable but the line items are not (blurry, cut off, faded)
- if even the total can't be read, return { "kind": "receipt", "total": null }

For a STATEMENT return:
{ "kind": "statement", "transactions": [
  { "date": "YYYY-MM-DD", "description": "merchant or short description", "amount": -12.50, "currency": "EUR", "category": "food_groceries" }
] }
- amount: negative for purchases/expenses, positive for income/refunds/credits
- return every row; [] if nothing can be extracted

For both:
- date: ISO YYYY-MM-DD; if only month/day is visible assume the year from context; if no date use today (${today})
- currency: infer from symbol (€ → EUR, £ → GBP, $ → USD); default EUR
- category: the single best fit, exactly as written, from:
  food_groceries, food_delivery, transport, housing, utilities, subscriptions,
  health, entertainment, shopping, income, savings, other`

type Currency = 'EUR' | 'GBP' | 'USD'
const currencyOf = (raw: unknown): Currency =>
  ['EUR', 'GBP', 'USD'].includes(String(raw)) ? (String(raw) as Currency) : 'EUR'
const dateOf = (raw: unknown, today: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(String(raw)) ? String(raw) : today

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = await requireUser(req)
    if (errorResponse) return errorResponse

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const mimeType = file.type
    const isImage = mimeType.startsWith('image/')
    const isPDF = mimeType === 'application/pdf'

    if (!isImage && !isPDF) {
      return NextResponse.json(
        { error: 'Only images (JPEG, PNG, WEBP) and PDFs are supported' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const today = new Date().toISOString().slice(0, 10)

    const mediaPart = isPDF
      ? { type: 'file' as const, data: base64, mediaType: 'application/pdf' as const }
      : {
          type: 'image' as const,
          image: base64,
          mediaType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        }

    const trace = startObservation('parse_receipt', {
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

    // Strip markdown fences if model wraps despite instructions
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')

    let raw: unknown
    try {
      raw = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Model returned unparseable output', raw: text },
        { status: 422 }
      )
    }

    const isObject = (v: unknown): v is Record<string, unknown> =>
      v !== null && typeof v === 'object' && !Array.isArray(v)

    // ── Receipt: one entry for the total, plus the printed line items ──
    if (isObject(raw) && raw.kind === 'receipt') {
      const total = toAmount(raw.total)
      if (raw.total === null || isNaN(total) || total === 0) {
        return NextResponse.json({ kind: 'receipt', transactions: [], receipt: null })
      }
      const items = (Array.isArray(raw.items) ? raw.items : [])
        .filter(isObject)
        .map((item) => ({ name: String(item.name ?? '').trim(), amount: toAmount(item.amount) }))
        .filter((item) => item.name && !isNaN(item.amount))
        .slice(0, 60)
      const receipt = {
        merchant: String(raw.merchant ?? 'Receipt').trim() || 'Receipt',
        date: dateOf(raw.date, today),
        currency: currencyOf(raw.currency),
        category: toCategory(raw.category),
        total,
        items,
        itemsLegible: raw.itemsLegible !== false && items.length > 0,
      }
      return NextResponse.json({
        kind: 'receipt',
        receipt,
        transactions: [
          {
            date: receipt.date,
            description: receipt.merchant,
            amount: receipt.total,
            currency: receipt.currency,
            category: receipt.category,
          },
        ],
      })
    }

    // ── Statement (or the older bare-array shape) ──
    const rows = Array.isArray(raw)
      ? raw
      : isObject(raw) && Array.isArray(raw.transactions)
        ? raw.transactions
        : null
    if (!rows) {
      return NextResponse.json({ error: 'Unexpected output from model', raw: text }, { status: 422 })
    }

    const transactions = rows
      .filter(isObject)
      .map((item) => ({
        date: dateOf(item.date, today),
        description: String(item.description ?? 'Unknown'),
        amount: toAmount(item.amount),
        currency: currencyOf(item.currency),
        category: toCategory(item.category),
      }))
      .filter((t) => !isNaN(t.amount) && t.amount !== 0)

    return NextResponse.json({ kind: 'statement', transactions })
  } catch (err) {
    console.error('[parse-receipt]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
