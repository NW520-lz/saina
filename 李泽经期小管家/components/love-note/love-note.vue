<template>
	<uni-popup ref="popup" type="center" :mask-click="false">
		<!-- 第一步：小泽递来信封 -->
		<view v-if="!opened" class="envelope-card">
			<image class="courier" src="/static/mascot/happy.svg" mode="aspectFit" />
			<view class="envelope" @tap="unfold">
				<text class="envelope-icon">💌</text>
			</view>
			<text class="envelope-text">李泽托小泽带了一张小纸条给你～</text>
			<view class="btn-cute" hover-class="btn-hover" @tap="unfold">拆开看看</view>
		</view>

		<!-- 第二步：展开纸条 -->
		<view v-else class="paper">
			<text class="paper-date">{{ dateText }}</text>
			<text class="paper-text">{{ note.text }}</text>
			<text class="paper-sign">—— 李泽</text>
			<view class="btn-cute" hover-class="btn-hover" @tap="close">收好啦 💗</view>
			<text class="paper-hint">纸条会收进「我的 → 小纸条盒」</text>
		</view>
	</uni-popup>
</template>

<script>
// 李泽的小纸条：小泽先递来信封，点开后展开纸条。
// 用法：<love-note ref="loveNote" />，this.$refs.loveNote.open({ text, date })
import { formatMonthDay } from '@/domain/date.js'
import { playSound } from '@/services/sound.js'

export default {
	name: 'love-note',
	emits: ['close'],
	data() {
		return { note: { text: '', date: '' }, opened: false }
	},
	computed: {
		dateText() {
			return this.note.date ? formatMonthDay(this.note.date) : ''
		}
	},
	methods: {
		open(note) {
			this.note = note
			this.opened = false
			playSound('popup')
			this.$refs.popup.open()
		},
		unfold() {
			playSound('success')
			this.opened = true
		},
		close() {
			playSound('tap')
			this.$refs.popup.close()
			this.$emit('close')
		}
	}
}
</script>

<style lang="scss" scoped>
.envelope-card,
.paper {
	width: 290px;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	align-items: center;
	border-radius: 28px;
}

.envelope-card {
	padding: 0 22px 24px;
	background: #fff;
	animation: pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.courier {
	width: 96px;
	height: 115px;
	margin-top: -60px;
}

.envelope {
	margin: -6px 0 6px;
	animation: wiggle 1.4s ease-in-out infinite;
}

.envelope-icon {
	font-size: 64px;
}

.envelope-text {
	font-size: 15px;
	color: #8a4a63;
	margin-bottom: 18px;
	text-align: center;
}

.envelope-card .btn-cute,
.paper .btn-cute {
	width: 80%;
}

.paper {
	padding: 26px 24px 18px;
	/* 横线信纸 */
	background-color: #fffdf6;
	background-image: repeating-linear-gradient(180deg, transparent 0, transparent 31px, #f6dfe6 31px, #f6dfe6 32px);
	box-shadow: 0 12px 30px rgba(240, 98, 146, 0.25);
	transform-origin: top center;
	animation: unfold 0.5s cubic-bezier(0.34, 1.4, 0.64, 1);
}

.paper-date {
	align-self: flex-end;
	font-size: 12px;
	color: $pm-text-light;
}

.paper-text {
	align-self: stretch;
	margin: 10px 0 12px;
	font-size: 17px;
	line-height: 32px;
	color: #6b3a4f;
	font-family: 'KaiTi', 'STKaiti', 'Kaiti SC', serif;
}

.paper-sign {
	align-self: flex-end;
	margin-bottom: 18px;
	font-size: 16px;
	color: $pm-primary;
	font-family: 'KaiTi', 'STKaiti', 'Kaiti SC', serif;
}

.paper-hint {
	margin-top: 10px;
	font-size: 11px;
	color: #c4a3b1;
}

@keyframes pop {
	from { transform: scale(0.5); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}

@keyframes unfold {
	from { transform: scaleY(0.1); opacity: 0; }
	to { transform: scaleY(1); opacity: 1; }
}

@keyframes wiggle {
	0%, 100% { transform: rotate(0); }
	15% { transform: rotate(-10deg) scale(1.05); }
	30% { transform: rotate(10deg) scale(1.05); }
	45% { transform: rotate(0); }
}
</style>
