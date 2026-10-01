import { useRouter } from 'next/router'
import { GetStaticProps, InferGetStaticPropsType } from 'next'
import { PageSEO } from '@/components/SEO'
import TimelineItem, { formatDay } from '@/components/TimelineItem'
import siteMetadata from '@/data/siteMetadata'
import { getTimelineEntries, getTimelineTags } from '@/lib/timeline'
import kebabCase from '@/lib/utils/kebabCase'
import { TimelineEntry } from 'types/TimelineEntry'

export const getStaticProps: GetStaticProps<{
  entries: TimelineEntry[]
  tags: Record<string, number>
}> = async () => {
  const entries = await getTimelineEntries()
  return { props: { entries, tags: getTimelineTags(entries) } }
}

export default function Timeline({
  entries,
  tags,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter()
  const activeTag = typeof router.query.tag === 'string' ? router.query.tag : null

  const setTag = (tag: string | null) => {
    router.replace(tag ? { pathname: '/timeline', query: { tag } } : '/timeline', undefined, {
      shallow: true,
      scroll: false,
    })
  }

  const visibleEntries = activeTag
    ? entries.filter((entry) => entry.tags.map((t) => kebabCase(t)).includes(activeTag))
    : entries

  // Group entries by calendar day, preserving newest-first order
  const days: { day: string; entries: TimelineEntry[] }[] = []
  visibleEntries.forEach((entry) => {
    const day = entry.date.slice(0, 10)
    const last = days[days.length - 1]
    if (last && last.day === day) last.entries.push(entry)
    else days.push({ day, entries: [entry] })
  })

  const sortedTags = Object.keys(tags).sort((a, b) => tags[b] - tags[a])

  return (
    <>
      <PageSEO
        title={`Timeline - ${siteMetadata.author}`}
        description="Short thoughts and notes, as they happen"
      />
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="pt-6 pb-8 space-y-2 md:space-y-5">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14">
            Timeline
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            Small pieces of thoughts, as they happen.
          </p>
          {sortedTags.length > 0 && (
            <div className="flex flex-wrap pt-2">
              <button
                type="button"
                onClick={() => setTag(null)}
                className={`mr-2 mb-2 px-3 py-1 text-sm rounded-full border ${
                  !activeTag
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                All ({entries.length})
              </button>
              {sortedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTag(activeTag === tag ? null : tag)}
                  className={`mr-2 mb-2 px-3 py-1 text-sm rounded-full border ${
                    activeTag === tag
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  #{tag} ({tags[tag]})
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="pt-8">
          {!visibleEntries.length && (
            <p className="text-gray-500 dark:text-gray-400">Nothing here yet.</p>
          )}
          {days.map(({ day, entries: dayEntries }) => (
            <section key={day} className="mb-6">
              <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                {formatDay(day)}
              </h2>
              <ol className="ml-1.5 border-l border-gray-200 dark:border-gray-700">
                {dayEntries.map((entry) => (
                  <TimelineItem
                    key={entry.id}
                    entry={entry}
                    onTagClick={(tag) => setTag(kebabCase(tag))}
                  />
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}
