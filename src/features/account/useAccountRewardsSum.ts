import {
  differenceInMinutes,
  formatDistanceToNowStrict,
  formatISO,
  parseISO,
  subDays,
} from 'date-fns'
import { useEffect, useState } from 'react'
import { useAccountRewardsSummaryQuery } from '../../generated/graphql'
import shortLocale from '../../utils/formatDistance'

const getRewardsDates = () => {
  const now = new Date()
  now.setMinutes(0)
  now.setSeconds(0)
  now.setMilliseconds(0)
  return {
    twoDaysAgo: formatISO(subDays(now, 2)),
    yesterday: formatISO(subDays(now, 1)),
    now: formatISO(now),
  }
}

export default (address?: string) => {
  const [rewardsDates, setRewardsDates] =
    useState<{ twoDaysAgo: string; yesterday: string; now: string }>()
  const [rewardsChange, setRewardsChange] =
    useState<{ minutesAgo: number; change: number; formattedChange: string }>()

  const { data: rewardsToday, error: errorToday } =
    useAccountRewardsSummaryQuery({
      variables: {
        address,
        minTime: rewardsDates?.yesterday,
        maxTime: rewardsDates?.now,
      },
      fetchPolicy: 'cache-first',
      skip: !address || !rewardsDates,
    })

  const { data: rewardsYesterday, error: errorYesterday } =
    useAccountRewardsSummaryQuery({
      fetchPolicy: 'cache-first',
      variables: {
        address,
        minTime: rewardsDates?.twoDaysAgo,
        maxTime: rewardsDates?.yesterday,
      },
      skip: !address || !rewardsDates,
    })

  useEffect(() => {
    if (!errorToday || !errorYesterday) return
    if (errorToday) console.error(errorToday)
    if (errorYesterday) console.error(errorYesterday)
  }, [errorToday, errorYesterday])

  useEffect(() => {
    setRewardsDates(getRewardsDates())

    const interval = setInterval(() => {
      const nextDates = getRewardsDates()

      setRewardsDates(nextDates)
    }, 60000) // Every 1 mins
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (
      rewardsToday?.accountRewardsSum?.data?.total === undefined ||
      rewardsYesterday?.accountRewardsSum?.data?.total === undefined ||
      !rewardsToday?.accountRewardsSum?.meta.maxTime
    ) {
      setRewardsChange(undefined)
      return
    }

    const {
      accountRewardsSum: {
        data: { total: today },
      },
    } = rewardsToday

    const {
      accountRewardsSum: {
        data: { total: yesterday },
      },
    } = rewardsYesterday

    const percentageChange = (current: number, previous: number) => {
      let result = 0

      if (current && previous) result = (current - previous) / current
      else if (current) result = current
      else if (previous) result = -previous

      const percentage = result * 100
      return Math.round(percentage * 100) / 100
    }

    const change = percentageChange(today, yesterday)
    const minutesAgo = differenceInMinutes(
      new Date(),
      parseISO(rewardsToday.accountRewardsSum.meta.maxTime),
    )

    const formattedChange = formatDistanceToNowStrict(
      parseISO(rewardsToday.accountRewardsSum.meta.maxTime),
      {
        locale: shortLocale,
        addSuffix: minutesAgo > 0,
      },
    )

    setRewardsChange({ change, minutesAgo, formattedChange })
  }, [rewardsToday, rewardsYesterday, rewardsDates])

  return { ...rewardsChange }
}
