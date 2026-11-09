// 经期 / 排卵提醒规则（纯函数）：哪天、几点、说什么
import { getDayInfo, PHASE } from './cycle.js'
import { addDays } from './date.js'

const EVENING = 20
const MORNING = 9

// 某一天的提醒：{ hour, text }，没有则返回 null
export function reminderFor(settings, info) {
	const name = settings.nickname
	if (info.phase === PHASE.UNKNOWN) return null
	if (info.daysToNextPeriod === 1) return { hour: EVENING, text: `${name}，姨妈预计明天来访，睡前把卫生巾放进包里哦 🎒` }
	if (info.daysToNextPeriod === 3) return { hour: EVENING, text: `${name}，还有 3 天就到经期啦，少吃冰的，提前准备好热水袋 💗` }
	if (info.phase === PHASE.OVULATION) return { hour: MORNING, text: `${name}，今天是预测排卵日，注意身体信号，做好防护哦 🌸` }
	if (info.phase === PHASE.PREDICTED_PERIOD && info.cycleDay === 1) {
		return { hour: MORNING, text: `${name}，预测今天月经来访，来了记得在小管家里打卡～` }
	}
	return null
}

// 从现在起 days 天内要预约的提醒（今天的提醒只在时间还没到时才算）
// now: { date: 'YYYY-MM-DD', hour: 0-23 }，返回 [{ date, hour, text }]
export function upcomingReminders(now, periods, settings, days) {
	const list = []
	for (let i = 0; i <= days; i++) {
		const date = addDays(now.date, i)
		const reminder = reminderFor(settings, getDayInfo(date, periods, settings))
		if (reminder && (i > 0 || reminder.hour > now.hour)) list.push({ date, ...reminder })
	}
	return list
}
