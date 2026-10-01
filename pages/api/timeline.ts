import { NextApiRequest, NextApiResponse } from 'next'
import { getTimelineEntries, getTimelineTags, writeTimelineEntry } from '@/lib/timeline'

// Posting writes a markdown file into data/timeline, so it only works when running `npm run dev`
// locally. In production builds this route always 404s.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).end()
  }

  if (req.method === 'GET') {
    const entries = await getTimelineEntries({ includeDrafts: true })
    return res.status(200).json({ entries: entries.slice(0, 10), tags: getTimelineTags(entries) })
  }

  if (req.method === 'POST') {
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
    if (!body) {
      return res.status(400).json({ error: 'Entry body is empty' })
    }
    const rawTags: unknown[] = Array.isArray(req.body.tags) ? req.body.tags : []
    const tags = Array.from(
      new Set(
        rawTags
          .filter((t): t is string => typeof t === 'string')
          .map((t) => t.trim())
          .filter(Boolean)
      )
    )
    const result = writeTimelineEntry({ body, tags, draft: req.body.draft === true })
    return res.status(201).json(result)
  }

  res.setHeader('Allow', 'GET, POST')
  return res.status(405).end()
}
