module.exports = {
  extends: ['@commitlint/config-conventional'],
  // ignore commit messages that look like dependabot or auto-generated bump PR descriptions
  ignores: [
    (commit) => /Signed-off-by: dependabot\[bot\]/.test(commit),
    (commit) => /^Bumps \[.*\]\(https?:\/\//.test(commit),
    (commit) => /^Merge pull request #\d+/.test(commit)
  ],
  rules: {
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    // optionally tighten types by uncommenting:
    // 'type-enum': [2, 'always', ['chore','feat','fix','docs','style','refactor','perf','test','ci']]
  }
};
