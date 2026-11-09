<template>
	<view class="mascot" :class="stateClass" :style="positionStyle" @tap="onTap">
		<view v-if="bubbleText" class="bubble" :style="bubbleStyle">
			<text class="bubble-text">{{ bubbleText }}</text>
		</view>
		<view class="flip">
			<view class="rig">
				<image class="part leg-l" src="/static/mascot/parts/leg-l.svg" />
				<image class="part leg-r" src="/static/mascot/parts/leg-r.svg" />
				<image class="part head-move" src="/static/mascot/parts/hair-back.svg" />
				<image class="part" src="/static/mascot/parts/body.svg" />
				<image class="part arm-l" src="/static/mascot/parts/arm-l.svg" />
				<image class="part arm-r" src="/static/mascot/parts/arm-r.svg" />
				<view class="part head-move">
					<image class="part" src="/static/mascot/parts/head.svg" />
					<!-- 表情层全部预先加载，用 v-show 切换，避免眨眼时图片闪烁 -->
					<image v-show="face === 'normal'" class="part" src="/static/mascot/parts/eyes-open.svg" />
					<image v-show="face === 'blink'" class="part" src="/static/mascot/parts/eyes-closed.svg" />
					<image v-show="face === 'happy'" class="part" src="/static/mascot/parts/eyes-happy.svg" />
					<image v-show="face !== 'happy'" class="part" src="/static/mascot/parts/mouth-smile.svg" />
					<image v-show="face === 'happy'" class="part" src="/static/mascot/parts/mouth-open.svg" />
					<image v-if="bubbleText && face !== 'happy'" :key="sayCount" class="part mouth-talk" src="/static/mascot/parts/mouth-open.svg" />
				</view>
			</view>
		</view>
		<view class="shadow" />
	</view>
</template>

<script>
// Q 版小人（分层骨骼动画）：待机呼吸摆头、走路迈腿摆手、走到屏幕边转身趴着偷看并招手、
// 偶尔挥手打招呼、说话时张嘴挥手，点一下开心地举手跳起来。
// 部件由 tools/gen-mascot.mjs 生成，关节点见该脚本注释。
// 用法：<mascot ref="mascot" :lines="['你好呀']" />，this.$refs.mascot.say('文字')
import { playSound } from '@/services/sound.js'

const SIZE = 85 // 小人宽度（px），高度按 5:6 为 102
const EDGE = 8
const BUBBLE_MS = 4500
const BUBBLE_WIDTH = 200
const WALK_SPEED = 60 // 走路速度（px/秒）
const WAVE_MS = 1600

