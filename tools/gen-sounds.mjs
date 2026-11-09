// 合成可爱音效（无版权风险）。运行：node tools/gen-sounds.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SAMPLE_RATE = 22050
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../李泽经期小管家/static/sounds')

// 一个音符：频率从 f0 滑到 f1，指数衰减包络，叠加一点八度泛音让声音更「圆润」
function tone({ f0, f1 = f0, start = 0, duration, volume = 0.5, decay = 6 }) {
	return { f0, f1, start, duration, volume, decay }
}

function render(notes) {
	const total = Math.max(...notes.map(n => n.start + n.duration))
	const samples = new Float32Array(Math.ceil(total * SAMPLE_RATE))
	for (const n of notes) {
		const offset = Math.floor(n.start * SAMPLE_RATE)
		const length = Math.floor(n.duration * SAMPLE_RATE)
		let phase = 0
		for (let i = 0; i < length; i++) {
			const t = i / length
			const freq = n.f0 + (n.f1 - n.f0) * t
			phase += (2 * Math.PI * freq) / SAMPLE_RATE
			const attack = Math.min(1, i / (SAMPLE_RATE * 0.004))
			const envelope = attack * Math.exp(-n.decay * t)
			samples[offset + i] += n.volume * envelope * (Math.sin(phase) + 0.25 * Math.sin(2 * phase))
		}
	}
	return samples
}

function toWav(samples) {
	const buffer = Buffer.alloc(44 + samples.length * 2)
	buffer.write('RIFF', 0)
	buffer.writeUInt32LE(36 + samples.length * 2, 4)
	buffer.write('WAVEfmt ', 8)
	buffer.writeUInt32LE(16, 16)
	buffer.writeUInt16LE(1, 20) // PCM
	buffer.writeUInt16LE(1, 22) // 单声道
	buffer.writeUInt32LE(SAMPLE_RATE, 24)
	buffer.writeUInt32LE(SAMPLE_RATE * 2, 28)
	buffer.writeUInt16LE(2, 32)
	buffer.writeUInt16LE(16, 34)
	buffer.write('data', 36)
	buffer.writeUInt32LE(samples.length * 2, 40)
	samples.forEach((s, i) => buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767 * 0.8), 44 + i * 2))
	return buffer
}

const SOUNDS = {
	// 点击：短促的「啵」
	tap: [tone({ f0: 1100, f1: 650, duration: 0.09, volume: 0.6, decay: 7 })],
	// 发送：向上冒泡
	send: [tone({ f0: 420, f1: 980, duration: 0.14, volume: 0.5, decay: 4 })],
	// 成功：叮～咚～（C6 E6 G6）
	success: [
		tone({ f0: 1047, start: 0, duration: 0.35, volume: 0.35, decay: 5 }),
		tone({ f0: 1319, start: 0.1, duration: 0.35, volume: 0.35, decay: 5 }),
		tone({ f0: 1568, start: 0.2, duration: 0.5, volume: 0.35, decay: 4 })
	],
	// 启动动画拼好时的「叮」：A6 加一个轻轻的五度泛音，像小铃铛
	ding: [
		tone({ f0: 1760, duration: 0.7, volume: 0.4, decay: 5 }),
		tone({ f0: 2637, start: 0.01, duration: 0.5, volume: 0.15, decay: 7 })
	],
	// 弹窗：闪闪发光的上行琶音
	popup: [1568, 1976, 2349, 3136].map((f, i) => tone({ f0: f, start: i * 0.06, duration: 0.25, volume: 0.22, decay: 6 }))
}

mkdirSync(OUT_DIR, { recursive: true })
for (const [name, notes] of Object.entries(SOUNDS)) {
	writeFileSync(join(OUT_DIR, `${name}.wav`), toWav(render(notes)))
	console.log('生成', `${name}.wav`)
}
