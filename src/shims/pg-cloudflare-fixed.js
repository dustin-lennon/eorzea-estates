'use strict'

/**
 * Fixed version of pg-cloudflare/dist/index.js.
 *
 * The upstream _listen() loop silently breaks when the readable stream ends
 * (done=true) without emitting 'end' or 'close'. This leaves pg Pool holding
 * a zombie connection: pg thinks it's alive but the backend (Supabase) already
 * closed the TLS session. The next query on that connection hangs forever.
 *
 * Fix: emit 'end' when done=true so pg removes the dead connection and creates
 * a fresh one. All other code is identical to the upstream release.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const events_1 = require("events")

class CloudflareSocket extends events_1.EventEmitter {
  constructor(ssl) {
    super()
    this.ssl = ssl
    this.writable = false
    this.destroyed = false
    this._upgrading = false
    this._upgraded = false
    this._cfSocket = null
    this._cfWriter = null
    this._cfReader = null
  }

  setNoDelay()    { return this }
  setKeepAlive()  { return this }
  ref()           { return this }
  unref()         { return this }

  async connect(port, host, connectListener) {
    try {
      if (connectListener) this.once('connect', connectListener)
      const options = this.ssl ? { secureTransport: 'starttls' } : {}
      const mod = await import('cloudflare:sockets')
      const connect = mod.connect
      this._cfSocket = connect(`${host}:${port}`, options)
      this._cfWriter = this._cfSocket.writable.getWriter()
      this._addClosedHandler()
      this._cfReader = this._cfSocket.readable.getReader()
      if (this.ssl) {
        this._listenOnce().catch((e) => this.emit('error', e))
      } else {
        this._listen().catch((e) => this.emit('error', e))
      }
      await this._cfWriter.ready
      this.writable = true
      this.emit('connect')
      return this
    } catch (e) {
      this.emit('error', e)
    }
  }

  async _listen() {
    while (true) {
      const { done, value } = await this._cfReader.read()
      if (done) {
        // pg Pool only removes idle connections on 'error', not 'end'.
        // Emit 'error' so the idleListener fires and removes this zombie connection.
        this.emit('error', Object.assign(new Error('Connection closed by server'), { code: 'ECONNRESET' }))
        break
      }
      this.emit('data', Buffer.from(value))
    }
  }

  async _listenOnce() {
    const { done, value } = await this._cfReader.read()
    if (!done) this.emit('data', Buffer.from(value))
  }

  write(data, encoding = 'utf8', callback = () => {}) {
    if (data.length === 0) return callback()
    if (typeof data === 'string') data = Buffer.from(data, encoding)
    this._cfWriter.write(data).then(
      ()    => { callback() },
      (err) => { callback(err) }
    )
    return true
  }

  end(data = Buffer.alloc(0), encoding = 'utf8', callback = () => {}) {
    this.write(data, encoding, (err) => {
      this._cfSocket.close()
      if (callback) callback(err)
    })
    return this
  }

  destroy(reason) {
    this.destroyed = true
    return this.end()
  }

  startTls(options) {
    if (this._upgraded) {
      this.emit('error', 'Cannot call `startTls()` more than once on a socket')
      return
    }
    this._cfWriter.releaseLock()
    this._cfReader.releaseLock()
    this._upgrading = true
    this._cfSocket = this._cfSocket.startTls(options)
    this._cfWriter = this._cfSocket.writable.getWriter()
    this._cfReader = this._cfSocket.readable.getReader()
    this._addClosedHandler()
    this._listen().catch((e) => this.emit('error', e))
  }

  _addClosedHandler() {
    this._cfSocket.closed.then(() => {
      if (!this._upgrading) {
        this._cfSocket = null
        this.emit('close')
      } else {
        this._upgrading = false
        this._upgraded = true
      }
    }).catch((e) => this.emit('error', e))
  }
}

exports.CloudflareSocket = CloudflareSocket
