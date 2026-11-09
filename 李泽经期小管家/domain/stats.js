// 「我的」页周期小报告（纯函数）：最近 6 次周期长度、平均痛经分、最常见症状
//
// 正常范围来源：knowledge-base/01-月经周期基础知识.md
//   - 成年女性正常周期 24–38 天（FIGO）
//   - 相邻周期差异一般 ≤7 天，部分年龄段 ≤9 天；这里取 9 天，避免不必要的焦虑

import { sortPeriods, averageCycleLength, averagePeriodLength } from './cycle.js'
import { addDays, diffDays } from './date.js'

const RECENT = 6
const NORMAL_MIN = 24
const NORMAL_MAX = 38
const MAX_VARIATION = 9
const BAR_FULL_DAYS = 45
const TOP_SYMPTOMS = 3

// 一次经期内记录到的最高疼痛分；没有记录返回 null
function maxPainInPeriod(period, logs, periodLength) {
	const end = period.end || addDays(period.start, periodLength - 1)
	let max = null
	for (let day = period.start; diffDays(end, day) >= 0; day = addDays(day, 1)) {
		const pain = logs[day] && logs[day].pain
		if (typeof pain === 'number' && (max === null || pain > max)) max = pain
	}
	return max
}

function topSymptoms(logs, sinceDate) {
	const counts = {}
	Object.keys(logs)
		.filter(day => !sinceDate || diffDays(day, sinceDate) >= 0)
		.forEach(day => (logs[day].symptoms || []).forEach(s => (counts[s] = (counts[s] || 0) + 1)))
	return Object.keys(counts)
		.map(name => ({ name, count: counts[name] }))
		.sort((a, b) => b.count - a.count)
		.slice(0, TOP_SYMPTOMS)
}

export function cycleStats(periods, logs, settings) {
	const sorted = sortPeriods(periods)
	const recentPeriods = sorted.slice(-RECENT)
	const periodLength = averagePeriodLength(sorted, settings.periodLength)

	const cycles = []
	for (let i = 1; i < sorted.length; i++) {
		const length = diffDays(sorted[i].start, sorted[i - 1].start)
		cycles.push({
			start: sorted[i - 1].start,
			length,
			normal: length >= NORMAL_MIN && length <= NORMAL_MAX,
			width: Math.round(Math.min(length / BAR_FULL_DAYS, 1) * 100)
		})
	}
	const recentCycles = cycles.slice(-RECENT)
	const lengths = recentCycles.map(c => c.length)

	const pains = recentPeriods.map(p => maxPainInPeriod(p, logs, periodLength)).filter(n => n !== null)
	const averagePain = pains.length ? Math.round((pains.reduce((a, b) => a + b, 0) / pains.length) * 10) / 10 : null

	return {
		cycles: recentCycles.reverse(), // 最近的在前
		averageCycle: averageCycleLength(sorted, settings.cycleLength),
		averagePeriod: periodLength,
		averagePain,
		topSymptoms: topSymptoms(logs, recentPeriods.length ? recentPeriods[0].start : null),
		irregular: lengths.length >= 3 && Math.max(...lengths) - Math.min(...lengths) > MAX_VARIATION
	}
}
