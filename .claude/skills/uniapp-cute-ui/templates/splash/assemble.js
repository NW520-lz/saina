// 像素头像拼装动画：解码像素数据，给每个方块分配随机的起飞点、旋转角度和出发时间
export const CELL_PX = 10 // 方块边长：30 格 × 10px = 300px 的头像
export const FLY_MS = 700 // 每个方块的飞行时长
export const ASSEMBLE_MS = 1200 // 所有方块落位的时刻

const SPREAD = 70 // 起飞点离落点最远 70vw / 70vh，看起来像从屏幕各处飞来
const MAX_TURN = 180 // 起飞时最多旋转 ±180°
const SYMBOLS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' // 与 tools/gen-splash.py 一致

// { palette, rows } → [{ x, y, color }]，rows 里不在 SYMBOLS 中的字符（'.'）是空格子
export function decodePixels({ palette, rows }) {
	const blocks = []
	rows.forEach((row, y) => {
		Array.from(row).forEach((symbol, x) => {
			const index = SYMBOLS.indexOf(symbol)
			if (index >= 0) blocks.push({ x, y, color: palette[index] })
		})
	})
	return blocks
}

// random 返回 [0, 1)，可注入方便测试。出发时间保证 delay + FLY_MS ≤ ASSEMBLE_MS
export function scatter(blocks, random = Math.random) {
	const signed = max => Math.round((random() * 2 - 1) * max)
	return blocks.map(block => ({
		...block,
		dx: signed(SPREAD),
		dy: signed(SPREAD),
		turn: signed(MAX_TURN),
		delay: Math.floor(random() * (ASSEMBLE_MS - FLY_MS))
	}))
}
