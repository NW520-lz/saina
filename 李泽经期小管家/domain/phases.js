// 各阶段的展示信息与本地护理小贴士（内容摘自 knowledge-base/02、07）
import { PHASE } from './cycle.js'

export const PHASE_META = {
	[PHASE.PERIOD]: {
		name: '月经期',
		tcmName: '行经期',
		emoji: '🌹',
		color: '#FF6B8B',
		mantra: '暖 · 静 · 润',
		questions: ['肚子好痛怎么办', '经期能喝奶茶吗', '经量多正常吗', '有血块要紧吗', '手脚冰凉怎么办', '什么情况要去医院'],
		tips: ['小腹和脚丫要保暖，热水袋安排上', '少吃冰的辣的，多喝温水', '散步、拉伸就好，不做剧烈运动', '卫生巾 2~4 小时换一次'],
		greetings: ['姨妈来访期间，要当一只被好好照顾的小猫咪 🐱', '今天也要抱紧热水袋哦～', '辛苦啦，允许自己今天慢一点 💗']
	},
	[PHASE.PREDICTED_PERIOD]: {
		name: '预测经期',
		tcmName: '行经期',
		emoji: '🩷',
		color: '#FF9EB5',
		mantra: '备 · 暖 · 静',
		questions: ['月经推迟了怎么办', '经前要准备什么', '经前肚子胀正常吗', '经前好烦躁怎么办'],
		tips: ['包里放好卫生巾，有备无患', '提前准备热水袋和常用止痛药', '如果月经来了，记得点「月经来了」'],
		greetings: ['姨妈可能快来啦，小包包里备好卫生巾哦 🎒', '这几天注意保暖，别贪凉～']
	},
	[PHASE.FOLLICULAR]: {
		name: '卵泡期',
		tcmName: '经后期',
		emoji: '🌱',
		color: '#7DD3B0',
		mantra: '补 · 动 · 学',
		questions: ['这几天适合什么运动', '经后吃什么补气血', '怎么算排卵期', '手脚冰凉怎么办', '中医怎么调理'],
		tips: ['元气回升期，适合运动和学习', '多吃红肉、蛋、豆制品，把铁补回来', '可以试试力量训练或有氧运动'],
		greetings: ['元气满满的卵泡期来啦 ✨ 今天的你闪闪发光！', '状态正好，去做一件想了很久的事吧～']
	},
	[PHASE.FERTILE]: {
		name: '易孕期',
		tcmName: '经间期',
		emoji: '🌸',
		color: '#FFB347',
		mantra: '察 · 护 · 备',
		questions: ['易孕期有什么信号', '拉丝白带正常吗', '安全期靠谱吗', '怎么算排卵期'],
		tips: ['怀孕几率较高，没有计划要做好防护', '可能出现拉丝白带，属正常现象', '预测仅供参考，不能用来避孕'],
		greetings: ['易孕期小提醒 💗 记得照顾好自己、做好防护哦', '身体正处在最活跃的阶段～']
	},
	[PHASE.OVULATION]: {
		name: '排卵日',
		tcmName: '经间期',
		emoji: '🥚',
		color: '#B794F6',
		mantra: '察 · 护 · 备',
		questions: ['排卵痛正常吗', '排卵期出血要紧吗', '安全期靠谱吗', '今天适合做什么'],
		tips: ['今天是预测的排卵日，受孕几率最高', '一侧小腹轻微隐痛可能是排卵痛', '疼痛剧烈或持续超过 2 天要看医生'],
		greetings: ['今天是排卵日哦 🥚 身体在悄悄努力呢', '排卵日到啦，多喝水，好好休息～']
	},
	[PHASE.LUTEAL]: {
		name: '黄体期',
		tcmName: '经前期',
		emoji: '🌙',
		color: '#F6AD55',
		mantra: '疏 · 稳 · 缓',
		questions: ['经前好烦躁怎么办', '好想吃甜的', '经前长痘怎么办', '睡不好怎么办', '乳房胀痛正常吗'],
		tips: ['小情绪都是正常的，允许自己慢一点', '少盐少甜，三餐规律，血糖稳情绪就稳', '想吃零食就选坚果、酸奶、黑巧克力', '睡前泡泡脚，早点睡'],
		greetings: ['黄体期的小情绪都是正常的～你已经很棒啦 🌷', '今天也要对自己温柔一点哦', '想吃甜的？吃一小块，不许有负罪感 🍫']
	},
	[PHASE.UNKNOWN]: {
		name: '等待记录',
		tcmName: '',
		emoji: '📝',
		color: '#FF8FB1',
		mantra: '记 · 录 · 起',
		questions: ['痛经怎么缓解？', '经前好烦躁怎么办', '经期适合吃什么', '怎么算排卵期', '中医怎么调理', '月经推迟了'],
		tips: ['点击「月经来了」开始记录第一次经期', '在「我的」里可以设置平均周期和经期天数'],
		greetings: ['嗨～我是小泽！先告诉我上次月经是哪天吧 💕']
	}
}

