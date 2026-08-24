import { NodeSDK } from '@opentelemetry/sdk-node'
import { LangfuseSpanProcessor } from '@langfuse/otel'
import { LangfuseClient } from '@langfuse/client'

export const langfuseSpanProcessor = new LangfuseSpanProcessor()

const otelSdk = new NodeSDK({
  spanProcessors: [langfuseSpanProcessor],
})
otelSdk.start()

export const langfuseClient = new LangfuseClient()
