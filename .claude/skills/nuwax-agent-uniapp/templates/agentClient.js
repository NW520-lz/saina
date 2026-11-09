// 通过 uniCloud 云函数 ai-assistant 调用 AI（DeepSeek 或女娲智能体，由云函数配置决定）
// options：{ nickname, knowledgeQuery（用于检索知识库）, history（最近几轮对话 [{role, content}]） }
import { getConversationId, saveConversationId } from '../storage.js'

export async function sendToAgent(message, options = {}) {
	if (typeof uniCloud === 'undefined') throw new Error('uniCloud 未启用')

	const { result } = await uniCloud.callFunction({
		name: 'ai-assistant',
		data: { message, ...options, conversationId: getConversationId() }
	})
	if (result && result.conversationId) saveConversationId(result.conversationId)
	if (!result || !result.ok) throw new Error((result && result.error) || '小泽没有回应')
	return result.text
}
