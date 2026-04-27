// Date and time formatting utilities

export const MANILA_TIME_ZONE = 'Asia/Manila'

export const parseBackendDate = (value) => {
  if (!value) return null
  const hasZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value)
  const parsed = new Date(hasZone ? value : `${value}Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const MANILA_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

export const MANILA_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

export const MANILA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export const MANILA_DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const parseDateKeyToUtcDate = (dateKey) => {
  if (!dateKey) return null
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

export const formatUtcDateToDateKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`

export const shiftDateKeyByDays = (dateKey, days) => {
  const date = parseDateKeyToUtcDate(dateKey)
  if (!date) return dateKey
  date.setUTCDate(date.getUTCDate() + days)
  return formatUtcDateToDateKey(date)
}

export const getWeekRangeFromDateKey = (dateKey) => {
  const date = parseDateKeyToUtcDate(dateKey)
  if (!date) {
    return { startKey: '', endKey: '' }
  }

  const weekday = date.getUTCDay()
  const daysFromMonday = (weekday + 6) % 7
  const weekStart = new Date(date)
  weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday)

  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)

  return {
    startKey: formatUtcDateToDateKey(weekStart),
    endKey: formatUtcDateToDateKey(weekEnd),
  }
}

export const formatTimeShort = (value) => {
  if (!value) return '—'
  const date = parseBackendDate(value)
  if (!date) return '—'
  return MANILA_TIME_FORMATTER.format(date)
}

export const formatDate = (value) => {
  const date = parseBackendDate(value)
  if (!date) return '—'
  return MANILA_DATE_FORMATTER.format(date)
}

export const formatDateTime = (value) => {
  const date = parseBackendDate(value)
  if (!date) return '—'
  return MANILA_DATE_TIME_FORMATTER.format(date)
}

export const getDateOnly = (dateString) => {
  const date = parseBackendDate(dateString)
  if (!date) return ''
  return MANILA_DATE_KEY_FORMATTER.format(date)
}
