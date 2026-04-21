import { getCloudflareContext } from "@opennextjs/cloudflare"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

function createPrismaClient() {
  let connectionString = process.env.DATABASE_URL!
  let ssl: boolean | object = true

  // In CF Workers, use Hyperdrive connection string.
  // Hyperdrive provides a local proxy (local dev) or CF-internal gateway (production)
  // that handles TLS to the database — no TLS needed from the Worker side.
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
    // max:1 forces sequential query execution — layout and page queries queue rather
    // than fail with "Connection terminated unexpectedly" from simultaneous SSL handshakes.
    max: 1,
    // 30s < pgbouncer server_idle_timeout (600s) — pool closes idle connections before
    // pgbouncer does, preventing stale-connection errors.
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
    ssl,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>

declare global {
  var __prisma: PrismaClientInstance | undefined
}

// Module-level instance for CF Workers isolate scope (production)
let _prisma: PrismaClientInstance | undefined

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
  // In CF Workers (production), one instance per isolate
  if (!_prisma) {
    _prisma = createPrismaClient()
  }
  return _prisma
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
