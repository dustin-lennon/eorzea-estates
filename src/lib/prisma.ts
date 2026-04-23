import { cache } from "react"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL!
  let ssl: boolean | object = true

  // In CF Workers, use Hyperdrive connection string with ssl:false.
  // Production: CF Hyperdrive gateway handles TLS to the database.
  // Local dev (wrangler dev via preview-local.mjs): Hyperdrive is pointed at a
  //   Node.js TLS proxy started by preview-local.mjs. The proxy does STARTTLS
  //   to Supabase using real node:tls outside of miniflare.
  try {
    const ctx = getCloudflareContext()
    const env = ctx?.env as Record<string, unknown>
    const hyperdrive = env?.HYPERDRIVE as { connectionString: string } | undefined
    if (hyperdrive?.connectionString) {
      connectionString = hyperdrive.connectionString
      ssl = false
    }
  } catch {
    // Not in CF Workers context (Next.js dev server, build time, etc.) — use DATABASE_URL
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    // maxUses:1 destroys connections immediately after use (no idle state).
    // In CF Workers, setTimeout callbacks from completed requests don't reliably
    // fire, so idleTimeoutMillis-based cleanup never runs. Without maxUses:1,
    // idle connections from completed requests accumulate and exhaust the DB
    // connection limit. With maxUses:1 there are no idle connections to accumulate.
    maxUses: ssl ? undefined : 1,
    idleTimeoutMillis: ssl ? 30000 : 1000,
    connectionTimeoutMillis: 10000,
    ssl: ssl ? true : false,
  })

  const adapter = new PrismaPg(pool)
  const client = new PrismaClient({ adapter })
  return client
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>

declare global {
  var __prisma: PrismaClientInstance | undefined
}

// In CF Workers, cloudflare:sockets I/O objects are bound to the request that
// created them — they CANNOT be shared across requests. pg Pool stores connections
// in _idle and hands them to the next request, which CF Workers rejects with
// "Cannot perform I/O on behalf of a different request."
//
// React.cache() scopes the memoized value to the current request context (works
// in Server Components, Route Handlers, and Server Actions). Each request gets
// its own PrismaClient/Pool with fresh cloudflare:sockets connections.
const getRequestPrisma = cache(createPrismaClient)

// Lazy factory — deferred until first property access so that getCloudflareContext()
// is called inside request context (where the CF env bindings are available).
function getPrisma(): PrismaClientInstance {
  if (process.env.NODE_ENV !== "production") {
    // In dev (Node.js), cache on globalThis to survive hot-module reload
    if (!globalThis.__prisma) {
      globalThis.__prisma = createPrismaClient()
    }
    return globalThis.__prisma
  }
  // In CF Workers: per-request instance via React.cache()
  return getRequestPrisma()
}

// Proxy preserves the PrismaClient API at all existing call sites while
// deferring actual client creation until first use (inside request context).
const prisma = new Proxy({} as PrismaClientInstance, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getPrisma() as any)[prop]
  },
})

export default prisma
