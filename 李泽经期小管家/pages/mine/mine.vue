<template>
	<view class="page">
		<view class="profile float-in">
			<image class="profile-img" src="/static/mascot/happy.svg" mode="aspectFit" />
			<text class="profile-name">{{ settings.nickname }}</text>
			<text class="muted">已陪伴你记录 {{ periodCount }} 次经期 · {{ logCount }} 天打卡</text>
		</view>

		<!-- 周期小报告 -->
		<view class="card float-in">
			<view class="card-title">📊 我的周期小报告</view>
			<view class="stat-grid">
				<view class="stat">
					<text class="stat-num">{{ stats.averageCycle }}</text>
					<text class="stat-label">平均周期（天）</text>
				</view>
				<view class="stat">
					<text class="stat-num">{{ stats.averagePeriod }}</text>
					<text class="stat-label">平均经期（天）</text>
				</view>
				<view class="stat">
					<text class="stat-num">{{ stats.averagePain === null ? '-' : stats.averagePain }}</text>
					<text class="stat-label">平均痛经（分）</text>
				</view>
			</view>

			<view v-if="stats.cycles.length">
				<text class="sub-title">最近 {{ stats.cycles.length }} 次周期</text>
				<view v-for="c in stats.cycles" :key="c.start" class="bar-row">
					<text class="bar-date">{{ md(c.start) }}</text>
					<view class="bar-track">
						<view class="bar" :class="{ warn: !c.normal }" :style="{ width: c.width + '%' }" />
					</view>
					<text class="bar-value" :class="{ warn: !c.normal }">{{ c.length }} 天</text>
				</view>
				<text class="hint">正常范围 24–38 天，橙色表示超出了这个范围</text>
			</view>
			<text v-else class="muted">再记录 1 次经期，小泽就能画出你的周期啦～</text>

			<view v-if="stats.irregular" class="notice">最近几次周期相差超过 9 天。偶尔一次没关系，如果一直这样，可以找医生聊聊哦 🌷</view>

			<view v-if="stats.topSymptoms.length" class="symptom-row">
				<text class="sub-title">最常出现</text>
				<view>
					<text v-for="s in stats.topSymptoms" :key="s.name" class="symptom">{{ s.name }} × {{ s.count }}</text>
				</view>
			</view>
			<text v-if="stats.averagePain !== null" class="hint">平均痛经 = 每次经期记录到的最高疼痛分的平均值</text>
		</view>

		<!-- 小纸条盒 -->
		<view class="card float-in">
			<view class="card-title">
				<text>💌 小纸条盒</text>
				<text class="muted">已收到 {{ notes.length }} 张</text>
			</view>
			<view v-if="notes.length">
				<view v-for="(n, i) in visibleNotes" :key="i" class="note">
					<text class="note-text">{{ n.text }}</text>
					<text class="note-date">{{ md(n.date) }} · 小泽</text>
				</view>
				<text v-if="notes.length > notesPreview" class="link" @tap="showAllNotes = !showAllNotes">
					{{ showAllNotes ? '收起' : '查看全部 ' + notes.length + ' 张' }}
				</text>
			</view>
			<text v-else class="muted">还没有收到纸条哦，小泽会在特别的日子悄悄递给你～</text>
		</view>

		<view class="card float-in">
			<view class="card-title">🎀 个人设置</view>
			<view class="row">
				<text>我的昵称</text>
				<input class="row-input" :value="settings.nickname" maxlength="10" placeholder="小泽怎么称呼你" @blur="onNickname" />
			</view>
			<view class="row">
				<view>
					<text>平均周期（天）</text>
					<text class="hint">有 2 次以上记录后自动计算</text>
				</view>
				<uni-number-box :value="settings.cycleLength" :min="20" :max="45" @change="update('cycleLength', $event)" />
			</view>
			<view class="row">
				<text>经期天数</text>
				<uni-number-box :value="settings.periodLength" :min="2" :max="10" @change="update('periodLength', $event)" />
			</view>
		</view>

		<view class="card float-in">
			<view class="card-title">🔔 偏好</view>
			<view class="row">
				<text>可爱音效</text>
				<switch :checked="settings.soundEnabled" color="#FF6B9A" @change="update('soundEnabled', $event.detail.value)" />
			</view>
			<view class="row">
				<view>
					<text>经期 / 排卵提醒</text>
					<text class="hint">经期前 3 天、前 1 天、排卵日会发通知提醒你</text>
				</view>
				<switch :checked="settings.notifyEnabled" color="#FF6B9A" @change="update('notifyEnabled', $event.detail.value)" />
			</view>
			<view v-if="settings.notifyEnabled" class="row">
				<text class="hint">担心收不到？发一条试试</text>
				<view class="btn-cute ghost mini" hover-class="btn-hover" @tap="onTestReminder">测试提醒</view>
			</view>
		</view>

		<!-- 备份与恢复 -->
		<view class="card float-in">
			<view class="card-title">💾 备份与恢复</view>
			<text class="about">记录只保存在这台手机上。换手机或重装前，点「复制备份」，发到微信「文件传输助手」存好；在新手机上复制那段文字，再点「从剪贴板恢复」。</text>
			<view class="btn-pair">
				<view class="btn-cute" hover-class="btn-hover" @tap="onBackup">复制备份</view>
				<view class="btn-cute ghost" hover-class="btn-hover" @tap="onRestore">从剪贴板恢复</view>
			</view>
		</view>

		<view class="card float-in">
			<view class="card-title">📖 关于</view>
			<text class="about">小管家的健康建议来自整理过的中西医知识库（ACOG、FIGO、NICE、中华中医药学会等）。排卵期和易孕期是根据记录推算的参考值，不能作为避孕依据；AI 回答不能替代医生诊断，身体不适请及时就医。</text>
			<view class="btn-cute ghost danger" hover-class="btn-hover" @tap="onClear">清空所有数据</view>
		</view>

		<mascot :lines="['设置好了小泽就更懂你啦～', '要记得常常回来看我哦 🥺']" />
	</view>
