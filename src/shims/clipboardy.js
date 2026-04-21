// Stub for clipboardy — not needed in Cloudflare Workers.
// regex-translator (a dependency of @xivapi/nodestone) pulls in clipboardy
// for its CLI clipboard feature. The real clipboardy detects system arch via
// child_process.execSync at import time, which is not available in CF Workers.
module.exports = {
  read: () => Promise.resolve(''),
  write: () => Promise.resolve(),
  readSync: () => '',
  writeSync: () => {},
  toggle: null,
};
