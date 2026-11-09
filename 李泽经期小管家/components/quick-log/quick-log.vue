<template>
	<uni-popup ref="popup" type="bottom" :safe-area="false">
		<view class="sheet">
			<view class="sheet-handle" />
			<text class="sheet-title">{{ field.title }}</text>
			<view class="options">
				<view
					v-for="o in field.options"
					:key="o.value"
					class="option"
					:class="{ active: o.value === current }"
					hover-class="option-hover"
					@tap="pick(o.value)"
				>
					<text class="option-emoji">{{ o.emoji }}</text>
					<text class="option-label">{{ o.label }}</text>
				</view>
			</view>
			<text class="more" @tap="more">还想记症状、悄悄话？去完整记录 ›</text>
		</view>
	</uni-popup>
</template>

<script>
// 首页快速打卡：点经量 / 疼痛 / 心情 / 睡眠图标弹出，一点选项就关闭并通知父组件保存。
// 用法：<quick-log ref="quickLog" @pick="onPick" @more="goRecord" />，this.$refs.quickLog.open('mood', 当前值)
import { QUICK_LOG_FIELDS } from '@/domain/phases.js'
import { playSound } from '@/services/sound.js'

export default {
	name: 'quick-log',
	emits: ['pick', 'more'],
	data() {
		return { key: 'mood', current: null }
	},
	computed: {
		field() {
			return QUICK_LOG_FIELDS[this.key]
		}
	},
	methods: {
		open(key, current) {
			this.key = key
			this.current = current
			playSound('popup')
			this.$refs.popup.open()
		},
		pick(value) {
			this.current = value
			this.$refs.popup.close()
			this.$emit('pick', { key: this.key, value })
		},
		more() {
			this.$refs.popup.close()
			this.$emit('more')
		}
	}
}
</script>

<style lang="scss" scoped>
.sheet {
	/* H5 的 tabBar 盖在弹层上方，底部留出 tabBar 高度；App 端 --window-bottom 为 0 */
	padding: 10px 18px calc(var(--window-bottom, 0px) + 22px);
	border-radius: 28px 28px 0 0;
	background: #fff;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.sheet-handle {
	width: 40px;
	height: 5px;
	border-radius: 3px;
	background: $pm-border;
	margin-bottom: 14px;
}

.sheet-title {
	font-size: 17px;
	font-weight: 800;
	margin-bottom: 16px;
}

.options {
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.option {
	width: 31%;
	margin-bottom: 12px;
	padding: 12px 0;
	border-radius: 20px;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: #fff5f8;
	border: 2px solid transparent;
	transition: transform 0.15s;
	animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.option:nth-child(2) { animation-delay: 0.03s; }
.option:nth-child(3) { animation-delay: 0.06s; }
.option:nth-child(4) { animation-delay: 0.09s; }
.option:nth-child(5) { animation-delay: 0.12s; }
.option:nth-child(6) { animation-delay: 0.15s; }

.option.active {
	border-color: $pm-primary;
	background: $pm-primary-soft;
}

.option-hover {
	transform: scale(0.92);
}

.option-emoji {
	font-size: 28px;
	line-height: 1.3;
}

.option-label {
	margin-top: 4px;
	font-size: 13px;
	color: $pm-text;
}

.more {
	margin-top: 4px;
	font-size: 13px;
	color: $pm-primary;
}

@keyframes pop-in {
	from { opacity: 0; transform: scale(0.6); }
	to { opacity: 1; transform: scale(1); }
}
</style>
