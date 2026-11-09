// 本地兜底助手：AI 不可用（没网、云函数未部署、模型未配置）时使用
import { phaseMeta } from '../../domain/phases.js'

function pick(list) {
	return list[Math.floor(Math.random() * list.length)]
}

export function localGreeting(settings, info) {
	return `${settings.nickname}，${pick(phaseMeta(info.phase).greetings)}`
}

const NEGATIVE_MOODS = ['sad', 'anxious', 'angry', 'tired']

// 就医信号的本地粗筛（完整判断交给 AI + 知识库）
function localWarning(log) {
	if (!log) return ''
	if (log.pain >= 8) return '疼痛达到 8 分以上，如果止痛药也压不住，请尽快去医院看看哦。'
	if (log.flow === 3 && (log.symptoms || []).includes('头晕')) return '经量很多还头晕，可能失血较多，建议尽快就医。'
	return ''
}

export function localAnalysis(settings, info, log) {
	const meta = phaseMeta(info.phase)
	let score = 85
	if (log) {
		score -= (log.pain || 0) * 4
		score -= (log.symptoms || []).length * 3
		if (NEGATIVE_MOODS.includes(log.mood)) score -= 10
		if (log.sleep && log.sleep < 6) score -= 8
	}
	score = Math.max(20, Math.min(100, score))
	const level = score >= 85 ? '很棒' : score >= 70 ? '不错' : score >= 50 ? '一般' : '需要照顾'

	return {
		score,
		level,
		summary: `${settings.nickname}今天处于${meta.name}，整体状态${level}～`,
		body: log ? `今天已记录身体状况，小泽根据${meta.name}的特点给你准备了小建议。` : '今天还没有记录哦，记录后分析会更准确。',
		mood: log && NEGATIVE_MOODS.includes(log.mood) ? '小情绪来了也没关系，抱抱你，这只是激素在捣乱～' : '保持好心情，你是最棒的！',
		tips: meta.tips.slice(0, 3),
		warning: localWarning(log),
		cheer: pick(meta.greetings),
		offline: true
	}
}

export function localChatReply() {
	return '小泽暂时连不上云端大脑 (｡•́︿•̀｡) 等网络好一点再来找我聊天吧～如果身体非常不舒服，记得及时就医哦！'
}
