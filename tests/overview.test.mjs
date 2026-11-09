// 运行：node --test tests/*.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { logOverview, painFace } from '../李泽经期小管家/domain/phases.js'

test('没有记录时四项都显示未记录', () => {
	const tiles = logOverview(undefined)
	assert.deepEqual(tiles.map(t => t.key), ['flow', 'pain', 'mood', 'sleep'])
	assert.ok(tiles.every(t => t.tone === 'none' && t.value === '未记录'))
})

test('正常的一天全部为 good', () => {
	const tiles = logOverview({ flow: 1, pain: 2, mood: 'happy', symptoms: [], sleep: 8 })
	assert.deepEqual(tiles.map(t => t.value), ['少量', '2/10', '开心', '8h'])
	assert.ok(tiles.every(t => t.tone === 'good'))
})

test('经量多、痛经重、情绪低落、睡眠不足时标记为 warn', () => {
	const tiles = logOverview({ flow: 3, pain: 7, mood: 'sad', symptoms: [], sleep: 5 })
	assert.ok(tiles.every(t => t.tone === 'warn'))
	assert.equal(tiles[1].icon, '😖')
})

test('心情没选时单独显示未记录', () => {
	const tiles = logOverview({ flow: 0, pain: 0, mood: '', symptoms: [], sleep: 8 })
	assert.equal(tiles[2].tone, 'none')
	assert.equal(painFace(0), '😊')
	assert.equal(painFace(10), '😭')
})
