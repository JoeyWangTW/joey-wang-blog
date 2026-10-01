import { useMemo } from 'react'
import { getMDXComponent } from 'mdx-bundler/client'
import Image from './Image'
import CustomLink from './Link'
import Pre from './Pre'
import { TimelineEntry } from 'types/TimelineEntry'

const components = { Image, a: CustomLink, pre: Pre }

export const formatTime = (date: string) => date.slice(11, 16)

export const formatDay = (date: string) => {
  // Parse as a calendar date so the day never shifts with the viewer's timezone
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface Props {
  entry: TimelineEntry
  onTagClick?: (tag: string) => void
}

export default function TimelineItem({ entry, onTagClick }: Props) {
  const Body = useMemo(() => getMDXComponent(entry.mdxSource), [entry.mdxSource])

  return (
    <li id={entry.id} className="relative pb-8 pl-8 scroll-mt-24">
      <span
        aria-hidden="true"
        className="absolute left-0 top-2 w-3 h-3 -ml-1.5 rounded-full bg-primary-500 ring-4 ring-white dark:ring-gray-900"
      />
      <div className="flex items-center mb-1 space-x-3 text-sm text-gray-500 dark:text-gray-400">
        <a href={`#${entry.id}`} className="hover:text-primary-500">
          <time dateTime={entry.date}>{formatTime(entry.date)}</time>
        </a>
        {entry.draft && (
          <span className="px-1.5 text-xs font-medium uppercase rounded bg-yellow-100 text-yellow-800">
            Draft
          </span>
        )}
      </div>
      <div className="prose max-w-none dark:prose-dark">
        <Body components={components} />
      </div>
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap mt-2">
          {entry.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick?.(tag)}
              className="mr-3 text-sm font-medium uppercase text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            >
              #{tag.split(' ').join('-')}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}
