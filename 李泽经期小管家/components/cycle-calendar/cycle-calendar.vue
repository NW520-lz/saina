<template>
	<view class="cycle-calendar">
		<view class="header">
			<view class="nav" hover-class="nav-hover" @tap="changeMonth(-1)">‹</view>
			<text class="title">{{ year }} 年 {{ month }} 月</text>
			<view class="nav" hover-class="nav-hover" @tap="changeMonth(1)">›</view>
		</view>

		<view class="grid">
			<text v-for="w in weekNames" :key="w" class="week">{{ w }}</text>
			<view v-for="n in leadingBlanks" :key="'b' + n" class="cell" />
			<view
				v-for="day in days"
				:key="day.date"
				class="cell"
				:class="['phase-' + day.phase, { today: day.date === todayDate, selected: day.date === selected }]"
				@tap="onSelect(day.date)"
			>
				<text class="num">{{ day.num }}</text>
				<text v-if="day.hasLog" class="dot">●</text>
				<text v-if="day.phase === 'ovulation'" class="badge">卵</text>
			</view>
		</view>

		<view class="legend">
			<view v-for="item in legend" :key="item.label" class="legend-item">
				<view class="legend-color" :class="'phase-' + item.phase" />
				<text>{{ item.label }}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getDayInfo, PHASE } from '@/domain/cycle.js'
import { daysInMonth, weekdayOf, today } from '@/domain/date.js'
import { playSound } from '@/services/sound.js'

export default {
	name: 'cycle-calendar',
	props: {
		periods: { type: Array, required: true },
		settings: { type: Object, required: true },
		logs: { type: Object, default: () => ({}) },
		selected: { type: String, default: '' }
	},
	emits: ['select'],
	data() {
		const now = new Date()
		return {
			year: now.getFullYear(),
			month: now.getMonth() + 1,
			todayDate: today(),
			weekNames: ['日', '一', '二', '三', '四', '五', '六'],
			legend: [
				{ phase: PHASE.PERIOD, label: '月经期' },
				{ phase: PHASE.PREDICTED_PERIOD, label: '预测经期' },
				{ phase: PHASE.FERTILE, label: '易孕期' },
				{ phase: PHASE.OVULATION, label: '排卵日' }
			]
		}
	},
	computed: {
		days() {
			return daysInMonth(this.year, this.month).map(date => ({
				date,
				num: Number(date.slice(8)),
				phase: getDayInfo(date, this.periods, this.settings).phase,
				hasLog: Boolean(this.logs[date])
			}))
		},
		leadingBlanks() {
			return weekdayOf(this.days[0].date)
		}
	},
	methods: {
		changeMonth(step) {
			playSound('tap')
			const index = this.year * 12 + (this.month - 1) + step
			this.year = Math.floor(index / 12)
			this.month = (index % 12) + 1
		},
		onSelect(date) {
			playSound('tap')
			this.$emit('select', date)
		}
	}
}
</script>

<style lang="scss" scoped>
.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 12px;
}

.title {
	font-size: 17px;
	font-weight: 700;
}

.nav {
	width: 36px;
	height: 36px;
	line-height: 34px;
	text-align: center;
	font-size: 24px;
	color: $pm-primary;
	background: $pm-primary-soft;
	border-radius: 50%;
}

.nav-hover {
	transform: scale(0.9);
}

.grid {
	display: flex;
	flex-wrap: wrap;
}

.week,
.cell {
	width: 14.2857%;
	box-sizing: border-box;
	text-align: center;
}

.week {
	font-size: 12px;
	color: $pm-text-light;
	padding-bottom: 8px;
}

.cell {
	position: relative;
	height: 44px;
	padding-top: 4px;
	margin-bottom: 4px;
	border-radius: 14px;
	transition: transform 0.15s;
}

.cell:active {
	transform: scale(0.9);
}

.num {
	display: block;
	font-size: 15px;
	line-height: 28px;
}

.dot {
	position: absolute;
	bottom: 2px;
	left: 0;
	right: 0;
	font-size: 8px;
	color: $pm-primary;
}

.badge {
	position: absolute;
	top: -2px;
	right: 0;
	font-size: 9px;
	color: #fff;
	background: #b794f6;
	border-radius: 8px;
	padding: 0 4px;
}

.phase-period {
	background: #ff6b8b;
	color: #fff;
}

.phase-period .dot {
	color: #fff;
}

.phase-predictedPeriod {
	background: #fff;
	border: 2px dashed #ff9eb5;
	color: #ff6b8b;
}

.phase-fertile {
	background: #fff1dc;
	color: #e08a1e;
}

.phase-ovulation {
	background: #efe6ff;
	color: #8b5cf6;
	font-weight: 700;
}

.today {
	box-shadow: 0 0 0 2px $pm-primary inset;
	font-weight: 700;
}

.selected {
	transform: scale(1.08);
	box-shadow: 0 4px 12px rgba(255, 107, 154, 0.35);
}

.today.selected {
	box-shadow: 0 0 0 2px $pm-primary inset, 0 4px 12px rgba(255, 107, 154, 0.35);
}

.legend {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-around;
	margin-top: 12px;
	font-size: 12px;
	color: $pm-text-light;
}

.legend-item {
	display: flex;
	align-items: center;
}

.legend-color {
	width: 14px;
	height: 14px;
	border-radius: 5px;
	margin-right: 4px;
	box-sizing: border-box;
}
</style>
