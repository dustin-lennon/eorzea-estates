let _processor: { forceFlush(): Promise<void> } | null = null

export const langfuseSpanProcessor = {
  forceFlush: () => _processor?.forceFlush() ?? Promise.resolve(),
}

export async function register() {
  // OpenTelemetry SDK requires Node.js — skip in Cloudflare Workers (edge runtime)
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  try {
    const { NodeSDK } = await import("@opentelemetry/sdk-node")
    const { LangfuseSpanProcessor } = await import("@langfuse/otel")

    const processor = new LangfuseSpanProcessor()
    _processor = processor
    const sdk = new NodeSDK({
      spanProcessors: [processor],
    })
    sdk.start()
  } catch {
    // SDK not available in this environment — traces skipped
  }
}
