<template>
	<view class="page">
		<view class="card float-in">
			<view class="card-title">💧 经量</view>
			<view>
				<view v-for="o in flowOptions" :key="o.value" class="chip" :class="{ active: form.flow === o.value }" @tap="setField('flow', o.value)">
					{{ o.emoji }} {{ o.label }}
				</view>
			</view>
		</view>

		<view class="card float-in">
			<view class="card-title">
				<text>🤕 疼痛程度</text>
				<text class="pain-face">{{ painFace }} {{ form.pain }}/10</text>
			</view>
			<slider :value="form.pain" :min="0" :max="10" :step="1" activeColor="#FF6B9A" backgroundColor="#FFE4EC" block-color="#FF6B9A" @change="setField('pain', $event.detail.value)" />
		</view>

		<view class="card float-in">
			<view class="card-title">💭 今天的心情</view>
			<view class="mood-grid">
				<view v-for="o in moodOptions" :key="o.value" class="mood" :class="{ active: form.mood === o.value }" @tap="setField('mood', o.value)">
					<text class="mood-emoji">{{ o.emoji }}</text>
					<text class="mood-label">{{ o.label }}</text>
				</view>
			</view>
		</view>

		<view class="card float-in">
			<view class="card-title">🌡 身体症状 <text class="muted">可多选</text></view>
			<view>
				<view v-for="s in symptomOptions" :key="s" class="chip" :class="{ active: form.symptoms.includes(s) }" @tap="toggleSymptom(s)">{{ s }}</view>
			</view>
		</view>

		<view class="card float-in">
			<view class="card-title">
				<text>😴 睡眠时长</text>
				<text class="muted">{{ form.sleep }} 小时</text>
			</view>
			<slider :value="form.sleep" :min="0" :max="12" :step="0.5" activeColor="#B794F6" backgroundColor="#EFE6FF" block-color="#B794F6" @change="setField('sleep', $event.detail.value)" />
		</view>

		<view class="card float-in">
			<view class="card-title">📒 悄悄话</view>
			<textarea v-model="form.note" class="note" placeholder="想对自己说点什么…" maxlength="200" />
		</view>

		<view class="btn-cute save" hover-class="btn-hover" @tap="save">💗 保存今天的记录</view>
	</view>
</template>

<script>
import { getLog, saveLog } from '@/services/storage.js'
import { FLOW_OPTIONS, MOOD_OPTIONS, SYMPTOM_OPTIONS, painFace } from '@/domain/phases.js'
import { today, formatMonthDay } from '@/domain/date.js'
import { playSound } from '@/services/sound.js'


export default {
	data() {
		return {
			date: today(),
			form: { flow: 0, pain: 0, mood: '', symptoms: [], sleep: 8, note: '' },
			flowOptions: FLOW_OPTIONS,
			moodOptions: MOOD_OPTIONS,
			symptomOptions: SYMPTOM_OPTIONS
		}
	},
	computed: {
		painFace() {
			return painFace(this.form.pain)
		}
	},
	onLoad(query) {
		if (query.date) this.date = query.date
		const saved = getLog(this.date)
		if (saved) this.form = { ...this.form, ...saved }
		uni.setNavigationBarTitle({ title: `记录 · ${formatMonthDay(this.date)}` })
	},
	methods: {
		setField(key, value) {
			playSound('tap')
			this.form[key] = value
		},
		toggleSymptom(symptom) {
			playSound('tap')
			const list = this.form.symptoms
			this.form.symptoms = list.includes(symptom) ? list.filter(s => s !== symptom) : [...list, symptom]
		},
		save() {
			saveLog(this.date, this.form)
			playSound('success')
			uni.showToast({ title: '打卡成功！你最棒啦 ✨', icon: 'none' })
			setTimeout(() => uni.navigateBack(), 900)
		}
	}
}
</script>

<style lang="scss" scoped>
.pain-face {
	font-size: 15px;
	color: $pm-primary;
}

.mood-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.mood {
	width: 30%;
	margin-bottom: 10px;
	padding: 10px 0;
	border-radius: 18px;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: #fff5f8;
	border: 2px solid transparent;
	transition: all 0.15s;
}

.mood.active {
	border-color: $pm-primary;
	background: $pm-primary-soft;
	transform: scale(1.06);
}

.mood-emoji {
	font-size: 30px;
}

.mood-label {
	font-size: 13px;
	margin-top: 2px;
}

.note {
	width: 100%;
	height: 80px;
	padding: 10px;
	box-sizing: border-box;
	font-size: 14px;
	border-radius: 16px;
	background: #fff5f8;
}

.save {
	margin: 8px 0 30px;
}
</style>