export default {
	name: 'mascot',
	props: {
		// 点击时随机说的话
		lines: { type: Array, default: () => ['戳我干嘛呀～', '今天也要开开心心哦 💗'] }
	},
	emits: ['tap-mascot'],
	data() {
		return {
			x: 0,
			moveSec: 0,
			pose: 'idle', // idle | walk | peek
			face: 'normal', // normal | blink | happy
			facingLeft: false,
			jumping: false,
			waving: false,
			bubbleText: '',
			sayCount: 0,
			windowWidth: 375
		}
	},
	computed: {
		stateClass() {
			return ['is-' + this.pose, { 'is-jumping': this.jumping, 'is-waving': this.waving }]
		},
		positionStyle() {
			const flip = this.facingLeft ? -1 : 1
			return `left:${this.x}px;--flip:${flip};transition-duration:${this.moveSec}s;`
		},
		// 气泡居中于小人上方，并限制在屏幕内
		bubbleStyle() {
			const centered = this.x + SIZE / 2 - BUBBLE_WIDTH / 2
			const left = Math.min(Math.max(centered, EDGE), this.windowWidth - BUBBLE_WIDTH - EDGE)
			return `left:${left - this.x}px;`
		}
	},
	mounted() {
		this.windowWidth = uni.getSystemInfoSync().windowWidth
		this.x = this.windowWidth - SIZE - EDGE
		this.blinkLoop()
		this.actionLoop()
	},
	beforeUnmount() {
		;['blinkTimer', 'actionTimer', 'bubbleTimer', 'walkTimer', 'waveTimer', 'jumpTimer'].forEach((t) => clearTimeout(this[t]))
	},
	methods: {
		say(text) {
			this.sayCount++
			this.bubbleText = text
			this.wave()
			clearTimeout(this.bubbleTimer)
			this.bubbleTimer = setTimeout(() => (this.bubbleText = ''), BUBBLE_MS)
		},
		onTap() {
			playSound('tap')
			if (this.pose !== 'idle') this.stopAt(Math.min(Math.max(this.x, EDGE), this.windowWidth - SIZE - EDGE))
			this.face = 'happy'
			this.jumping = true
			clearTimeout(this.jumpTimer)
			this.jumpTimer = setTimeout(() => {
				this.jumping = false
				this.face = 'normal'
			}, 700)
			this.say(this.lines[Math.floor(Math.random() * this.lines.length)])
			this.$emit('tap-mascot')
		},
		wave() {
			this.waving = true
			clearTimeout(this.waveTimer)
			this.waveTimer = setTimeout(() => (this.waving = false), WAVE_MS)
		},
		blinkLoop() {
			this.blinkTimer = setTimeout(() => {
				if (this.face === 'normal') {
					this.face = 'blink'
					setTimeout(() => this.face === 'blink' && (this.face = 'normal'), 160)
				}
				this.blinkLoop()
			}, 2500 + Math.random() * 3000)
		},
		// 每隔一段时间随机：散步 / 去屏幕边偷看 / 挥挥手 / 原地待着
		actionLoop() {
			this.actionTimer = setTimeout(() => {
				if (!this.bubbleText && !this.jumping) {
					const roll = Math.random()
					if (roll < 0.45) this.walkTo(EDGE + Math.random() * (this.windowWidth - SIZE - EDGE * 2))
					else if (roll < 0.7) this.peek()
					else if (roll < 0.85) this.wave()
				}
				this.actionLoop()
			}, 6000 + Math.random() * 6000)
		},
		walkTo(targetX, onArrive) {
			clearTimeout(this.walkTimer)
			this.moveSec = Math.max(0.8, Math.abs(targetX - this.x) / WALK_SPEED)
			this.facingLeft = targetX < this.x
			this.pose = 'walk'
			this.x = targetX
			this.walkTimer = setTimeout(() => {
				this.pose = 'idle'
				onArrive && onArrive()
			}, this.moveSec * 1000)
		},
		// 走到屏幕边，转身面向屏幕趴着偷看
		peek() {
			const toLeft = Math.random() < 0.5
			const edgeX = toLeft ? -SIZE * 0.4 : this.windowWidth - SIZE * 0.6
			this.walkTo(edgeX, () => {
				this.facingLeft = !toLeft
				this.pose = 'peek'
			})
		},
		// 立刻停下（被点击时），0.3 秒快速回到屏幕内
		stopAt(x) {
			clearTimeout(this.walkTimer)
			this.moveSec = 0.3
			this.pose = 'idle'
			this.x = x
		}
	}
}
</script>

<style lang="scss" scoped>
/* 关节点（占部件画布的百分比）：脖子 50% 66%、左肩 35% 70%、右肩 65% 70%、左髋 43% 87.5%、右髋 57% 87.5% */
.mascot {
	position: fixed;
	z-index: 90;
	bottom: calc(var(--window-bottom, 0px) + 16px);
	width: 85px;
	height: 102px;
	transition-property: left;
	transition-timing-function: linear;
}

.flip,
.rig,
.part {
	position: absolute;
	left: 0;
	top: 0;
	width: 85px;
	height: 102px;
}

.flip {
	transform: scaleX(var(--flip));
}

