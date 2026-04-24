'use strict'

/**
 * Minimal axios shim for CF Workers using the fetch() API.
 *
 * @xivapi/nodestone uses axios.get(url) to fetch Lodestone HTML pages.
 * The real axios uses Node.js http/https modules which are not reliably
 * available in CF Workers. This shim replaces axios.get() with fetch().
 *
 * Only implements axios.get() since that's all nodestone uses.
 * Error shape matches axios so nodestone's .catch(err => err.response.status) works.
 */

const axiosShim = {
  async get(url, config) {
    let response
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...(config?.headers || {}),
        },
      })
    } catch (err) {
      const error = new Error(String(err))
      error.response = { status: 0, data: null }
      throw error
    }
    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`)
      error.response = { status: response.status, data: null }
      throw error
    }
    const data = await response.text()
    return { data, status: response.status, headers: Object.fromEntries(response.headers) }
  },
}

axiosShim.default = axiosShim
axiosShim.create = () => axiosShim

module.exports = axiosShim
