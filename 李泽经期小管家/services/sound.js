// 可爱音效 + 轻震动。音效文件由 tools/gen-sounds.mjs 生成
import { getSettings } from './storage.js'

const players = {}

function player(name) {
	if (!players[name]) {
		const audio = uni.createInnerAudioContext()
		audio.src = `/static/sounds/${name}.wav`
		audio.obeyMuteSwitch = true
		players[name] = audio
	}
	return players[name]
}

// name: 'tap' | 'send' | 'success' | 'popup' | 'ding'
export function playSound(name) {
	if (!getSettings().soundEnabled) return
	const audio = player(name)
	audio.stop()
	audio.play()
	// #ifdef APP-PLUS || MP
	uni.vibrateShort({ type: 'light' })
	// #endif
}
