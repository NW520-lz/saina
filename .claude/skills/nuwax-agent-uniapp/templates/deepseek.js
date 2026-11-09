'use strict'

// DeepSeek 对话接口（OpenAI 兼容格式）：传入完整 messages，返回回复文本
async function askDeepseek(cfg, messages) {
	const res = await uniCloud.httpclient.request(`${cfg.baseUrl}/chat/completions`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
		data: { model: cfg.model, messages, temperature: 0.8 },
		contentType: 'json',
		dataType: 'json',
		timeout: 40000
	})
	const data = res.data || {}
	const choice = data.choices && data.choices[0]
	const text = choice && choice.message && choice.message.content
	if (!text) throw new Error((data.error && data.error.message) || 'DeepSeek 没有返回内容')
	return text.trim()
}

module.exports = { askDeepseek }
