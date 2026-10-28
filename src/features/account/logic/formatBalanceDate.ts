// Balance history dates are UTC days, so format the UTC calendar day.
// Leave `locale` unset to use the device locale.
export const formatBalanceDate = (date: string, locale?: string) => {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed)
}
