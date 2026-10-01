# Joey's Blog

This is a blog from [Tailwind Nextjs Starter Blog](https://github.com/timlrx/tailwind-nextjs-starter-blog) template

# Timeline

Short thoughts live in `data/timeline/*.md` and show up at `/timeline`, grouped by day and filterable by tag.

To post: run `npm run dev`, open http://localhost:3000/timeline/new, write (markdown works), pick tags, and hit Post (or ⌘/Ctrl+Enter). Then commit and push `data/timeline` to publish. The composer and its API only exist in dev; production builds return 404 for both.

Each entry is a plain markdown file you can also write or edit by hand:

```md
---
date: '2026-10-01T20:22'
tags:
  - ideas
draft: true # optional, hides the entry
---

The thought itself.
```

Requires Node 22 (see `.nvmrc`). The npm scripts set `NODE_OPTIONS=--openssl-legacy-provider`, which Next 11 needs on Node 17+.

# TODO

- [ ] image grid system for better image insertion
- [ ] email newsletter subscription
- [ ] Update Projects
