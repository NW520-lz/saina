<template>
	<view class="welcome">
		<view v-if="step > 0" class="progress">
			<view v-for="n in 3" :key="n" class="progress-dot" :class="{ active: n <= step }" />
		</view>

		<image class="mascot-img" :src="step === 0 ? '/static/mascot/happy.svg' : '/static/mascot/normal.svg'" mode="aspectFit" />

		<!-- 打招呼 -->
		<view v-if="step === 0" :key="0" class="panel">
			<text class="title">{{ nickname }}，你好呀！</text>
			<text class="desc">我是小泽，你的经期健康小助手。\n以后每天陪着你、照顾你 💗\n先回答我 3 个小问题，我就能帮你算经期啦～</text>
			<view class="btn-cute" hover-class="btn-hover" @tap="next">好呀，开始吧</view>
			<text class="link" @tap="skip">先随便看看</text>
		</view>

		<!-- 第 1 步：上次月经 -->
		<view v-else-if="step === 1" :key="1" class="panel">
			<text class="title">上次月经是哪天来的？</text>
			<text class="desc">选第一天就好，正在经期的话选今天或这几天</text>
			<view class="chips">
				<view class="chip" :class="{ active: lastStart === todayStr }" @tap="setLastStart(todayStr)">今天</view>
				<view class="chip" :class="{ active: lastStart === yesterdayStr }" @tap="setLastStart(yesterdayStr)">昨天</view>
				<picker mode="date" :value="lastStart || todayStr" :start="minDate" :end="todayStr" @change="setLastStart($event.detail.value)">
					<view class="chip" :class="{ active: isOtherDate }">📅 {{ isOtherDate ? lastStartText : '选其他日期' }}</view>
				</picker>
			</view>
			<view class="btn-cute" :class="{ disabled: !lastStart }" hover-class="btn-hover" @tap="lastStart && next()">下一步</view>
			<text class="link" @tap="forgetLastStart">记不清了</text>
		</view>

		<!-- 第 2 步：经期天数 -->
		<view v-else-if="step === 2" :key="2" class="panel">
			<text class="title">一般会持续几天？</text>
			<text class="desc">不太确定就选 5 天，之后小泽会根据记录自动调整</text>
			<view class="chips">
				<view v-for="n in periodOptions" :key="n" class="chip big" :class="{ active: periodLength === n }" @tap="choose('periodLength', n)">{{ n }} 天</view>
			</view>
			<view class="btn-cute" hover-class="btn-hover" @tap="next">下一步</view>
			<text class="link" @tap="back">上一步</text>
		</view>

		<!-- 第 3 步：周期长度 -->
		<view v-else :key="3" class="panel">
			<text class="title">两次月经大概隔多久？</text>
			<text class="desc">从这次来的第一天，到下次来的第一天。\n不清楚就用 28 天，记录 2 次以上会自动计算</text>
			<view class="stepper">
				<uni-number-box :value="cycleLength" :min="20" :max="45" @change="choose('cycleLength', $event)" />
				<text class="stepper-unit">天</text>
			</view>
			<view class="btn-cute" hover-class="btn-hover" @tap="finish">完成，开始使用 ✨</view>
			<text class="link" @tap="back">上一步</text>
		</view>
	</view>
</template>

<script>
// 首次打开引导：打招呼 + 3 个问题（上次月经、经期天数、周期长度）。
// 今天页发现「没完成引导且没有任何经期记录」时 reLaunch 到这里，完成后回到今天页。
import { getSettings, saveSettings, startPeriod, endPeriod } from '@/services/storage.js'
import { scheduleReminders } from '@/services/notify.js'
import { initialPeriod } from '@/domain/cycle.js'
import { today, addDays, formatMonthDay } from '@/domain/date.js'
import { playSound } from '@/services/sound.js'

const LOOKBACK_DAYS = 90

export default {
	data() {
		const todayStr = today()
		const settings = getSettings()
		return {
			step: 0,
			nickname: settings.nickname,
			todayStr,
			yesterdayStr: addDays(todayStr, -1),
			minDate: addDays(todayStr, -LOOKBACK_DAYS),
			lastStart: '',
			periodLength: settings.periodLength,
			cycleLength: settings.cycleLength,
			periodOptions: [3, 4, 5, 6, 7, 8]
		}
	},
	computed: {
		isOtherDate() {
			return Boolean(this.lastStart) && this.lastStart !== this.todayStr && this.lastStart !== this.yesterdayStr
		},
		lastStartText() {
			return formatMonthDay(this.lastStart)
		}
	},
	methods: {
		next() {
			playSound('tap')
			this.step++
		},
		back() {
			playSound('tap')
			this.step--
		},
		choose(key, value) {
			playSound('tap')
			this[key] = value
		},
		setLastStart(date) {
			this.choose('lastStart', date)
		},
		forgetLastStart() {
			this.lastStart = ''
			this.next()
		},
		skip() {
			saveSettings({ onboarded: true })
			this.goHome()
		},
		finish() {
			saveSettings({ periodLength: this.periodLength, cycleLength: this.cycleLength, onboarded: true })
			if (this.lastStart) {
				const period = initialPeriod(this.lastStart, this.periodLength, this.todayStr)
				startPeriod(period.start)
				if (period.end) endPeriod(period.start, period.end)
			}
			scheduleReminders()
			playSound('success')
			uni.showToast({ title: '记好啦，以后小泽陪着你 💗', icon: 'none' })
			setTimeout(this.goHome, 800)
		},
		goHome() {
			uni.switchTab({ url: '/pages/today/today' })
		}
	}
}
</script>

<style lang="scss" scoped>
.welcome {
	min-height: 100vh;
	box-sizing: border-box;
	padding: calc(var(--status-bar-height, 20px) + 40px) 28px 40px;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: linear-gradient(180deg, #ffe0ec 0%, #fff6f9 60%);
}

.progress {
	display: flex;
	margin-bottom: 18px;
}

.progress-dot {
	width: 34px;
	height: 8px;
	margin: 0 4px;
	border-radius: 4px;
	background: #ffd3e0;
	transition: background 0.3s;
}

.progress-dot.active {
	background: $pm-primary;
}

.mascot-img {
	width: 130px;
	height: 156px;
	animation: bounce 1.6s ease-in-out infinite;
}

.panel {
	width: 100%;
	margin-top: 18px;
	padding: 24px 20px;
	box-sizing: border-box;
	border-radius: $pm-radius;
	background: #fff;
	box-shadow: $pm-shadow;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: float-in 0.4s ease-out both;
}

.title {
	font-size: 21px;
	font-weight: 800;
	color: $pm-text;
	text-align: center;
}

.desc {
	margin: 10px 0 20px;
	font-size: 14px;
	line-height: 1.7;
	color: $pm-text-light;
	text-align: center;
	white-space: pre-line;
}

.chips {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	margin-bottom: 12px;
}

.chip.big {
	width: 76px;
	box-sizing: border-box;
	justify-content: center;
	font-size: 15px;
}

.stepper {
	display: flex;
	align-items: center;
	margin-bottom: 24px;
	transform: scale(1.25);
}

.stepper-unit {
	margin-left: 8px;
	font-size: 14px;
}

.panel .btn-cute {
	width: 85%;
}

.btn-cute.disabled {
	opacity: 0.45;
}

.link {
	margin-top: 16px;
	font-size: 13px;
	color: $pm-text-light;
}

@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
}
</style>