.rig {
	transform-origin: 50% 100%;
	transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.head-move {
	transform-origin: 50% 66%;
}

.arm-l {
	transform-origin: 35% 70%;
}

.arm-r {
	transform-origin: 65% 70%;
}

.leg-l {
	transform-origin: 43% 87.5%;
}

.leg-r {
	transform-origin: 57% 87.5%;
}

.shadow {
	position: absolute;
	left: 17px;
	bottom: -4px;
	width: 50px;
	height: 8px;
	border-radius: 50%;
	background: rgba(240, 98, 146, 0.18);
	transition: opacity 0.3s;
}

/* —— 待机：轻轻弹、摇头、手臂小幅摆动 —— */
.is-idle {
	.rig { animation: bob 2.4s ease-in-out infinite; }
	.head-move { animation: head-sway 3.2s ease-in-out infinite; }
	.arm-l { animation: arm-sway-l 2.4s ease-in-out infinite; }
	.arm-r { animation: arm-sway-r 2.4s ease-in-out infinite; }
	.shadow { animation: shadow 2.4s ease-in-out infinite; }
}

/* —— 走路：两腿交替迈步，手臂与腿反向摆，身体一步一颠 —— */
.is-walk {
	.rig { animation: step-bounce 0.3s ease-in-out infinite; }
	.head-move { animation: head-sway 0.6s ease-in-out infinite; }
	.leg-l { animation: swing 0.6s ease-in-out infinite; }
	.leg-r { animation: swing 0.6s ease-in-out -0.3s infinite; }
	.arm-l { animation: swing 0.6s ease-in-out -0.3s infinite; }
	.arm-r { animation: swing 0.6s ease-in-out infinite; }
}

/* —— 偷看：在屏幕边探身，朝屏幕里招手 —— */
.is-peek {
	.rig { transform: rotate(26deg); }
	.head-move { animation: head-tilt 2s ease-in-out infinite; }
	.arm-r { animation: beckon 1.2s ease-in-out infinite; }
	.shadow { opacity: 0; }
}

/* —— 挥手（说话时、随机打招呼）—— */
.is-waving .arm-r {
	animation: wave 1.6s ease-in-out;
}

/* —— 被点击：双手举高跳起来 —— */
.is-jumping {
	.rig { animation: jump 0.7s ease-out; }
	.arm-l { animation: arms-up-l 0.7s ease-out; }
	.arm-r { animation: arms-up-r 0.7s ease-out; }
}

/* 说话时嘴巴一张一合 */
.mouth-talk {
	opacity: 0;
	animation: talk 0.32s steps(1) 8;
}

.bubble {
	position: absolute;
	bottom: 112px;
	width: 200px;
	box-sizing: border-box;
	padding: 10px 14px;
	background: #fff;
	border: 2px solid #ffc2d4;
	border-radius: 18px;
	box-shadow: 0 6px 16px rgba(240, 98, 146, 0.18);
	animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bubble-text {
	font-size: 13px;
	line-height: 1.5;
	color: #8a4a63;
}

@keyframes bob {
	0%, 100% { transform: translateY(0) scaleY(1); }
	50% { transform: translateY(-5px) scaleY(1.02); }
}

@keyframes shadow {
	0%, 100% { transform: scale(1); opacity: 1; }
	50% { transform: scale(0.82); opacity: 0.6; }
}

@keyframes head-sway {
	0%, 100% { transform: rotate(-4deg); }
	50% { transform: rotate(4deg); }
}

@keyframes head-tilt {
	0%, 100% { transform: rotate(-8deg); }
	50% { transform: rotate(-14deg); }
}

@keyframes arm-sway-l {
	0%, 100% { transform: rotate(0); }
	50% { transform: rotate(8deg); }
}

@keyframes arm-sway-r {
	0%, 100% { transform: rotate(0); }
	50% { transform: rotate(-8deg); }
}

@keyframes swing {
	0%, 100% { transform: rotate(-20deg); }
	50% { transform: rotate(20deg); }
}

@keyframes step-bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-4px); }
}

@keyframes beckon {
	0%, 100% { transform: rotate(-120deg); }
	50% { transform: rotate(-150deg); }
}

@keyframes wave {
	0%, 100% { transform: rotate(0); }
	15% { transform: rotate(-135deg); }
	30% { transform: rotate(-160deg); }
	45% { transform: rotate(-130deg); }
	60% { transform: rotate(-160deg); }
	75% { transform: rotate(-135deg); }
}

@keyframes jump {
	0% { transform: translateY(0) scale(1, 1); }
	20% { transform: translateY(0) scale(1.1, 0.9); }
	50% { transform: translateY(-36px) scale(0.95, 1.05); }
	80% { transform: translateY(0) scale(1.08, 0.92); }
	100% { transform: translateY(0) scale(1, 1); }
}

@keyframes arms-up-l {
	0%, 100% { transform: rotate(0); }
	40%, 70% { transform: rotate(140deg); }
}

@keyframes arms-up-r {
	0%, 100% { transform: rotate(0); }
	40%, 70% { transform: rotate(-140deg); }
}

@keyframes talk {
	0% { opacity: 1; }
	50% { opacity: 0; }
}

@keyframes pop-in {
	from { transform: scale(0.4); opacity: 0; }
	to { transform: scale(1); opacity: 1; }
}
</style>
