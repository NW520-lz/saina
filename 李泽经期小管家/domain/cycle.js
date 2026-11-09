// 月经周期推算（纯函数，不依赖 uni API，便于测试）
//
// 规则来源：knowledge-base/01-月经周期基础知识.md
//   - 排卵日 ≈ 下次月经开始日前 14 天
//   - 易孕期 = 排卵日前 5 天 ~ 排卵日后 1 天
//   - 平均周期取最近 6 个有效周期（15~60 天）的平均值
//
// periods: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' | null }]，按 start 升序

import { addDays, diffDays } from './date.js'

export const PHASE = {
	PERIOD: 'period', // 月经期（已记录）
	PREDICTED_PERIOD: 'predictedPeriod', // 预测月经期
	FOLLICULAR: 'follicular', // 卵泡期
	FERTILE: 'fertile', // 易孕期（非排卵日）
	OVULATION: 'ovulation', // 排卵日
	LUTEAL: 'luteal', // 黄体期
	UNKNOWN: 'unknown' // 没有记录，无法推算
}

const LUTEAL_DAYS = 14
const FERTILE_BEFORE = 5
const FERTILE_AFTER = 1
const RECENT_CYCLES = 6
const MIN_VALID_CYCLE = 15
const MAX_VALID_CYCLE = 60

function average(numbers) {
	return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length)
}

export function sortPeriods(periods) {
	return [...periods].sort((a, b) => diffDays(a.start, b.start))
}

export function averageCycleLength(periods, fallback) {
	const sorted = sortPeriods(periods)
	const lengths = []
	for (let i = 1; i < sorted.length; i++) {
		const length = diffDays(sorted[i].start, sorted[i - 1].start)
		if (length >= MIN_VALID_CYCLE && length <= MAX_VALID_CYCLE) lengths.push(length)
	}
	const recent = lengths.slice(-RECENT_CYCLES)
	return recent.length ? average(recent) : fallback
}

export function averagePeriodLength(periods, fallback) {
	const lengths = periods
		.filter(p => p.end)
		.map(p => diffDays(p.end, p.start) + 1)
		.filter(n => n >= 1 && n <= 15)
		.slice(-RECENT_CYCLES)
	return lengths.length ? average(lengths) : fallback
}

// 计算包含 date 的那个周期：{ start, periodEnd, nextStart, isPredicted }
function findCycle(date, sorted, cycleLength, periodLength) {
	let index = -1
	for (let i = 0; i < sorted.length; i++) {
		if (diffDays(date, sorted[i].start) >= 0) index = i
	}
	if (index === -1) return null

	const record = sorted[index]
	const recordEnd = record.end || addDays(record.start, periodLength - 1)
	const nextRecord = sorted[index + 1]
	if (nextRecord) {
		return { start: record.start, periodEnd: recordEnd, nextStart: nextRecord.start, isPredicted: false }
	}

	// 最后一次记录之后：按平均周期向后滚动预测
	const cyclesPassed = Math.floor(diffDays(date, record.start) / cycleLength)
	if (cyclesPassed === 0) {
		return { start: record.start, periodEnd: recordEnd, nextStart: addDays(record.start, cycleLength), isPredicted: false }
	}
	const start = addDays(record.start, cyclesPassed * cycleLength)
	return {
		start,
		periodEnd: addDays(start, periodLength - 1),
		nextStart: addDays(start, cycleLength),
		isPredicted: true
	}
}

// 计算某一天的周期信息
export function getDayInfo(date, periods, settings) {
	const sorted = sortPeriods(periods)
	const cycleLength = averageCycleLength(sorted, settings.cycleLength)
	const periodLength = averagePeriodLength(sorted, settings.periodLength)
	const cycle = findCycle(date, sorted, cycleLength, periodLength)

	if (!cycle) {
		return { date, phase: PHASE.UNKNOWN, cycleDay: null, daysToNextPeriod: null, cycleLength, periodLength }
	}

	// 排卵日不早于经期结束后一天（极短周期时的保护）
	let ovulationDate = addDays(cycle.nextStart, -LUTEAL_DAYS)
	if (diffDays(ovulationDate, cycle.periodEnd) <= 0) ovulationDate = addDays(cycle.periodEnd, 1)

	const fertileStart = addDays(ovulationDate, -FERTILE_BEFORE)
	const fertileEnd = addDays(ovulationDate, FERTILE_AFTER)
	const toOvulation = diffDays(ovulationDate, date)

	let phase
	if (diffDays(cycle.periodEnd, date) >= 0) {
		phase = cycle.isPredicted ? PHASE.PREDICTED_PERIOD : PHASE.PERIOD
	} else if (toOvulation === 0) {
		phase = PHASE.OVULATION
	} else if (diffDays(date, fertileStart) >= 0 && diffDays(fertileEnd, date) >= 0) {
		phase = PHASE.FERTILE
	} else if (toOvulation > 0) {
		phase = PHASE.FOLLICULAR
	} else {
		phase = PHASE.LUTEAL
	}

	return {
		date,
		phase,
		cycleDay: diffDays(date, cycle.start) + 1,
		daysToNextPeriod: diffDays(cycle.nextStart, date),
		nextPeriodStart: cycle.nextStart,
		ovulationDate,
		fertileStart,
		fertileEnd,
		cycleLength,
		periodLength
	}
}

// 首次引导：由「上次月经开始日 + 一般持续几天」生成第一条经期记录。
// 推算的结束日还没过时视为经期进行中（end 为 null），之后由用户点「月经走了」结束。
export function initialPeriod(lastStart, periodLength, todayStr) {
	const end = addDays(lastStart, periodLength - 1)
	return { start: lastStart, end: diffDays(end, todayStr) < 0 ? end : null }
}

// 当前是否处于「已开始但还没结束」的经期
export function ongoingPeriod(periods, date) {
	const last = sortPeriods(periods).pop()
	if (!last || last.end) return null
	return diffDays(date, last.start) >= 0 ? last : null
}
