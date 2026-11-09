// 消息提醒
//   - 应用内：打开 App 时，当天有提醒就弹一次小提示（所有端，每天最多一次）
//   - App 端：预约未来几天的系统通知（经期前 3 天、前 1 天、排卵日、预测经期第 1 天），不打开 App 也能收到
//
// 注意：uni.createPushMessage 没有取消接口，已经预约的通知改不了，
// 所以只预约近几天的，并用 key 去重，避免每次打开 App 重复预约。
// 需要在 manifest.json → App 模块配置 → 勾选 Push（uni-push 2.0）后云打包才生效。
import { getSettings, getPeriods } from './storage.js'
import { getDayInfo } from '../domain/cycle.js'
import { reminderFor, upcomingReminders } from '../domain/reminders.js'
import { today, localTimestamp } from '../domain/date.js'

const LAST_REMIND_KEY = 'pm_last_remind'
const SCHEDULED_KEY = 'pm_scheduled_reminders' // [{ key, fireAt }]
const SCHEDULE_DAYS = 10
const TITLE = '经期小管家 · 小泽'
const TEST_DELAY_SECONDS = 10

export function remindInApp() {
	const settings = getSettings()
	const date = today()
	if (!settings.notifyEnabled || uni.getStorageSync(LAST_REMIND_KEY) === date) return

	const reminder = reminderFor(settings, getDayInfo(date, getPeriods(), settings))
	if (!reminder) return
	uni.setStorageSync(LAST_REMIND_KEY, date)
	uni.showToast({ title: reminder.text, icon: 'none', duration: 3500 })
}

// #ifdef APP-PLUS
function pushLater(content, delaySeconds, when) {
	uni.createPushMessage({
		title: TITLE,
		content,
		delay: delaySeconds,
		when,
		payload: 'reminder',
		fail: e => console.warn('预约提醒失败（检查是否勾选了 Push 模块）:', e)
	})
}
// #endif

export function scheduleReminders() {
	// #ifdef APP-PLUS
	const settings = getSettings()
	if (!settings.notifyEnabled) return

	const now = Date.now()
	const scheduled = (uni.getStorageSync(SCHEDULED_KEY) || []).filter(s => s.fireAt > now)
	const reminders = upcomingReminders({ date: today(), hour: new Date().getHours() }, getPeriods(), settings, SCHEDULE_DAYS)

	reminders.forEach(r => {
		const key = `${r.date} ${r.hour} ${r.text}`
		if (scheduled.some(s => s.key === key)) return
		const fireAt = localTimestamp(r.date, r.hour)
		pushLater(r.text, Math.round((fireAt - now) / 1000), fireAt)
		scheduled.push({ key, fireAt })
	})
	uni.setStorageSync(SCHEDULED_KEY, scheduled)
	// #endif
}

// 测试用：10 秒后发一条通知。点完可以退出 App，看看锁屏或后台时能不能收到
export function sendTestReminder() {
	// #ifdef APP-PLUS
	pushLater(`${getSettings().nickname}，这是一条测试提醒，收到就说明提醒能用啦 💗`, TEST_DELAY_SECONDS, Date.now() + TEST_DELAY_SECONDS * 1000)
	uni.showToast({ title: `${TEST_DELAY_SECONDS} 秒后会收到一条通知，可以先退出 App 试试`, icon: 'none', duration: 3000 })
	// #endif
	// #ifndef APP-PLUS
	uni.showToast({ title: '系统通知只能在手机 App 上测试哦', icon: 'none' })
	// #endif
}
