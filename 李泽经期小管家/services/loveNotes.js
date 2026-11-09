// 李泽的小纸条：根据今天的状态挑一张纸条，并记为「已递出」
import { LOVE_NOTES } from '../content/love-notes.js'
import { activeTriggers, checkInStreak, pickNote } from '../domain/notes.js'
import { getDayInfo } from '../domain/cycle.js'
import { today } from '../domain/date.js'
import { getSettings, getPeriods, getLogs, getNoteHistory, addNoteHistory } from './storage.js'

// 返回今天要递的纸条 { when, text, date }，没有则返回 null
export function takeNoteForToday() {
	const date = today()
	const periods = getPeriods()
	const logs = getLogs()
	const triggers = activeTriggers({
		date,
		info: getDayInfo(date, periods, getSettings()),
		periods,
		log: logs[date],
		streak: checkInStreak(logs, date)
	})
	const note = pickNote(triggers, LOVE_NOTES, getNoteHistory(), date)
	if (!note) return null
	const entry = { ...note, date }
	addNoteHistory(entry)
	return entry
}

// 收到过的纸条，最新的在前
export function receivedNotes() {
	return [...getNoteHistory()].reverse()
}
