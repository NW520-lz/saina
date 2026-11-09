// 首次引导、快速打卡、周期报告、提醒预约、小纸条、备份
// 运行：node --test tests/*.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { initialPeriod, getDayInfo, PHASE } from '../李泽经期小管家/domain/cycle.js'
import { logOverview, QUICK_LOG_FIELDS } from '../李泽经期小管家/domain/phases.js'
import { cycleStats } from '../李泽经期小管家/domain/stats.js'
import { upcomingReminders } from '../李泽经期小管家/domain/reminders.js'
import { TRIGGER, activeTriggers, checkInStreak, pickNote } from '../李泽经期小管家/domain/notes.js'
import { LOVE_NOTES } from '../李泽经期小管家/content/love-notes.js'
import { buildBackup, parseBackup } from '../李泽经期小管家/services/backup.js'
import { describeLog } from '../李泽经期小管家/services/ai/prompts.js'

const settings = { nickname: '赛娜', cycleLength: 28, periodLength: 5 }

// ---- 首次引导 ----
test('引导：经期已经结束时补上结束日', () => {
	assert.deepEqual(initialPeriod('2026-11-01', 5, '2026-11-09'), { start: '2026-11-01', end: '2026-11-05' })
})

test('引导：推算的结束日还没过，视为经期进行中', () => {
	assert.deepEqual(initialPeriod('2026-11-07', 5, '2026-11-09'), { start: '2026-11-07', end: null })
	assert.equal(initialPeriod('2026-11-05', 5, '2026-11-09').end, null) // 今天正好是第 5 天
})

// ---- 快速打卡 ----
test('快速打卡只记了心情时，其余三项仍显示未记录', () => {
	const tiles = logOverview({ mood: 'sad' })
	assert.deepEqual(tiles.map(t => t.tone), ['none', 'none', 'warn', 'none'])
	assert.equal(describeLog({ mood: 'sad' }), '心情低落')
})

test('疼痛 0 分和经量「没有」也算已记录', () => {
	const tiles = logOverview({ flow: 0, pain: 0 })
	assert.equal(tiles[0].value, '没有')
	assert.equal(tiles[1].value, '0/10')
})

test('快速打卡四个字段都有选项', () => {
	for (const key of ['flow', 'pain', 'mood', 'sleep']) assert.ok(QUICK_LOG_FIELDS[key].options.length >= 4, key)
})

// ---- 周期报告 ----
test('周期报告：周期长度、平均痛经、常见症状', () => {
	const periods = [
		{ start: '2026-08-01', end: '2026-08-05' },
		{ start: '2026-08-30', end: '2026-09-03' }, // 29
		{ start: '2026-09-28', end: '2026-10-02' } // 29
	]
	const logs = {
		'2026-08-02': { pain: 6, symptoms: ['腹痛'] },
		'2026-08-03': { pain: 8, symptoms: ['腹痛', '腰酸'] },
		'2026-09-29': { pain: 4, symptoms: ['腹痛'] }
	}
	const stats = cycleStats(periods, logs, settings)
	assert.deepEqual(stats.cycles.map(c => c.length), [29, 29])
	assert.equal(stats.cycles[0].start, '2026-08-30') // 最近的在前
	assert.ok(stats.cycles.every(c => c.normal))
	assert.equal(stats.averageCycle, 29)
	assert.equal(stats.averagePain, 6) // 每次经期取最高分：8 和 4
	assert.deepEqual(stats.topSymptoms[0], { name: '腹痛', count: 3 })
	assert.equal(stats.irregular, false)
})

test('周期报告：波动超过 9 天提示不规律，超出 24–38 天标记', () => {
	const periods = ['2026-05-01', '2026-05-23', '2026-06-30', '2026-07-28'].map(start => ({ start, end: null }))
	const stats = cycleStats(periods, {}, settings)
	assert.deepEqual(stats.cycles.map(c => c.length), [28, 38, 22])
	assert.equal(stats.cycles[2].normal, false)
	assert.equal(stats.irregular, true)
	assert.equal(stats.averagePain, null)
})

// ---- 提醒预约 ----
test('提醒：预约经期前 3 天、前 1 天、预测经期第 1 天', () => {
	const periods = [{ start: '2026-11-01', end: '2026-11-05' }] // 下次 11-29
	const list = upcomingReminders({ date: '2026-11-20', hour: 10 }, periods, settings, 10)
	assert.deepEqual(list.map(r => `${r.date} ${r.hour}`), ['2026-11-26 20', '2026-11-28 20', '2026-11-29 9'])
	assert.match(list[1].text, /明天/)
})

