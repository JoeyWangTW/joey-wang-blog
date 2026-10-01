import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import { TimelineEntry } from 'types/TimelineEntry'
import { bundleMarkdown, dateSortDesc } from './mdx'
import kebabCase from './utils/kebabCase'

const timelineDir = path.join(process.cwd(), 'data', 'timeline')

const pad = (n: number) => ('0' + n).slice(-2)

// gray-matter parses unquoted dates into Date objects; normalize back to 'YYYY-MM-DDTHH:mm'
function normalizeDate(date: unknown) {
  if (date instanceof Date) {
    return [
      date.getUTCFullYear(),
      '-',
      pad(date.getUTCMonth() + 1),
      '-',
      pad(date.getUTCDate()),
      'T',
      pad(date.getUTCHours()),
      ':',
      pad(date.getUTCMinutes()),
    ].join('')
  }
  return String(date ?? '').slice(0, 16)
}

function listEntryFiles() {
  if (!fs.existsSync(timelineDir)) return []
  return fs.readdirSync(timelineDir).filter((file) => /\.mdx?$/.test(file))
}

export async function getTimelineEntries({ includeDrafts = false } = {}) {
  const entries: TimelineEntry[] = []
  for (const file of listEntryFiles()) {
    const source = fs.readFileSync(path.join(timelineDir, file), 'utf8')
    const { data } = matter(source)
    if (data.draft === true && !includeDrafts) continue
    const { code } = await bundleMarkdown(source)
    entries.push({
      id: file.replace(/\.mdx?$/, ''),
      date: normalizeDate(data.date),
      tags: data.tags || [],
      draft: data.draft === true,
      mdxSource: code,
    })
  }
  // ids embed seconds, so they break ties between entries posted in the same minute
  return entries.sort((a, b) => dateSortDesc(a.date, b.date) || dateSortDesc(a.id, b.id))
}

export function getTimelineTags(entries: TimelineEntry[]) {
  const tagCount: Record<string, number> = {}
  entries.forEach((entry) =>
    entry.tags.forEach((tag) => {
      const formattedTag = kebabCase(tag)
      tagCount[formattedTag] = (tagCount[formattedTag] || 0) + 1
    })
  )
  return tagCount
}

export function writeTimelineEntry({
  body,
  tags,
  draft = false,
  now = new Date(),
}: {
  body: string
  tags: string[]
  draft?: boolean
  now?: Date
}) {
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`
  const baseId = `${date.replace(':', '')}${pad(now.getSeconds())}`

  fs.mkdirSync(timelineDir, { recursive: true })
  let id = baseId
  for (let i = 2; fs.existsSync(path.join(timelineDir, `${id}.md`)); i++) {
    id = `${baseId}-${i}`
  }

  const frontMatter: Record<string, unknown> = { date, tags }
  if (draft) frontMatter.draft = true
  const filePath = path.join(timelineDir, `${id}.md`)
  fs.writeFileSync(filePath, matter.stringify(body.trim() + '\n', frontMatter), { flag: 'wx' })
  return { id, filePath: path.relative(process.cwd(), filePath) }
}
