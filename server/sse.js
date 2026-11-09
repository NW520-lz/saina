'use strict'

// 解析女娲智能体 SSE 响应文本，返回 { text, error }
// 优先使用 FINAL_RESULT.outputText；没有时拼接 CHAT 类型的 MESSAGE 文本。
function parseAgentStream(raw) {
	let finalText = ''
	let error = ''
	const chunks = []

	String(raw)
		.split(/\r?\n/)
		.filter(line => line.startsWith('data:'))
		.forEach(line => {
			let event
			try {
				event = JSON.parse(line.slice(5).trim())
			} catch (e) {
				return
			}
			if (event.eventType === 'ERROR' || event.error) {
				error = event.error || '智能体返回错误'
			}
			const data = event.data || {}
			if (event.eventType === 'FINAL_RESULT' && data.outputText) {
				finalText = data.outputText
			}
			if (event.eventType === 'MESSAGE' && data.type === 'CHAT' && data.role === 'ASSISTANT' && data.text && data.finishReason !== 'ERROR') {
				chunks.push(data.text)
			}
		})

	const text = finalText || chunks.join('')
	return { text, error: text ? '' : error }
}

module.exports = { parseAgentStream }