test('提醒：今天的提醒时间已过就不再预约', () => {
	const periods = [{ start: '2026-11-01', end: '2026-11-05' }]
	assert.equal(upcomingReminders({ date: '2026-11-26', hour: 21 }, periods, settings, 0).length, 0)
	assert.equal(upcomingReminders({ date: '2026-11-26', hour: 19 }, periods, settings, 0).length, 1)
	assert.equal(upcomingReminders({ date: '2026-11-26', hour: 10 }, [], settings, 10).length, 0)
})

// ---- 小纸条 ----
test('纸条文件里的 when 都是有效的触发时机，且每个时机都有纸条', () => {
	const valid = Object.values(TRIGGER)
	LOVE_NOTES.forEach(n => assert.ok(valid.includes(n.when), `无效的 when：${n.when}`))
	valid.forEach(t => assert.ok(LOVE_NOTES.some(n => n.when === t), `缺少纸条：${t}`))
})

test('连续打卡天数', () => {
	const logs = { '2026-11-07': {}, '2026-11-08': {}, '2026-11-09': {} }
	assert.equal(checkInStreak(logs, '2026-11-09'), 3)
	assert.equal(checkInStreak(logs, '2026-11-10'), 0)
})

test('触发时机：经期第 1 天又很痛，先递「很痛」再递「第 1 天」', () => {
	const periods = [{ start: '2026-11-09', end: null }]
	const info = getDayInfo('2026-11-09', periods, settings)
	const triggers = activeTriggers({ date: '2026-11-09', info, periods, log: { pain: 8 }, streak: 1 })
	assert.deepEqual(triggers, [TRIGGER.PAIN, TRIGGER.PERIOD_START])
})

test('触发时机：经前 3 天、经期结束、连续打卡 7 天', () => {
	const periods = [{ start: '2026-11-01', end: '2026-11-05' }]
	const pre = getDayInfo('2026-11-26', periods, settings)
	assert.deepEqual(activeTriggers({ date: '2026-11-26', info: pre, periods, log: null, streak: 7 }), [TRIGGER.STREAK, TRIGGER.PREMENSTRUAL])

	const end = getDayInfo('2026-11-05', periods, settings)
	assert.equal(end.phase, PHASE.PERIOD)
	assert.deepEqual(activeTriggers({ date: '2026-11-05', info: end, periods, log: null, streak: 0 }), [TRIGGER.PERIOD_END]) // 结束当天不再递「经期中」
})

test('挑纸条：同一时机每天一张，轮流挑最久没看过的', () => {
	const notes = [
		{ when: 'mood', text: 'A' },
		{ when: 'mood', text: 'B' },
		{ when: 'pain', text: 'C' }
	]
	assert.equal(pickNote(['mood'], notes, [], '2026-11-09').text, 'A')

	const history = [{ when: 'mood', text: 'A', date: '2026-11-08' }]
	assert.equal(pickNote(['mood'], notes, history, '2026-11-09').text, 'B')

	const later = [...history, { when: 'mood', text: 'B', date: '2026-11-09' }]
	assert.equal(pickNote(['mood'], notes, later, '2026-11-09'), null) // 今天已经递过
	assert.equal(pickNote(['mood', 'pain'], notes, later, '2026-11-09').text, 'C')
	assert.equal(pickNote(['mood'], notes, later, '2026-11-10').text, 'A') // 都看过了，回到最久没看的
})

// ---- 备份 ----
test('备份可以原样恢复，格式不对时给出友好提示', () => {
	const data = { settings: { nickname: '赛娜' }, periods: [{ start: '2026-11-01', end: null }], logs: { '2026-11-01': { pain: 3 } }, notes: [] }
	const parsed = parseBackup(buildBackup(data, '2026-11-09'))
	assert.deepEqual(parsed, { ...data, exportedAt: '2026-11-09' })

	assert.throws(() => parseBackup('你好'), /不是小管家的备份/)
	assert.throws(() => parseBackup('{"app":"other"}'), /不是小管家的备份/)
	assert.throws(() => parseBackup('{"app":"lize-period-backup","periods":"x"}'), /不完整/)
})
