// 调用自己服务器上的小泽 AI 后端（DeepSeek 或女娲智能体，由 server/config.js 决定）
// options：{ nickname, knowledgeQuery（用于检索知识库）, history（最近几轮对话 [{role, content}]） }
import { getConversationId, saveConversationId } from '../storage.js'
import { API_CONFIG } from './apiConfig.js'

function post(path, data) {
	return new Promise((resolve, reject) => {
		uni.request({
			url: API_CONFIG.baseUrl + path,
			method: 'POST',
			header: { 'Content-Type': 'application/json', 'X-App-Token': API_CONFIG.appToken },
			data,
			timeout: API_CONFIG.timeout,
			success: res => resolve(res.data),
			fail: err => reject(new Error(err.errMsg || '网络开小差了'))
		})
	})
}

export async function sendToAgent(message, options = {}) {
	const result = await post('/api/ai', { message, ...options, conversationId: getConversationId() })
	if (result && result.conversationId) saveConversationId(result.conversationId)
	if (!result || !result.ok) throw new Error((result && result.error) || '小泽没有回应')
	return result.text
}
