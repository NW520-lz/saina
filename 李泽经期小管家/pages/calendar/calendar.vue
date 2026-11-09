<template>
	<view class="page">
		<view class="card float-in">
			<cycle-calendar :periods="periods" :settings="settings" :logs="logs" :selected="selected" @select="selected = $event" />
		</view>

		<!-- 选中日期详情 -->
		<view class="card float-in">
			<view class="card-title">
				<text>{{ selectedText }} · {{ selectedMeta.emoji }} {{ selectedMeta.name }}</text>
				<text v-if="selectedInfo.cycleDay" class="muted">周期第 {{ selectedInfo.cycleDay }} 天</text>
			</view>
			<text class="log-text">{{ selectedLogText }}</text>

			<view class="actions">
				<view v-if="!isFuture" class="btn-cute ghost small" hover-class="btn-hover" @tap="goRecord">📝 记录这天</view>
				<view v-if="canStart" class="btn-cute small" hover-class="btn-hover" @tap="onStart">🌹 这天月经来了</view>
				<view v-if="canEnd" class="btn-cute small" hover-class="btn-hover" @tap="onEnd">🌈 这天月经结束</view>
				<view v-if="periodStartingHere" class="btn-cute ghost small" hover-class="btn-hover" @tap="onRemove">🗑 删除这次经期</view>
			</view>
		</view>

		<!-- 预测汇总 -->
		<view v-if="todayInfo.cycleDay" class="card float-in">
			<view class="card-title">🔮 接下来的预测</view>
			<view class="predict-grid">
				<view class="predict-item">
					<text class="predict-label">下次月经</text>
					<text class="predict-value">{{ md(todayInfo.nextPeriodStart) }}</text>
				</view>
				<view class="predict-item">
					<text class="predict-label">排卵日</text>
					<text class="predict-value">{{ md(todayInfo.ovulationDate) }}</text>
				</view>
				<view class="predict-item">
					<text class="predict-label">易孕期</text>
					<text class="predict-value small-value">{{ md(todayInfo.fertileStart) }}-{{ md(todayInfo.fertileEnd) }}</text>
				</view>
				<view class="predict-item">
					<text class="predict-label">平均周期</text>
					<text class="predict-value">{{ todayInfo.cycleLength }} 天</text>
				</view>
			</view>
			<text class="muted">已记录 {{ periods.length }} 次经期 · 记录越多预测越准</text>
		</view>

		<mascot :lines="['点日期可以补记哦～', '粉色的是月经期，紫色是排卵日 💜', '虚线框是小泽预测的经期']" />
	</view>
</template>

<script>
import { getSettings, getPeriods, getLogs, startPeriod, endPeriod, removePeriod } from '@/services/storage.js'
import { getDayInfo, sortPeriods } from '@/domain/cycle.js'
import { phaseMeta } from '@/domain/phases.js'
import { today, diffDays, formatMonthDay } from '@/domain/date.js'
import { describeLog } from '@/services/ai/prompts.js'
import { playSound } from '@/services/sound.js'
import { scheduleReminders } from '@/services/notify.js'

export default {
	data() {
		return {
			settings: getSettings(),
			periods: [],
			logs: {},
			selected: today()
		}
	},
	computed: {
		selectedInfo() {
			return getDayInfo(this.selected, this.periods, this.settings)
		},
		// 预测汇总：本周期排卵日已过时，展示下个周期的排卵日与易孕期
		todayInfo() {
			const info = getDayInfo(today(), this.periods, this.settings)
			if (!info.ovulationDate || diffDays(info.ovulationDate, today()) >= 0) return info
			const next = getDayInfo(info.nextPeriodStart, this.periods, this.settings)
			return { ...info, ovulationDate: next.ovulationDate, fertileStart: next.fertileStart, fertileEnd: next.fertileEnd }
		},
		selectedMeta() {
			return phaseMeta(this.selectedInfo.phase)
		},
		selectedText() {
			return formatMonthDay(this.selected)
		},
		selectedLogText() {
			const log = this.logs[this.selected]
			return log ? describeLog(log) : this.isFuture ? '未来的日子，小泽先帮你预测着～' : '这天还没有记录哦'
		},
		isFuture() {
			return diffDays(this.selected, today()) > 0
		},
		periodStartingHere() {
			return this.periods.find(p => p.start === this.selected)
		},
		// 包含选中日期、尚未结束的经期
		openPeriod() {
			return sortPeriods(this.periods)
				.filter(p => !p.end && diffDays(this.selected, p.start) >= 0)
				.pop()
		},
		canStart() {
			return !this.isFuture && !this.periodStartingHere && !this.openPeriod
		},
		canEnd() {
			return !this.isFuture && Boolean(this.openPeriod) && diffDays(this.selected, this.openPeriod.start) <= 14
		}
	},
	onShow() {
		this.reload()
	},
	methods: {
		reload() {
			this.settings = getSettings()
			this.periods = getPeriods()
			this.logs = getLogs()
		},
		md(date) {
			return date ? formatMonthDay(date) : '-'
		},
		goRecord() {
			playSound('tap')
			uni.navigateTo({ url: `/pages/record/record?date=${this.selected}` })
		},
		onStart() {
			startPeriod(this.selected)
			this.done('已记录月经开始日 🌹')
		},
		onEnd() {
			endPeriod(this.openPeriod.start, this.selected)
			this.done('已记录月经结束日 🌈')
		},
		onRemove() {
			uni.showModal({
				title: '删除经期记录',
				content: `确定删除 ${this.selectedText} 开始的这次经期吗？`,
				confirmColor: '#FF6B9A',
				success: res => {
					if (!res.confirm) return
					removePeriod(this.selected)
					this.done('已删除')
				}
			})
		},
		done(title) {
			playSound('success')
			uni.showToast({ title, icon: 'none' })
			this.reload()
			scheduleReminders()
		}
	}
}
</script>

<style lang="scss" scoped>
.log-text {
	display: block;
	font-size: 14px;
	line-height: 1.6;
	color: #6d4d5c;
}

.actions {
	display: flex;
	flex-wrap: wrap;
	margin-top: 14px;
}

.btn-cute.small {
	height: 38px;
	padding: 0 16px;
	font-size: 13px;
	margin: 0 10px 12px 0;
}

.predict-grid {
	display: flex;
	flex-wrap: wrap;
	margin-bottom: 8px;
}

.predict-item {
	width: 50%;
	padding: 10px 0;
	display: flex;
	flex-direction: column;
}

.predict-label {
	font-size: 12px;
	color: $pm-text-light;
}

.predict-value {
	font-size: 20px;
	font-weight: 800;
	color: $pm-primary;
	margin-top: 2px;
}

.small-value {
	font-size: 16px;
}
</style>