export function phaseMeta(phase) {
	return PHASE_META[phase] || PHASE_META[PHASE.UNKNOWN]
}

// 记录页可选项
export const FLOW_OPTIONS = [
	{ value: 0, label: '没有', emoji: '⚪' },
	{ value: 1, label: '少量', emoji: '💧' },
	{ value: 2, label: '中等', emoji: '💧💧' },
	{ value: 3, label: '很多', emoji: '💧💧💧' }
]

export const MOOD_OPTIONS = [
	{ value: 'happy', label: '开心', emoji: '😊' },
	{ value: 'calm', label: '平静', emoji: '😌' },
	{ value: 'tired', label: '疲惫', emoji: '😪' },
	{ value: 'sad', label: '低落', emoji: '😢' },
	{ value: 'anxious', label: '焦虑', emoji: '😰' },
	{ value: 'angry', label: '烦躁', emoji: '😤' }
]

export const SYMPTOM_OPTIONS = ['腹痛', '腰酸', '头痛', '乳房胀痛', '腹胀', '腹泻', '便秘', '长痘', '水肿', '失眠', '嗜睡', '嘴馋', '恶心', '头晕']

export function moodLabel(value) {
	const option = MOOD_OPTIONS.find(o => o.value === value)
	return option ? option.label : '未记录'
}

export function flowLabel(value) {
	const option = FLOW_OPTIONS.find(o => o.value === value)
	return option ? option.label : '未记录'
}

const PAIN_FACES = ['😊', '🙂', '😐', '😣', '😖', '😭']

export function painFace(pain) {
	return PAIN_FACES[Math.min(Math.ceil(pain / 2), 5)]
}

const LOW_MOODS = ['sad', 'anxious', 'angry']

export function isLowMood(mood) {
	return LOW_MOODS.includes(mood)
}

// 某个字段是否已经记录过（首页快速打卡只会写入其中一项）
export function hasValue(value) {
	return value !== undefined && value !== null && value !== ''
}

function emptyTile(key, icon, label) {
	return { key, icon, label, value: '未记录', tone: 'none' }
}

// 今日复盘的图标卡片：经量 / 疼痛 / 心情 / 睡眠。tone：good 正常、warn 需要留意、none 未记录
export function logOverview(log) {
	const l = log || {}
	const mood = MOOD_OPTIONS.find(o => o.value === l.mood)
	return [
		hasValue(l.flow)
			? { key: 'flow', icon: '💧', label: '经量', value: flowLabel(l.flow), tone: l.flow >= 3 ? 'warn' : 'good' }
			: emptyTile('flow', '💧', '经量'),
		hasValue(l.pain)
			? { key: 'pain', icon: painFace(l.pain), label: '疼痛', value: `${l.pain}/10`, tone: l.pain >= 6 ? 'warn' : 'good' }
			: emptyTile('pain', '🙂', '疼痛'),
		mood
			? { key: 'mood', icon: mood.emoji, label: '心情', value: mood.label, tone: isLowMood(mood.value) ? 'warn' : 'good' }
			: emptyTile('mood', '💗', '心情'),
		hasValue(l.sleep)
			? { key: 'sleep', icon: '🌙', label: '睡眠', value: `${l.sleep}h`, tone: l.sleep < 6 ? 'warn' : 'good' }
			: emptyTile('sleep', '🌙', '睡眠')
	]
}

const PAIN_LABELS = { 0: '不痛', 2: '一点点', 4: '有点痛', 6: '挺痛的', 8: '很痛', 10: '痛哭了' }

// 首页快速打卡：点图标弹出的选项，一点就保存
export const QUICK_LOG_FIELDS = {
	flow: { title: '今天的经量 💧', options: FLOW_OPTIONS },
	pain: {
		title: '肚子痛不痛 🤕',
		options: Object.keys(PAIN_LABELS).map(v => ({ value: Number(v), emoji: painFace(Number(v)), label: PAIN_LABELS[v] }))
	},
	mood: { title: '今天的心情 💭', options: MOOD_OPTIONS },
	sleep: {
		title: '昨晚睡了多久 😴',
		options: [5, 6, 7, 8, 9, 10].map(v => ({ value: v, emoji: v < 7 ? '🥱' : '😴', label: `${v} 小时` }))
	}
}

// 快速打卡后小泽说的话
export function quickLogCheer(key, value) {
	if (key === 'pain' && value >= 6) return '抱抱，热水袋贴上肚子，今天别硬撑 🥺'
	if (key === 'mood' && isLowMood(value)) return '小泽在呢，想说说就来找我 💗'
	if (key === 'sleep' && value < 7) return '昨晚没睡够，今晚早点睡好不好 🌙'
	if (key === 'flow' && value >= 3) return '量有点多，记得勤换，多喝温水哦'
	return '记好啦，你最棒 ✨'
}
