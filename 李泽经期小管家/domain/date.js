// 日期工具：统一使用 'YYYY-MM-DD' 字符串表示「某一天」，
// 计算时转换为 UTC 天序号，避免时区与夏令时带来的误差。

const MS_PER_DAY = 86400000

function pad(n) {
	return n < 10 ? '0' + n : '' + n
}

export function toDayNumber(dateStr) {
	const [y, m, d] = dateStr.split('-').map(Number)
	return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY)
}

export function fromDayNumber(dayNumber) {
	const date = new Date(dayNumber * MS_PER_DAY)
	return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function addDays(dateStr, days) {
	return fromDayNumber(toDayNumber(dateStr) + days)
}

export function diffDays(laterStr, earlierStr) {
	return toDayNumber(laterStr) - toDayNumber(earlierStr)
}

export function today() {
	const now = new Date()
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function formatMonthDay(dateStr) {
	const [, m, d] = dateStr.split('-').map(Number)
	return `${m}月${d}日`
}

// 某天某个整点的本地时间戳（毫秒），用于预约通知
export function localTimestamp(dateStr, hour) {
	const [y, m, d] = dateStr.split('-').map(Number)
	return new Date(y, m - 1, d, hour).getTime()
}

// 返回某月的所有日期字符串
export function daysInMonth(year, month) {
	const count = new Date(year, month, 0).getDate()
	const days = []
	for (let d = 1; d <= count; d++) {
		days.push(`${year}-${pad(month)}-${pad(d)}`)
	}
	return days
}

// 0 = 周日
export function weekdayOf(dateStr) {
	return new Date(toDayNumber(dateStr) * MS_PER_DAY).getUTCDay()
}
