# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal terminal-based daily-work hub for Enea Gjoka (Salesfive). Used to draft
work across domains — building, architecture, sales, misc — and to publish individual
pages as **password-protected, shareable links** for colleagues, instead of emailing
a fresh Excel/PDF each time. A page is published once; updating it re-uses the same
URL and password so the recipient just refreshes.

## The privacy model (read this first)

The GitHub repo `eneag-sf/desk` is **public** (free GitHub Pages requires a public repo).
Confidentiality comes from two rules that must never be broken:

1. **`work/` is git-ignored and never pushed.** All raw, sensitive material — drafts,
   real numbers, client notes, and the password store — lives under `work/` and stays
   on this Mac only. Never `git add -f` anything under `work/`.
2. **Only encrypted pages are published.** Files in `docs/` are AES-256-GCM ciphertext
   produced by `bin/publish`. Never hand-write or copy plaintext content into `docs/`.

Consequence: `work/` is **not backed up to GitHub** (rely on local/Time Machine backup).

## Layout

```
bin/            publish · unpublish · new · setup   (the only commands you run)
bin/lib/        encrypt.mjs — zero-dep AES-GCM encryptor (Web Crypto)
templates/      page.html (base doc) · secure-wrapper.html (browser decrypt shell)
work/           PRIVATE, local-only. Drafts by domain: building/ architecture/ sales/ misc/
work/.desk/     passwords.json — ONE shared memorable password (key `_house`) + per-page records, git-ignored
docs/           PUBLIC. Encrypted published pages only. Served by GitHub Pages from /docs
desk.config.json  owner/repo/pagesBase used to build share URLs
```

## Commands

```bash
bin/new <domain/path> <slug> ["Title"]   # scaffold work/<domain>/<slug>.html from template
bin/publish <input.html> <slug>          # encrypt → docs/<slug>.html → commit → push → print link+password
bin/publish <input.html> <slug> --password <pw>   # set/replace the ONE shared memorable password (used for every page)
bin/unpublish <slug>                     # remove the page, push; link goes dead
bin/setup [<git-remote-url>]             # one-time GitHub connection (no arg = print instructions)
```

Published URL pattern: `https://eneag-sf.github.io/desk/<slug>.html`

## How crypto works (keep both sides in sync)

`bin/lib/encrypt.mjs` (Node) and `templates/secure-wrapper.html` (browser) implement the
**same** scheme: PBKDF2-SHA-256 (250k iterations) → AES-256-GCM, with random salt+IV
stored base64 in a JSON payload injected at `__DESK_PAYLOAD__`. If you change iterations,
hash, or cipher in one file you MUST change the other or every page fails to decrypt.

## When the user asks to publish / share something

1. The source must be a full standalone HTML file under `work/` (use `bin/new` or write one).
2. Pick a stable kebab-case `slug` — re-using it keeps the same URL + password.
3. Run `bin/publish`. Relay the **link and password on separate lines** and remind the
   user to send the password through a different channel than the link.
4. To update: edit the `work/` file and run `bin/publish` again with the same slug.

## Conventions

- Documents are self-contained HTML with inline `<style>` (no external assets — they
  must survive encryption and render standalone). Keep the clean look of `templates/page.html`.
- Slugs: lowercase letters, digits, dashes only (enforced by the scripts).
- Client-specific work goes under `work/sales/<client>/`. Real client names live only in
  `work/` (git-ignored) — never in tracked files, commit messages, or published slugs/URLs.
