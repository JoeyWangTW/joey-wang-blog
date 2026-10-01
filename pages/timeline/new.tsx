import React, { useCallback, useEffect, useState } from 'react'
import { GetStaticProps } from 'next'
import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import TimelineItem, { formatDay } from '@/components/TimelineItem'
import { TimelineEntry } from 'types/TimelineEntry'

// The composer writes files to data/timeline, so it only exists under `npm run dev`
export const getStaticProps: GetStaticProps = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return { notFound: true }
  }
  return { props: {} }
}

const parseTags = (input: string) =>
  Array.from(
    new Set(
      input
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    )
  )

export default function NewTimelineEntry() {
  const [body, setBody] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [draft, setDraft] = useState(false)
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [recent, setRecent] = useState<TimelineEntry[]>([])
  const [knownTags, setKnownTags] = useState<Record<string, number>>({})

  const refresh = useCallback(async () => {
    const res = await fetch('/api/timeline')
    if (!res.ok) return
    const data = await res.json()
    setRecent(data.entries)
    setKnownTags(data.tags)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const currentTags = parseTags(tagInput)

  const toggleTag = (tag: string) => {
    const next = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag]
    setTagInput(next.join(', '))
  }

  const submit = async () => {
    if (!body.trim() || submitting) return
    setSubmitting(true)
    setStatus(null)
    try {
      const res = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, tags: currentTags, draft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      setStatus({ type: 'ok', message: `Saved to ${data.filePath}` })
      setBody('')
      await refresh()
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const submitOnCmdEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
  }

  const sortedKnownTags = Object.keys(knownTags).sort((a, b) => knownTags[b] - knownTags[a])

  return (
    <>
      <PageSEO title="New timeline entry" description="Post to the timeline" />
      <form
        className="pt-6 pb-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
            New entry
          </h1>
          <Link href="/timeline" className="text-primary-500 hover:text-primary-600">
            View timeline &rarr;
          </Link>
        </div>
        <textarea
          aria-label="Entry"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={submitOnCmdEnter}
          rows={6}
          // Personal composer: start typing immediately
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          placeholder="What's on your mind? Markdown works."
          className="block w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
        />
        <input
          aria-label="Tags"
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={submitOnCmdEnter}
          placeholder="Tags, comma separated"
          className="block w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-700 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
        />
        {sortedKnownTags.length > 0 && (
          <div className="flex flex-wrap">
            {sortedKnownTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`mr-2 mb-2 px-3 py-1 text-sm rounded-full border ${
                  currentTags.includes(tag)
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
              className="rounded text-primary-500"
            />
            <span>Save as draft (hidden from the site)</span>
          </label>
          <button
            type="submit"
            disabled={!body.trim() || submitting}
            className="px-4 py-2 font-medium text-white rounded-md bg-primary-500 hover:bg-primary-600 disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post'}
            <span className="hidden ml-2 text-xs opacity-75 sm:inline">⌘↵</span>
          </button>
        </div>
        {status && (
          <p
            className={`text-sm ${status.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}
            role="status"
          >
            {status.message}
          </p>
        )}
      </form>
      {recent.length > 0 && (
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
            Recent
          </h2>
          <ol className="ml-1.5 border-l border-gray-200 dark:border-gray-700">
            {recent.map((entry) => (
              <TimelineItem key={entry.id} entry={entry} />
            ))}
          </ol>
          <p className="mt-2 text-xs text-gray-500">
            Latest: {formatDay(recent[0].date)}. Commit and push <code>data/timeline</code> to
            publish.
          </p>
        </div>
      )}
    </>
  )
}
