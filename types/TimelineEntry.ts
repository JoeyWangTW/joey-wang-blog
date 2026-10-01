export type TimelineEntry = {
  id: string
  // Local wall-clock time, 'YYYY-MM-DDTHH:mm', shown exactly as written (no timezone conversion)
  date: string
  tags: string[]
  draft?: boolean
  mdxSource: string
}