</template>

<script>
import { getSettings, saveSettings, getPeriods, getLogs, restoreData, clearAll } from '@/services/storage.js'
import { createBackupText, parseBackup } from '@/services/backup.js'
import { receivedNotes } from '@/services/loveNotes.js'
import { scheduleReminders, sendTestReminder } from '@/services/notify.js'
import { cycleStats } from '@/domain/stats.js'
import { formatMonthDay } from '@/domain/date.js'
import { playSound } from '@/services/sound.js'

const NOTES_PREVIEW = 3
const PINK = '#FF6B9A'

export default {
	data() {
		return {
			settings: getSettings(),
			periodCount: 0,
			logCount: 0,
			stats: { cycles: [], topSymptoms: [], averagePain: null },
			notes: [],
			notesPreview: NOTES_PREVIEW,
			showAllNotes: false
		}
	},
	computed: {
		visibleNotes() {
			return this.showAllNotes ? this.notes : this.notes.slice(0, NOTES_PREVIEW)
		}
	},
	onShow() {
		this.refresh()
	},
	methods: {
		refresh() {
			const periods = getPeriods()
			const logs = getLogs()
			this.settings = getSettings()
			this.periodCount = periods.length
			this.logCount = Object.keys(logs).length
			this.stats = cycleStats(periods, logs, this.settings)
			this.notes = receivedNotes()
		},
		md(date) {
			return formatMonthDay(date)
		},
		update(key, value) {
			this.settings = saveSettings({ [key]: value })
			playSound('tap')
			scheduleReminders() // 周期设置或提醒开关变了，重新预约
		},
		onNickname(e) {
			const name = e.detail.value.trim()
			if (name && name !== this.settings.nickname) {
				this.update('nickname', name)
				uni.showToast({ title: `你好呀，${name} 💗`, icon: 'none' })
			}
		},
		onTestReminder() {
			playSound('tap')
			sendTestReminder()
		},
		onBackup() {
			playSound('tap')
			uni.setClipboardData({
				data: createBackupText(),
				success: () =>
					uni.showModal({
						title: '备份已复制 💾',
						content: '去微信「文件传输助手」粘贴发送，就存好啦。',
						showCancel: false,
						confirmColor: PINK
					})
			})
		},
		onRestore() {
			playSound('tap')
			uni.getClipboardData({
				success: res => this.confirmRestore(res.data),
				fail: () => uni.showToast({ title: '读不到剪贴板，请允许小管家访问剪贴板', icon: 'none' })
			})
		},
		confirmRestore(text) {
			let backup
			try {
				backup = parseBackup(text)
			} catch (e) {
				uni.showToast({ title: e.message, icon: 'none' })
				return
			}
			uni.showModal({
				title: '从备份恢复',
				content: `备份于 ${backup.exportedAt || '未知日期'}，有 ${backup.periods.length} 次经期、${Object.keys(backup.logs).length} 天打卡。恢复后会覆盖现在的数据，确定吗？`,
				confirmColor: PINK,
				success: res => {
					if (!res.confirm) return
					restoreData(backup)
					this.refresh()
					scheduleReminders()
					playSound('success')
					uni.showToast({ title: '恢复好啦，欢迎回来 💗', icon: 'none' })
				}
			})
		},
		onClear() {
			uni.showModal({
				title: '清空所有数据',
				content: '经期记录、每日打卡、聊天记录和小纸条都会被删除，且无法恢复，建议先复制备份。确定吗？',
				confirmColor: PINK,
				success: res => {
					if (!res.confirm) return
					clearAll()
					this.refresh()
					uni.showToast({ title: '已清空', icon: 'none' })
				}
			})
		}
	}
}
</script>

