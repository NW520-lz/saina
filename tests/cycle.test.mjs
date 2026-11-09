// 运行：node --test tests/*.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { getDayInfo, averageCycleLength, averagePeriodLength, ongoingPeriod, PHASE } from '../李泽经期小管家/domain/cycle.js'
import { addDays, diffDays, daysInMonth, weekdayOf } from '../李泽经期小管家/domain/date.js'

const settings = { cycleLength: 28, periodLength: 5 }

test('日期工具：跨月跨年加减', () => {
	assert.equal(addDays('2026-12-30', 3), '2027-01-02')
	assert.equal(addDays('2028-03-01', -1), '2028-02-29')
	assert.equal(diffDays('2026-11-09', '2026-10-31'), 9)
	assert.equal(daysInMonth(2026, 2).length, 28)
	assert.equal(weekdayOf('2026-11-09'), 1) // 周一
})

test('没有任何记录时返回 unknown', () => {
	assert.equal(getDayInfo('2026-11-09', [], settings).phase, PHASE.UNKNOWN)
})

test('平均周期：取有效周期平均，忽略异常值', () => {
	const periods = [
		{ start: '2026-07-01', end: '2026-07-05' },
		{ start: '2026-07-31', end: '2026-08-04' }, // 30
		{ start: '2026-08-30', end: '2026-09-03' }, // 30
		{ start: '2026-09-02', end: null } // 3 天，异常，忽略
	]
	assert.equal(averageCycleLength(periods, 28), 30)
	assert.equal(averagePeriodLength(periods, 5), 5)
	assert.equal(averageCycleLength([{ start: '2026-07-01', end: null }], 28), 28)
})

test('28 天周期：各阶段划分正确', () => {
	const periods = [{ start: '2026-11-01', end: '2026-11-05' }]
	const phaseOf = d => getDayInfo(d, periods, settings).phase
	assert.equal(phaseOf('2026-11-01'), PHASE.PERIOD)
	assert.equal(phaseOf('2026-11-05'), PHASE.PERIOD)
	assert.equal(phaseOf('2026-11-06'), PHASE.FOLLICULAR)
	assert.equal(phaseOf('2026-11-10'), PHASE.FERTILE) // 排卵日前 5 天
	assert.equal(phaseOf('2026-11-15'), PHASE.OVULATION) // 下次 11-29 往前 14 天
	assert.equal(phaseOf('2026-11-16'), PHASE.FERTILE) // 排卵后 1 天
	assert.equal(phaseOf('2026-11-17'), PHASE.LUTEAL)
	assert.equal(phaseOf('2026-11-28'), PHASE.LUTEAL)
	assert.equal(phaseOf('2026-11-29'), PHASE.PREDICTED_PERIOD)
	assert.equal(phaseOf('2026-12-03'), PHASE.PREDICTED_PERIOD)
	assert.equal(phaseOf('2026-12-04'), PHASE.FOLLICULAR)
})

test('周期日与距下次月经天数', () => {
	const periods = [{ start: '2026-11-01', end: '2026-11-05' }]
	const info = getDayInfo('2026-11-09', periods, settings)
	assert.equal(info.cycleDay, 9)
	assert.equal(info.daysToNextPeriod, 20)
	assert.equal(info.nextPeriodStart, '2026-11-29')
	assert.equal(info.ovulationDate, '2026-11-15')
})

test('历史周期使用真实的下一次开始日', () => {
	const periods = [
		{ start: '2026-09-01', end: '2026-09-05' },
		{ start: '2026-10-03', end: '2026-10-07' } // 32 天
	]
	const info = getDayInfo('2026-09-10', periods, settings)
	assert.equal(info.nextPeriodStart, '2026-10-03')
	assert.equal(info.ovulationDate, '2026-09-19')
})

test('极短周期：排卵日不会落在经期内', () => {
	const periods = [{ start: '2026-11-01', end: '2026-11-07' }]
	const info = getDayInfo('2026-11-08', periods, { cycleLength: 18, periodLength: 7 })
	assert.equal(info.ovulationDate, '2026-11-08')
	assert.equal(info.phase, PHASE.OVULATION)
})

test('进行中的经期', () => {
	const periods = [{ start: '2026-11-07', end: null }]
	assert.deepEqual(ongoingPeriod(periods, '2026-11-09'), periods[0])
	assert.equal(ongoingPeriod([{ start: '2026-11-07', end: '2026-11-10' }], '2026-11-09'), null)
})
