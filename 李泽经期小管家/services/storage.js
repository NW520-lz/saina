// 本地数据仓库：所有持久化都经过这里，页面不直接调用 uni.setStorageSync
import { sortPeriods } from '../domain/cycle.js'

const KEYS = {
	settings: 'pm_settings',
	periods: 'pm_periods',
	logs: 'pm_logs',
	conversation: 'pm_conversation_id',
	chat: 'pm_chat_history',
	analysis: 'pm_daily_analysis',
	notes: 'pm_love_notes'
}

const DEFAULT_SETTINGS = {
	nickname: '小伙伴',
	cycleLength: 28,
	periodLength: 5,
	soundEnabled: true,
	notifyEnabled: true,
	onboarded: false // 是否完成首次引导
}

function read(key, fallback) {
	const value = uni.getStorageSync(key)
	return value === '' || value === undefined || value === null ? fallback : value
}

function write(key, value) {
	uni.setStorageSync(key, value)
}

// ---- 设置 ----
export function getSettings() {
	return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }
}

export function saveSettings(patch) {
	const settings = { ...getSettings(), ...patch }
	write(KEYS.settings, settings)
	return settings
}

// 第一次打开：没完成引导、也没有任何经期记录时，先去引导页
export function needsOnboarding() {
	return !getSettings().onboarded && !getPeriods().length
}

// ---- 经期记录 ----
export function getPeriods() {
	return sortPeriods(read(KEYS.periods, []))
}

export function startPeriod(date) {
	const periods = getPeriods().filter(p => p.start !== date)
	periods.push({ start: date, end: null })
	write(KEYS.periods, sortPeriods(periods))
}

export function endPeriod(start, endDate) {
	const periods = getPeriods().map(p => (p.start === start ? { ...p, end: endDate } : p))
	write(KEYS.periods, periods)
}

export function removePeriod(start) {
	write(KEYS.periods, getPeriods().filter(p => p.start !== start))
}

// ---- 每日记录 ----
export function getLogs() {
	return read(KEYS.logs, {})
}

export function getLog(date) {
	return getLogs()[date] || null
}

export function saveLog(date, log) {
	const logs = getLogs()
	logs[date] = { ...log, updatedAt: Date.now() }
	write(KEYS.logs, logs)
}

// 只更新某几项（首页快速打卡），保留当天已记录的其他内容
export function patchLog(date, patch) {
	saveLog(date, { ...getLog(date), ...patch })
}

// ---- AI 会话 ----
export function getConversationId() {
	return read(KEYS.conversation, null)
}

export function saveConversationId(id) {
	write(KEYS.conversation, id)
}

export function getChatHistory() {
	return read(KEYS.chat, [])
}

export function saveChatHistory(messages) {
	write(KEYS.chat, messages.slice(-100))
}

// 每天的 AI 分析结果缓存：{ date, result }
export function getDailyAnalysis(date) {
	const cached = read(KEYS.analysis, null)
	return cached && cached.date === date ? cached.result : null
}

export function saveDailyAnalysis(date, result) {
	write(KEYS.analysis, { date, result })
}

// ---- 小纸条：已经递出去的纸条 [{ when, text, date }] ----
export function getNoteHistory() {
	return read(KEYS.notes, [])
}

export function addNoteHistory(entry) {
	write(KEYS.notes, [...getNoteHistory(), entry])
}

// ---- 备份恢复：整体覆盖经期、打卡、设置和小纸条 ----
export function restoreData({ settings, periods, logs, notes }) {
	write(KEYS.settings, { ...DEFAULT_SETTINGS, ...settings, onboarded: true })
	write(KEYS.periods, sortPeriods(periods))
	write(KEYS.logs, logs)
	write(KEYS.notes, notes)
	uni.removeStorageSync(KEYS.analysis)
}

export function clearAll() {
	Object.values(KEYS).forEach(key => uni.removeStorageSync(key))
}
