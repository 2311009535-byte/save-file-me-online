# Development and publication

- Develop and push preview batches on `save-file-me-preview`.
- `save-file-me-framework` is the existing Netlify production branch. Do not push,
  merge into it, or publish to production without an explicit batch release request.
- Preserve the production site while developing. Run local tests before pushing a
  preview batch. Preview builds may also consume Netlify credits; do not push every edit.
- Never claim a preview URL works until it has been requested successfully or the
  user confirms that the corresponding branch deploy is published and opens.
- This preview branch's `netlify.toml` skips production-context builds. An authorized
  release must deliberately remove that guard on the release branch and run validation.
- Use the existing checkout; do not create worktrees unless the user asks.
