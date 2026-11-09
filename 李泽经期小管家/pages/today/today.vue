<template>
	<view class="page">
		<!-- 问候 -->
		<view class="hello float-in">
			<view>
				<text class="hello-name">Hi，{{ settings.nickname }} 👋</text>
				<text class="hello-date">{{ todayText }}</text>
			</view>
			<text class="hello-line">{{ greeting || '小泽正在想今天要对你说什么…' }}</text>
		</view>

		<!-- 当前阶段 -->
		<view class="card hero float-in" :style="{ '--phase': meta.color }">
			<view class="hero-top">
				<view class="hero-badge">
					<text class="hero-emoji">{{ meta.emoji }}</text>
				</view>
				<view class="hero-info">
					<text class="hero-phase">{{ meta.name }}</text>
					<text v-if="meta.tcmName" class="muted">中医 · {{ meta.tcmName }}</text>
				</view>
				<view v-if="info.cycleDay" class="hero-count">
					<text class="hero-count-num">{{ headline.value }}</text>
					<text class="muted">{{ headline.label }}</text>
				</view>
			</view>

			<view v-if="segments.length" class="cycle-bar">
				<view v-for="seg in segments" :key="seg.key" class="cycle-seg" :class="'seg-' + seg.key" :style="{ width: seg.width + '%' }" />
				<view class="cycle-marker" :style="{ left: markerLeft + '%' }" />
			</view>
			<view v-if="info.cycleDay" class="cycle-legend muted">
				<text>周期第 {{ info.cycleDay }} 天</text>
				<text>下次预计 {{ nextPeriodText }}</text>
			</view>

			<view class="hero-actions">
				<view v-if="ongoing" class="btn-cute" hover-class="btn-hover" @tap="onEndPeriod">🌈 月经走了</view>
				<view v-else class="btn-cute" hover-class="btn-hover" @tap="onStartPeriod">🌹 月经来了</view>
				<view class="btn-cute ghost" hover-class="btn-hover" @tap="goRecord">📝 记录今天</view>
			</view>
		</view>

		<!-- AI 今日分析 -->
		<view class="card float-in">
			<view class="card-title">
				<view class="title-with-avatar">
					<image class="title-avatar" src="/static/mascot/normal.svg" mode="aspectFit" />
					<text>小泽的今日复盘</text>
				</view>
				<text v-if="analysis" class="refresh" @tap="runAnalysis">重新分析</text>
			</view>

			<!-- 今日状态图标：直接来自记录，不依赖 AI；点一下弹出选项快速打卡 -->
			<view class="overview">
				<view v-for="tile in overview" :key="tile.key" class="tile" :class="'tone-' + tile.tone" hover-class="tile-hover" @tap="openQuickLog(tile.key)">
					<view class="tile-icon"><text>{{ tile.icon }}</text></view>
					<text class="tile-value">{{ tile.value }}</text>
					<text class="tile-label">{{ tile.label }}</text>
				</view>
			</view>
			<view class="quick-hint">
				<text>点图标 3 秒打卡</text>
				<text class="quick-more" @tap="goRecord">完整记录 ›</text>
			</view>
			<view v-if="todayLog && todayLog.symptoms && todayLog.symptoms.length" class="symptoms">
				<text v-for="s in todayLog.symptoms" :key="s" class="symptom">{{ s }}</text>
			</view>

			<view v-if="analyzing" class="analyzing">
				<image class="analyzing-img" src="/static/mascot/happy.svg" mode="aspectFit" />
				<text class="muted">小泽正在认真分析中<text class="dots">...</text></text>
			</view>

			<view v-else-if="analysis">
				<view class="score-row">
					<view class="score" :style="{ '--score': analysis.score }">
						<text class="score-num">{{ analysis.score }}</text>
						<text class="score-unit">分</text>
					</view>
					<view class="score-text">
						<text class="score-level">状态{{ analysis.level }}</text>
						<text class="score-summary">{{ analysis.summary }}</text>
					</view>
				</view>
				<view v-if="analysis.warning" class="warning">⚠️ {{ analysis.warning }}</view>
				<view class="analysis-block">
					<text class="block-title">🩺 身体</text>
					<text class="block-text">{{ analysis.body }}</text>
				</view>
				<view class="analysis-block">
					<text class="block-title">💭 情绪</text>
					<text class="block-text">{{ analysis.mood }}</text>
				</view>
				<view class="analysis-block">
					<text class="block-title">🌷 小建议</text>
					<text v-for="(tip, i) in analysis.tips" :key="i" class="block-text tip">· {{ tip }}</text>
				</view>
				<view class="cheer">{{ analysis.cheer }}</view>
				<text v-if="analysis.offline" class="muted">（小泽暂时离线，这是本地分析结果）</text>
			</view>

			<view v-else class="analysis-empty">
				<text class="muted">{{ todayLog ? '今天已经记录啦，让小泽帮你看看吧～' : '先记录一下今天的状态，分析会更准哦～' }}</text>
				<view class="btn-cute" hover-class="btn-hover" @tap="runAnalysis">让小泽分析今天</view>
			</view>
		</view>

		<!-- 阶段护理 -->
		<view class="card float-in">
			<view class="card-title">
				<text>{{ meta.emoji }} {{ meta.name }}护理口诀</text>
				<text class="mantra">{{ meta.mantra }}</text>
			</view>
			<view v-for="(tip, i) in meta.tips" :key="i" class="care-tip">
				<text class="care-index">{{ i + 1 }}</text>
				<text>{{ tip }}</text>
			</view>
		</view>

		<text class="disclaimer">排卵期、易孕期为根据记录推算的参考值，不能作为避孕依据；身体不适请及时就医。</text>

		<!-- 每日问候弹窗 -->
		<uni-popup ref="greetPopup" type="center" :mask-click="true">
			<view class="greet-popup">
				<image class="greet-img" src="/static/mascot/happy.svg" mode="aspectFit" />
				<text class="greet-title">{{ settings.nickname }}，小泽来啦！</text>
				<text class="greet-text">{{ greeting }}</text>
				<view class="btn-cute" hover-class="btn-hover" @tap="closeGreeting">收到啦 💗</view>
			</view>
		</uni-popup>

		<quick-log ref="quickLog" @pick="onQuickPick" @more="goRecord" />
		<love-note ref="loveNote" />
		<mascot ref="mascot" :lines="meta.greetings" />
	</view>
