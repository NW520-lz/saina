// 小泽助手门面：页面只依赖这里。优先使用智能体，失败时降级为本地回复。
import { sendToAgent } from './agentClient.js'
import { greetingPrompt, analysisPrompt, chatPrompt, analysisQuery } from './prompts.js'
import { getChatHistory } from '../storage.js'
import { localGreeting, localAnalysis, localChatReply } from './localAssistant.js'

const HISTORY_TURNS = 6

// 从模型输出中提取 JSON（兼容 ```json 包裹或前后有多余文字）
export function extractJson(text) {
	const start = text.indexOf('{')
	const end = text.lastIndexOf('}')
	if (start === -1 || end <= start) return null
	try {
		return JSON.parse(text.slice(start, end + 1))
	} catch (e) {
		return null
	}
}

export async function greet(settings, info) {
	try {
		const text = await sendToAgent(greetingPrompt(settings, info), { nickname: settings.nickname })
		return text.trim()
	} catch (e) {
		console.warn('greet fallback:', e.message)
		return localGreeting(settings, info)
	}
}

export async function analyzeToday(settings, info, logs) {
	try {
		const text = await sendToAgent(analysisPrompt(settings, info, logs), {
			nickname: settings.nickname,
			knowledgeQuery: analysisQuery(info, logs[info.date])
		})
		const result = extractJson(text)
		if (result && typeof result.score === 'number') return { ...result, tips: result.tips || [] }
		throw new Error('分析结果格式不正确')
	} catch (e) {
		console.warn('analysis fallback:', e.message)
		return localAnalysis(settings, info, logs[info.date])
	}
}

export async function chat(settings, info, text) {
	try {
		// 聊天页在回复后才保存记录，所以这里读到的是本条消息之前的对话
		const history = getChatHistory()
			.slice(-HISTORY_TURNS)
			.map(m => ({ role: m.role, content: m.text }))
		const reply = await sendToAgent(chatPrompt(settings, info, text), {
			nickname: settings.nickname,
			knowledgeQuery: text,
			history
		})
		return { text: reply, offline: false }
	} catch (e) {
		console.warn('chat fallback:', e.message)
		return { text: localChatReply(), offline: true }
	}
}
