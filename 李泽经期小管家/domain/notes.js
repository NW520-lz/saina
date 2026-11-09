// 「小纸条」触发规则（纯函数）。纸条内容在 content/love-notes.js。
//
// 规则：
//   - 每个触发时机每天最多递一张纸条
//   - 同一个时机有多张纸条时，挑最久没看过的（没看过的最优先，按文件里的顺序）
//   - 纸条用文字本身识别，改了文字就算一张新纸条

import { PHASE } from './cycle.js'
import { addDays } from './date.js'
import { isLowMood } from './phases.js'

export const TRIGGER = {
	PAIN: 'pain', // 今天疼痛 ≥ 7
	MOOD: 'mood', // 今天心情低落 / 焦虑 / 烦躁
	PERIOD_START: 'periodStart', // 经期第 1 天
	PERIOD_END: 'periodEnd', // 今天记录了月经结束
	STREAK: 'streak', // 连续打卡满 7、14、21… 天
	PREMENSTRUAL: 'premenstrual', // 预计 1–3 天后来月经
	PERIOD: 'period' // 经期第 2 天起
}

const PAIN_THRESHOLD = 7
const STREAK_STEP = 7
const PREMENSTRUAL_DAYS = 3

// 截至 date 连续打卡的天数（date 当天没打卡则为 0）
export function checkInStreak(logs, date) {
	let streak = 0
	while (logs[addDays(date, -streak)]) streak++
	return streak
}

// 今天命中的触发时机，按优先级排序：先照顾此刻的难受，再是特别的日子
export function activeTriggers({ date, info, periods, log, streak }) {
	const list = []
	if (log && log.pain >= PAIN_THRESHOLD) list.push(TRIGGER.PAIN)
	if (log && isLowMood(log.mood)) list.push(TRIGGER.MOOD)
	if (info.phase === PHASE.PERIOD && info.cycleDay === 1) list.push(TRIGGER.PERIOD_START)
	const endedToday = periods.some(p => p.end === date)
	if (endedToday) list.push(TRIGGER.PERIOD_END)
	if (streak > 0 && streak % STREAK_STEP === 0) list.push(TRIGGER.STREAK)
	const inPeriod = info.phase === PHASE.PERIOD || info.phase === PHASE.PREDICTED_PERIOD
	if (!inPeriod && info.daysToNextPeriod >= 1 && info.daysToNextPeriod <= PREMENSTRUAL_DAYS) list.push(TRIGGER.PREMENSTRUAL)
	if (info.phase === PHASE.PERIOD && info.cycleDay > 1 && !endedToday) list.push(TRIGGER.PERIOD)
	return list
}

// history: [{ when, text, date }]，按时间顺序追加
function lastShownIndex(text, history) {
	for (let i = history.length - 1; i >= 0; i--) {
		if (history[i].text === text) return i
	}
	return -1
}

// 返回今天要递的纸条 { when, text }，没有则返回 null
export function pickNote(triggers, notes, history, date) {
	const firedToday = history.filter(h => h.date === date).map(h => h.when)
	for (const trigger of triggers) {
		if (firedToday.includes(trigger)) continue
		const candidates = notes.filter(n => n.when === trigger)
		if (!candidates.length) continue
		return candidates.reduce((best, note) => (lastShownIndex(note.text, history) < lastShownIndex(best.text, history) ? note : best))
	}
	return null
}