<style lang="scss" scoped>
.profile {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 10px 0 20px;
}

.profile-img {
	width: 100px;
	height: 120px;
	animation: bounce 2s ease-in-out infinite;
}

.profile-name {
	font-size: 22px;
	font-weight: 800;
	margin: 6px 0 4px;
}

.row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 0;
	font-size: 15px;
	border-bottom: 1px dashed $pm-border;
}

.row:last-child {
	border-bottom: none;
}

.hint {
	display: block;
	font-size: 11px;
	color: $pm-text-light;
}

.row-input {
	text-align: right;
	font-size: 15px;
	color: $pm-primary;
}

.about {
	display: block;
	font-size: 13px;
	line-height: 1.7;
	color: $pm-text-light;
	margin-bottom: 16px;
}

.danger {
	color: #e04f80;
}

/* 周期小报告 */
.stat-grid {
	display: flex;
	margin-bottom: 14px;
}

.stat {
	flex: 1;
	padding: 10px 0;
	border-radius: 18px;
	background: #fff6f9;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.stat + .stat {
	margin-left: 8px;
}

.stat-num {
	font-size: 24px;
	font-weight: 800;
	color: $pm-primary;
}

.stat-label {
	font-size: 11px;
	color: $pm-text-light;
}

.sub-title {
	display: block;
	margin: 4px 0 8px;
	font-size: 13px;
	font-weight: 700;
}

.bar-row {
	display: flex;
	align-items: center;
	margin-bottom: 8px;
	font-size: 12px;
}

.bar-date {
	width: 54px;
	color: $pm-text-light;
}

.bar-track {
	flex: 1;
	height: 12px;
	border-radius: 6px;
	background: #fff0f5;
	overflow: hidden;
}

.bar {
	height: 100%;
	border-radius: 6px;
	background: linear-gradient(90deg, $pm-primary-light, $pm-primary);
	transform-origin: left center;
	animation: grow 0.6s ease-out both;
}

.bar.warn {
	background: linear-gradient(90deg, #ffc98a, #f59e0b);
}

.bar-value {
	width: 44px;
	text-align: right;
	font-weight: 700;
	color: $pm-primary;
}

.bar-value.warn {
	color: #e8590c;
}

.notice {
	margin-top: 10px;
	padding: 10px 12px;
	border-radius: 14px;
	font-size: 13px;
	line-height: 1.6;
	color: #c2410c;
	background: #fff4e5;
}

.symptom-row {
	margin: 12px 0 4px;
}

.symptom {
	display: inline-block;
	margin: 0 6px 6px 0;
	padding: 3px 10px;
	border-radius: 12px;
	font-size: 12px;
	color: $pm-primary;
	background: $pm-primary-soft;
}

/* 小纸条盒 */
.note {
	margin-bottom: 10px;
	padding: 12px 14px;
	border-radius: 16px;
	background: #fffdf6;
	border: 1px dashed #f6c7d6;
}

.note-text {
	display: block;
	font-size: 14px;
	line-height: 1.7;
	color: #6b3a4f;
	font-family: 'KaiTi', 'STKaiti', 'Kaiti SC', serif;
}

.note-date {
	display: block;
	margin-top: 4px;
	text-align: right;
	font-size: 11px;
	color: $pm-text-light;
}

.link {
	display: block;
	text-align: center;
	font-size: 13px;
	color: $pm-primary;
}

/* 按钮 */
.btn-pair {
	display: flex;
}

.btn-pair .btn-cute {
	flex: 1;
	padding: 0 10px;
}

.btn-pair .btn-cute + .btn-cute {
	margin-left: 12px;
}

.btn-cute.mini {
	height: 34px;
	padding: 0 14px;
	font-size: 13px;
}

@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-8px); }
}

@keyframes grow {
	from { transform: scaleX(0); }
	to { transform: scaleX(1); }
}
</style>
