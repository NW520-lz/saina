'use strict'

// 女娲智能体：会话保存在女娲服务端，知识库也在女娲后台
const { parseAgentStream } = require('./sse.js')
const { postJson } = require('./http.js')

function headers(cfg) {
	return { Authorization: `Bearer ${cfg.apiKey}` }
}

async function createConversation(cfg, nickname) {
	const res = await postJson(
		`${cfg.baseUrl}/api/v1/chat/conversation/add`,
		headers(cfg),
		{ agentId: cfg.agentId, devMode: cfg.devMode, variables: { nickname } },
		15000
	)
	const data = JSON.parse(res.text)
	if (data.code !== '0000') throw new Error(data.message || '创建会话失败')
	return data.data
}

async function chat(cfg, conversationId, message) {
	const res = await postJson(`${cfg.baseUrl}/api/v1/chat/${conversationId}`, headers(cfg), { conversationId, message }, 90000)
	return parseAgentStream(res.text)
}

// 返回 { text, conversationId }；旧会话失效时重建一次
async function askNuwax(cfg, message, conversationId, nickname) {
	let id = conversationId || (await createConversation(cfg, nickname))
	let result = await chat(cfg, id, message)
	if (!result.text && conversationId) {
		id = await createConversation(cfg, nickname)
		result = await chat(cfg, id, message)
	}
	if (!result.text) throw new Error(result.error || '小泽没有回应')
	return { text: result.text, conversationId: id }
}

module.exports = { askNuwax }
