'use strict'

// 女娲智能体：会话保存在女娲服务端，知识库也在女娲后台
const { parseAgentStream } = require('./sse.js')

function headers(cfg) {
	return { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' }
}

async function createConversation(cfg, nickname) {
	const res = await uniCloud.httpclient.request(`${cfg.baseUrl}/api/v1/chat/conversation/add`, {
		method: 'POST',
		headers: headers(cfg),
		data: { agentId: cfg.agentId, devMode: cfg.devMode, variables: { nickname } },
		contentType: 'json',
		dataType: 'json',
		timeout: 15000
	})
	if (!res.data || res.data.code !== '0000') {
		throw new Error((res.data && res.data.message) || '创建会话失败')
	}
	return res.data.data
}

async function chat(cfg, conversationId, message) {
	const res = await uniCloud.httpclient.request(`${cfg.baseUrl}/api/v1/chat/${conversationId}`, {
		method: 'POST',
		headers: headers(cfg),
		data: { conversationId, message },
		contentType: 'json',
		dataType: 'text',
		timeout: 55000
	})
	return parseAgentStream(res.data)
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