</template>

<script>
import { getSettings, getPeriods, getLogs, patchLog, startPeriod, endPeriod, getDailyAnalysis, saveDailyAnalysis, needsOnboarding } from '@/services/storage.js'
import { getDayInfo, ongoingPeriod } from '@/domain/cycle.js'
import { phaseMeta, logOverview, quickLogCheer } from '@/domain/phases.js'
import { takeNoteForToday } from '@/services/loveNotes.js'
import { scheduleReminders } from '@/services/notify.js'
import { today, addDays, diffDays, formatMonthDay } from '@/domain/date.js'
import { greet, analyzeToday } from '@/services/ai/assistant.js'
import { playSound } from '@/services/sound.js'

let greetedThisSession = false

export default {
	data() {
		return {
			settings: getSettings(),
			periods: [],
			logs: {},
			date: today(),
			greeting: '',
			analysis: null,
			analyzing: false
		}
	},
	computed: {
		info() {
			return getDayInfo(this.date, this.periods, this.settings)
		},
		meta() {
			return phaseMeta(this.info.phase)
		},
		ongoing() {
			return ongoingPeriod(this.periods, this.date)
		},
		todayLog() {
			return this.logs[this.date]
		},
		overview() {
			return logOverview(this.todayLog)
		},
		todayText() {
			const week = '日一二三四五六'[new Date().getDay()]
			return `${formatMonthDay(this.date)} 星期${week}`
		},
		nextPeriodText() {
			return this.info.nextPeriodStart ? formatMonthDay(this.info.nextPeriodStart) : ''
		},
		headline() {
			if (this.ongoing) return { value: diffDays(this.date, this.ongoing.start) + 1, label: '经期第几天' }
			return { value: this.info.daysToNextPeriod, label: '天后来月经' }
		},
		// 周期进度条：月经 | 卵泡 | 易孕 | 黄体
		segments() {
			const info = this.info
			if (!info.cycleDay) return []
			const start = addDays(this.date, 1 - info.cycleDay)
			const total = diffDays(info.nextPeriodStart, start)
			const period = Math.min(info.periodLength, total)
			const fertileFrom = Math.max(diffDays(info.fertileStart, start), period)
			const fertileTo = Math.min(diffDays(info.fertileEnd, start) + 1, total)
			const pct = n => (Math.max(n, 0) / total) * 100
			return [
				{ key: 'period', width: pct(period) },
				{ key: 'follicular', width: pct(fertileFrom - period) },
				{ key: 'fertile', width: pct(fertileTo - fertileFrom) },
				{ key: 'luteal', width: pct(total - fertileTo) }
			]
		},
		markerLeft() {
			const start = addDays(this.date, 1 - this.info.cycleDay)
			const total = diffDays(this.info.nextPeriodStart, start)
			return Math.min(((this.info.cycleDay - 0.5) / total) * 100, 100)
		}
	},
	onShow() {
		this.reload()
		// 第一次打开：先去引导页回答 3 个问题
		if (needsOnboarding()) {
			uni.reLaunch({ url: '/pages/welcome/welcome' })
			return
		}
		// 每次启动先弹问候，关掉问候后再递小纸条；之后回到首页直接检查纸条
		if (!greetedThisSession) {
			greetedThisSession = true
			this.loadGreeting(true)
		} else {
			this.showLoveNote()
		}
	},
	methods: {
		reload() {
			this.settings = getSettings()
			this.periods = getPeriods()
			this.logs = getLogs()
			this.date = today()
			this.analysis = getDailyAnalysis(this.date)
		},
		async loadGreeting(showPopup) {
			this.greeting = await greet(this.settings, this.info)
			if (showPopup) {
				playSound('popup')
				this.$refs.greetPopup.open()
			}
		},
		closeGreeting() {
			playSound('tap')
			this.$refs.greetPopup.close()
			this.$refs.mascot.say(this.greeting)
			this.showLoveNote()
		},
		showLoveNote() {
			const note = takeNoteForToday()
			if (note) this.$refs.loveNote.open(note)
		},
		openQuickLog(key) {
			this.$refs.quickLog.open(key, this.todayLog ? this.todayLog[key] : null)
		},
		onQuickPick({ key, value }) {
			patchLog(this.date, { [key]: value })
			this.logs = getLogs()
			playSound('success')
			this.$refs.mascot.say(quickLogCheer(key, value))
			this.showLoveNote()
		},
		onStartPeriod() {
			playSound('tap')
			uni.showModal({
				title: '姨妈来访 🌹',
				content: '记录今天为本次月经第一天？（其他日期可以在日历里补记）',
				confirmColor: '#FF6B9A',
				success: res => {
					if (!res.confirm) return
					startPeriod(this.date)
					this.afterPeriodChange('已记录，今天开始要好好照顾自己哦 💗')
				}
			})
		},
		onEndPeriod() {
			playSound('tap')
			uni.showModal({
				title: '姨妈走啦 🌈',
				content: '记录今天为本次月经最后一天？',
				confirmColor: '#FF6B9A',
				success: res => {
					if (!res.confirm) return
					endPeriod(this.ongoing.start, this.date)
					this.afterPeriodChange('辛苦啦！元气满满的卵泡期就要来咯 ✨')
				}
			})
		},
		afterPeriodChange(message) {
			playSound('success')
			this.reload()
			this.$refs.mascot.say(message)
			this.loadGreeting(false)
			scheduleReminders()
			this.showLoveNote()
		},
		goRecord() {
			playSound('tap')
			uni.navigateTo({ url: `/pages/record/record?date=${this.date}` })
		},
		async runAnalysis() {
			playSound('tap')
			this.analyzing = true
			const result = await analyzeToday(this.settings, this.info, this.logs)
			this.analyzing = false
			this.analysis = result
			saveDailyAnalysis(this.date, result)
			playSound('success')
			this.$refs.mascot.say(result.cheer || '分析好啦～')
		}
	}
}
</script>

