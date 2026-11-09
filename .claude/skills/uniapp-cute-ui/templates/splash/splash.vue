<template>
	<view class="splash" :class="{ playing: stage >= STAGE.playing, assembled: stage >= STAGE.assembled, leaving: stage >= STAGE.leaving }" @tap="leave">
		<view class="content">
			<view class="avatar" :style="avatarStyle">
				<view v-for="block in blocks" :key="block.key" class="block" :style="block.style" />
			</view>
			<view class="caption">
				<text class="title">李泽经期小管家</text>
				<text class="subtitle">小泽陪着你</text>
			</view>
		</view>
	</view>
</template>

<script>
// 冷启动动画。它是 pages.json 的第一个页面，所以只有冷启动会进来，从后台切回来不会再播。
// 0–1.2s 方块从屏幕各处飞来拼成像素头像 → 1.2s 弹一下、「叮」、标题淡入 → 1.7s 淡出 → 2s 进入首页（第一次打开进引导页）。
// 点一下屏幕直接跳过。
import avatarPixels from './avatar-pixels.js'
import { CELL_PX, FLY_MS, ASSEMBLE_MS, decodePixels, scatter } from './assemble.js'
import { needsOnboarding } from '@/services/storage.js'
import { remindInApp } from '@/services/notify.js'
import { playSound } from '@/services/sound.js'

const STAGE = { idle: 0, playing: 1, assembled: 2, leaving: 3 }
const FADE_AT_MS = 1700
const LEAVE_AT_MS = 2000

// 起飞姿态直接写在方块自己的 transform 上，keyframes 只写终点。
// 比在 keyframes 里用 var(--dx) 读 CSS 变量省一半左右的样式计算（Chrome trace 实测），880 个方块更稳
function blockStyle({ x, y, color, dx, dy, turn, delay }) {
	return `left:${x * CELL_PX}px;top:${y * CELL_PX}px;background:${color};opacity:0;` +
		`transform:translate(${dx}vw,${dy}vh) rotate(${turn}deg) scale(0.3);animation-delay:${delay}ms`
}

export default {
	data() {
		return {
			STAGE,
			stage: STAGE.idle,
			avatarStyle: `--fly:${FLY_MS}ms`,
			blocks: scatter(decodePixels(avatarPixels)).map(b => ({ key: `${b.x}-${b.y}`, style: blockStyle(b) })),
			timers: [],
			left: false
		}
	},
	onReady() {
		// 首屏渲染完才开播：原生启动图（同色纯粉）正好在这时关闭，看不出切换
		this.stage = STAGE.playing
		this.timers = [
			setTimeout(this.onAssembled, ASSEMBLE_MS),
			setTimeout(() => (this.stage = STAGE.leaving), FADE_AT_MS),
			setTimeout(this.leave, LEAVE_AT_MS)
		]
	},
	onUnload() {
		this.timers.forEach(clearTimeout)
	},
	methods: {
		onAssembled() {
			this.stage = STAGE.assembled
			playSound('ding')
		},
		leave() {
			if (this.left) return
			this.left = true
			this.timers.forEach(clearTimeout)
			if (needsOnboarding()) uni.reLaunch({ url: '/pages/welcome/welcome' })
			else uni.switchTab({ url: '/pages/today/today' })
			remindInApp() // 冷启动的应用内提醒推迟到动画之后（见 App.vue）
		}
	}
}
</script>

<style lang="scss" scoped>
.splash {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #ffe9f1; /* 与原生启动图同色，见 tools/gen-splash.py 的 BACKGROUND */
	overflow: hidden;
}

.content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.avatar {
	position: relative;
	width: 300px; /* 30 格 × CELL_PX */
	height: 300px;
}

.block {
	position: absolute;
	width: 10px;
	height: 10px;
}

.playing .block {
	animation: fly-in var(--fly) cubic-bezier(0.2, 0.8, 0.3, 1) both;
}

.assembled .avatar {
	animation: pop 0.4s ease-out;
}

.caption {
	margin-top: 26px;
	display: flex;
	flex-direction: column;
	align-items: center;
	opacity: 0;
}

.assembled .caption {
	animation: caption-in 0.4s ease-out both;
}

.title {
	font-size: 22px;
	font-weight: 800;
	letter-spacing: 2px;
	color: $pm-primary;
}

.subtitle {
	margin-top: 6px;
	font-size: 14px;
	letter-spacing: 4px;
	color: $pm-text-light;
}

.leaving .content {
	animation: fade-out 0.3s ease-in both;
}

/* 没有 from：起点就是方块行内样式里的起飞姿态 */
@keyframes fly-in {
	30% { opacity: 1; }
	to { opacity: 1; transform: none; }
}

@keyframes pop {
	0%, 100% { transform: scale(1); }
	40% { transform: scale(1.08); }
	75% { transform: scale(0.97); }
}

@keyframes caption-in {
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: none; }
}

@keyframes fade-out {
	to { opacity: 0; }
}
</style>
