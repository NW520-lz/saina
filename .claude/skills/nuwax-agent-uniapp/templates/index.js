'use strict'

// AI 代理云函数：密钥只保存在云端，App 安装包里不包含密钥。
// 入参：{ message, knowledgeQuery?, history?: [{role, content}], conversationId?, nickname? }
// 出参：{ ok: true, text, conversationId? } 或 { ok: false, error }
// 服务商在 config.js 的 provider 里切换：deepseek（默认）或 nuwax。

const config = require('./config.js')
const { askDeepseek } = require('./deepseek.js')
const { askNuwax } = require('./nuwax.js')
const { searchKnowledge } = require('./knowledge.js')
const { systemPrompt, entries } = require('./knowledge-data.js')

const MAX_MESSAGE_LENGTH = 4000
const MAX_HISTORY = 6
const MAX_HISTORY_LENGTH = 1000

function cleanHistory(history) {
	if (!Array.isArray(history)) return []
	return history
		.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
		.slice(-MAX_HISTORY)
		.map(m => ({ role: m.role, content: m.content.slice(0, MAX_HISTORY_LENGTH) }))
}

// 系统提示词 + 检索到的知识库条目 + 最近几轮对话 + 本次消息
function buildMessages(event, message) {
	const refs = searchKnowledge(entries, String(event.knowledgeQuery || ''))
	const system = refs.length
		? `${systemPrompt}\n\n# 知识库检索结果（回答时优先依据，注意证据等级）\n\n${refs.map(r => r.text).join('\n\n')}`
		: systemPrompt
	return [{ role: 'system', content: system }, ...cleanHistory(event.history), { role: 'user', content: message }]
}

exports.main = async event => {
	const message = String(event.message || '').slice(0, MAX_MESSAGE_LENGTH)
	if (!message) return { ok: false, error: '消息不能为空' }

	try {
		if (config.provider === 'nuwax') {
			const result = await askNuwax(config.nuwax, message, event.conversationId, event.nickname)
			return { ok: true, ...result }
		}
		return { ok: true, text: await askDeepseek(config.deepseek, buildMessages(event, message)) }
	} catch (e) {
		console.error('ai-assistant error', e)
		return { ok: false, error: e.message || '网络开小差了' }
	}
}
