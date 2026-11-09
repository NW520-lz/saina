// 数据备份：把设置、经期记录、每日打卡、小纸条打包成一段文字，复制到剪贴板；
// 恢复时从剪贴板读回来，用 storage.restoreData 整体覆盖。聊天记录和 AI 缓存不备份。
import { getSettings, getPeriods, getLogs, getNoteHistory } from './storage.js'
import { today } from '../domain/date.js'

const APP_TAG = 'lize-period-backup'
const VERSION = 1

export function buildBackup({ settings, periods, logs, notes }, exportedAt) {
	return JSON.stringify({ app: APP_TAG, version: VERSION, exportedAt, settings, periods, logs, notes })
}

// 解析备份文字，格式不对时抛出可以直接展示给用户的错误
export function parseBackup(text) {
	let data
	try {
		data = JSON.parse((text || '').trim())
	} catch (e) {
		throw new Error('剪贴板里不是小管家的备份哦')
	}
	if (!data || data.app !== APP_TAG) throw new Error('剪贴板里不是小管家的备份哦')
	if (!Array.isArray(data.periods) || !data.logs || typeof data.logs !== 'object') throw new Error('备份内容不完整')
	return {
		exportedAt: data.exportedAt || '',
		settings: data.settings || {},
		periods: data.periods,
		logs: data.logs,
		notes: Array.isArray(data.notes) ? data.notes : []
	}
}

export function createBackupText() {
	return buildBackup(
		{ settings: getSettings(), periods: getPeriods(), logs: getLogs(), notes: getNoteHistory() },
		today()
	)
}
