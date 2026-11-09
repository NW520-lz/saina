'use strict'

// DeepSeek 对话接口（OpenAI 兼容格式）：传入完整 messages，返回回复文本
const { postJson } = require('./http.js')

async function askDeepseek(cfg, messages) {
	const res = await postJson(
		`${cfg.baseUrl}/chat/completions`,
		{ Authorization: `Bearer ${cfg.apiKey}` },
		{ model: cfg.model, messages, temperature: 0.8 },
		40000
	)
	let data = {}
	try {
		data = JSON.parse(res.text)
	} catch (e) {
		throw new Error(`DeepSeek 返回异常（HTTP ${res.status}）`)
	}
	const choice = data.choices && data.choices[0]
	const text = choice && choice.message && choice.message.content
	if (!text) throw new Error((data.error && data.error.message) || 'DeepSeek 没有返回内容')
	return text.trim()
}

module.exports = { askDeepseek }