<style lang="scss" scoped>
.hello {
	margin: 4px 4px 18px;
}

.hello-name {
	font-size: 24px;
	font-weight: 800;
	margin-right: 10px;
}

.hello-date {
	font-size: 13px;
	color: $pm-text-light;
}

.hello-line {
	display: block;
	margin-top: 8px;
	font-size: 14px;
	color: #b0607e;
}

.hero {
	background: linear-gradient(160deg, #fff 40%, rgba(255, 228, 236, 0.9));
	border: 2px solid #fff;
}

.hero-top {
	display: flex;
	align-items: center;
}

.hero-badge {
	width: 58px;
	height: 58px;
	border-radius: 20px;
	background: var(--phase);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
	animation: wiggle 3s ease-in-out infinite;
}

.hero-emoji {
	font-size: 30px;
}

.hero-info {
	flex: 1;
	margin-left: 14px;
	display: flex;
	flex-direction: column;
}

.hero-phase {
	font-size: 22px;
	font-weight: 800;
	color: var(--phase);
}

.hero-count {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
}

.hero-count-num {
	font-size: 40px;
	font-weight: 800;
	line-height: 1;
	color: $pm-primary;
}

.cycle-bar {
	position: relative;
	display: flex;
	height: 14px;
	margin: 20px 0 8px;
	border-radius: 7px;
	overflow: visible;
	background: #f6e9ee;
}

.cycle-seg:first-child {
	border-radius: 7px 0 0 7px;
}

.cycle-seg:last-child {
	border-radius: 0 7px 7px 0;
}

.seg-period { background: #ff6b8b; }
.seg-follicular { background: #a7e8cd; }
.seg-fertile { background: #ffc98a; }
.seg-luteal { background: #ffd9a8; opacity: 0.7; }

.cycle-marker {
	position: absolute;
	top: -6px;
	width: 26px;
	height: 26px;
	margin-left: -13px;
	border-radius: 50%;
	background: #fff;
	border: 4px solid $pm-primary;
	box-sizing: border-box;
	box-shadow: 0 3px 8px rgba(255, 107, 154, 0.4);
	animation: pulse 1.8s ease-in-out infinite;
}

.cycle-legend {
	display: flex;
	justify-content: space-between;
}

.hero-actions {
	display: flex;
	margin-top: 18px;
}

.hero-actions .btn-cute {
	flex: 1;
}

.hero-actions .btn-cute + .btn-cute {
	margin-left: 12px;
}

.title-with-avatar {
	display: flex;
	align-items: center;
}

.title-avatar {
	width: 30px;
	height: 36px;
	margin-right: 6px;
}

.overview {
	display: flex;
	margin-bottom: 14px;
}

.tile {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 10px 0 8px;
	border-radius: 18px;
	background: #fff6f9;
	transition: transform 0.12s;
}

.tile + .tile {
	margin-left: 8px;
}

.tile-hover {
	transform: scale(0.94);
}

.quick-hint {
	display: flex;
	justify-content: space-between;
	margin: -6px 2px 12px;
	font-size: 12px;
	color: $pm-text-light;
}

.quick-more {
	color: $pm-primary;
}

.tile-icon {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22px;
	background: #fff;
	box-shadow: 0 3px 8px rgba(240, 98, 146, 0.15);
}

.tile-value {
	margin-top: 6px;
	font-size: 14px;
	font-weight: 700;
	color: $pm-text;
}

.tile-label {
	font-size: 11px;
	color: $pm-text-light;
}

.tone-good {
	background: #effaf5;
}

.tone-warn {
	background: #fff4e5;
}

.tone-warn .tile-value {
	color: #e8590c;
}

.tone-none {
	opacity: 0.55;
}

.symptoms {
	display: flex;
	flex-wrap: wrap;
	margin: -4px 0 12px;
}

.symptom {
	margin: 0 6px 6px 0;
	padding: 3px 10px;
	border-radius: 12px;
	font-size: 12px;
	color: $pm-primary;
	background: $pm-primary-soft;
}

.refresh {
	font-size: 13px;
	font-weight: 400;
	color: $pm-primary;
}

.analyzing {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12px 0;
}

.analyzing-img {
	width: 70px;
	height: 84px;
	animation: bounce 0.8s ease-in-out infinite;
}

.score-row {
	display: flex;
	align-items: center;
	margin-bottom: 14px;
}

.score {
	width: 76px;
	height: 76px;
	border-radius: 50%;
	flex-shrink: 0;
	display: flex;
	align-items: baseline;
	justify-content: center;
	padding-top: 20px;
	box-sizing: border-box;
	background: radial-gradient(circle, #fff 58%, transparent 60%), conic-gradient($pm-primary calc(var(--score) * 1%), #ffe4ec 0);
}

.score-num {
	font-size: 26px;
	font-weight: 800;
	color: $pm-primary;
}

.score-unit {
	font-size: 12px;
	color: $pm-text-light;
}

.score-text {
	margin-left: 14px;
	display: flex;
	flex-direction: column;
}

.score-level {
	font-size: 17px;
	font-weight: 700;
}

.score-summary {
	font-size: 14px;
	color: $pm-text-light;
	margin-top: 4px;
}

.warning {
	padding: 10px 12px;
	margin-bottom: 12px;
	border-radius: 14px;
	font-size: 13px;
	color: #c2410c;
	background: #fff4e5;
}

.analysis-block {
	margin-bottom: 10px;
}

.block-title {
	display: block;
	font-size: 14px;
	font-weight: 700;
	margin-bottom: 4px;
}

.block-text {
	display: block;
	font-size: 14px;
	line-height: 1.6;
	color: #6d4d5c;
}

.cheer {
	margin: 12px 0 6px;
	padding: 12px;
	border-radius: 16px;
	text-align: center;
	font-size: 14px;
	color: $pm-primary;
	background: $pm-primary-soft;
}

.analysis-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.analysis-empty .btn-cute {
	margin-top: 14px;
	width: 70%;
}

.mantra {
	font-size: 14px;
	color: $pm-primary;
	letter-spacing: 2px;
}

.care-tip {
	display: flex;
	align-items: center;
	padding: 8px 0;
	font-size: 14px;
}

.care-index {
	width: 22px;
	height: 22px;
	line-height: 22px;
	margin-right: 10px;
	flex-shrink: 0;
	border-radius: 50%;
	text-align: center;
	font-size: 12px;
	color: #fff;
	background: $pm-primary-light;
}

.disclaimer {
	display: block;
	padding: 0 12px;
	font-size: 11px;
	line-height: 1.6;
	text-align: center;
	color: #c4a3b1;
}

.greet-popup {
	width: 280px;
	padding: 24px 20px;
	border-radius: 28px;
	background: #fff;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.greet-img {
	width: 110px;
	height: 132px;
	margin-top: -70px;
	animation: bounce 1.2s ease-in-out infinite;
}

.greet-title {
	font-size: 18px;
	font-weight: 800;
	margin: 8px 0;
}

.greet-text {
	font-size: 15px;
	line-height: 1.6;
	text-align: center;
	color: #8a4a63;
	margin-bottom: 18px;
}

.greet-popup .btn-cute {
	width: 80%;
}

@keyframes wiggle {
	0%, 100% { transform: rotate(0); }
	10% { transform: rotate(-8deg); }
	20% { transform: rotate(8deg); }
	30% { transform: rotate(0); }
}

@keyframes pulse {
	0%, 100% { transform: scale(1); }
	50% { transform: scale(1.15); }
}

@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
}

@keyframes pop {
	from { transform: scale(0.5); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}
</style>
