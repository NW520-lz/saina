// 启动动画：像素头像解码、方块落位时间
// 运行：node --test tests/*.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import avatarPixels from '../李泽经期小管家/pages/splash/avatar-pixels.js'
import { decodePixels, scatter, FLY_MS, ASSEMBLE_MS } from '../李泽经期小管家/pages/splash/assemble.js'

test('解码：字符是调色板下标，「.」是空格子', () => {
	const blocks = decodePixels({ palette: ['#111111', '#222222'], rows: ['0.', '.1'] })
	assert.deepEqual(blocks, [
		{ x: 0, y: 0, color: '#111111' },
		{ x: 1, y: 1, color: '#222222' }
	])
})

test('生成的像素头像是 30×30 的圆角方块，几百个', () => {
	assert.equal(avatarPixels.rows.length, 30)
	assert.ok(avatarPixels.rows.every(row => row.length === 30))
	assert.equal(avatarPixels.rows[0][0], '.') // 圆角外是空的
	const blocks = decodePixels(avatarPixels)
	assert.ok(blocks.length >= 300 && blocks.length < 1000, `方块数 ${blocks.length}`)
	assert.ok(blocks.every(b => /^#[0-9a-f]{6}$/.test(b.color)))
})

test('即使随机数取到最大，每个方块也在拼装时刻前落位', () => {
	const blocks = decodePixels(avatarPixels)
	for (const random of [() => 0, () => 0.999999]) {
		const flights = scatter(blocks, random)
		assert.ok(flights.every(f => f.delay >= 0 && f.delay + FLY_MS <= ASSEMBLE_MS))
	}
})
