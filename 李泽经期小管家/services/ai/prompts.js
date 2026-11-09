// 按 agent/系统提示词.md 中的「App 消息协议」组装发给智能体的消息
import { phaseMeta, moodLabel, flowLabel, hasValue } from '../../domain/phases.js'
import { addDays } from '../../domain/date.js'

function timeOfDay() {
	const hour = new Date().getHours()
	if (hour < 11) return '早上'
	if (hour < 14) return '中午'
	if (hour < 18) return '下午'
	return '晚上'
}

function describeCycle(settings, info) {
	const meta = phaseMeta(info.phase)
	const lines = [`昵称：${settings.nickname}`, `当前阶段：${meta.name}（中医：${meta.tcmName || '未知'}）`]
	if (info.cycleDay) {
		lines.push(`周期第 ${info.cycleDay} 天，平均周期 ${info.cycleLength} 天，平均经期 ${info.periodLength} 天`)
		lines.push(`距下次月经约 ${info.daysToNextPeriod} 天，预测排卵日 ${info.ovulationDate}`)
	}
	return lines
}

// 只描述记录过的字段（首页快速打卡可能只记了其中一项）
export function describeLog(log) {
	if (!log) return '未记录'
	const parts = []
	if (hasValue(log.flow)) parts.push(`经量${flowLabel(log.flow)}`)
	if (hasValue(log.pain)) parts.push(`疼痛 ${log.pain}/10`)
	if (hasValue(log.mood)) parts.push(`心情${moodLabel(log.mood)}`)
	if (log.symptoms && log.symptoms.length) parts.push(`症状：${log.symptoms.join('、')}`)
	if (log.sleep) parts.push(`睡眠 ${log.sleep} 小时`)
	if (log.note) parts.push(`备注：${log.note}`)
	return parts.length ? parts.join('，') : '未记录'
}

function recentLogs(logs, date, days) {
	const lines = []
	for (let i = days; i >= 1; i--) {
		const day = addDays(date, -i)
		if (logs[day]) lines.push(`${day}：${describeLog(logs[day])}`)
	}
	return lines.length ? lines : ['无']
}

export function greetingPrompt(settings, info) {
	return ['【问候】', ...describeCycle(settings, info), `时间段：${timeOfDay()}`].join('\n')
}

export function analysisPrompt(settings, info, logs) {
	return [
		'【今日分析】',
		...describeCycle(settings, info),
		`今日记录：${describeLog(logs[info.date])}`,
		'近 7 天记录：',
		...recentLogs(logs, info.date, 7)
	].join('\n')
}

// 今日分析时用来检索知识库的关键词：阶段、症状、心情、备注
export function analysisQuery(info, log) {
	const parts = [phaseMeta(info.phase).name]
	if (log) {
		if (log.pain >= 4) parts.push('痛经')
		if (log.symptoms) parts.push(...log.symptoms)
		parts.push(moodLabel(log.mood))
		if (log.note) parts.push(log.note)
	}
	return parts.join(' ')
}

export function chatPrompt(settings, info, text) {
	return ['【聊天】', '用户数据：', ...describeCycle(settings, info), `用户说：${text}`].join('\n')
}
