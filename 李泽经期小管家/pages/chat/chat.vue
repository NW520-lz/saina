<template>
	<view class="chat-page">
		<scroll-view class="messages" scroll-y :scroll-into-view="scrollTarget" scroll-with-animation>
			<view class="welcome">
				<image class="welcome-img" src="/static/mascot/happy.svg" mode="aspectFit" />
				<text class="welcome-text">我是小泽，李泽派来陪你的小分身～经期、情绪、饮食、中医调养，什么都可以问我哦 💗</text>
			</view>

			<view v-for="(msg, i) in messages" :id="'m' + i" :key="i" class="row" :class="msg.role">
				<image v-if="msg.role === 'assistant'" class="avatar" src="/static/mascot/normal.svg" mode="aspectFit" />
				<view class="bubble">
					<text class="bubble-text" user-select>{{ msg.text }}</text>
				</view>
			</view>

			<view v-if="thinking" id="thinking" class="row assistant">
				<image class="avatar" src="/static/mascot/blink.svg" mode="aspectFit" />
				<view class="bubble typing">
					<view class="typing-dot" />
					<view class="typing-dot" />
					<view class="typing-dot" />
				</view>
			</view>
			<view id="bottom" class="bottom-space" />
		</scroll-view>

		<view class="composer">
			<scroll-view class="quick" scroll-x :show-scrollbar="false">
				<view v-for="q in quickQuestions" :key="q" class="chip" @tap="send(q)">{{ q }}</view>
			</scroll-view>
			<view class="input-row">
				<input v-model="draft" class="input" placeholder="和小泽说说话…" confirm-type="send" :adjust-position="true" @confirm="send(draft)" />
				<view class="send" :class="{ disabled: !draft.trim() || thinking }" hover-class="send-hover" @tap="send(draft)">发送</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getSettings, getPeriods, getChatHistory, saveChatHistory } from '@/services/storage.js'
import { getDayInfo } from '@/domain/cycle.js'
import { phaseMeta } from '@/domain/phases.js'
import { today } from '@/domain/date.js'
import { chat } from '@/services/ai/assistant.js'
import { playSound } from '@/services/sound.js'

export default {
	data() {
		return {
			messages: getChatHistory(),
			draft: '',
			thinking: false,
			scrollTarget: '',
			quickQuestions: [] // 跟着当前阶段变，见 domain/phases.js 的 questions
		}
	},
	onShow() {
		const settings = getSettings()
		this.quickQuestions = phaseMeta(getDayInfo(today(), getPeriods(), settings).phase).questions
		this.scrollToBottom()
	},
	methods: {
		async send(text) {
			text = (text || '').trim()
			if (!text || this.thinking) return
			playSound('send')
			this.draft = ''
			this.messages.push({ role: 'user', text })
			this.thinking = true
			this.scrollToBottom()

			const settings = getSettings()
			const info = getDayInfo(today(), getPeriods(), settings)
			const reply = await chat(settings, info, text)

			this.thinking = false
			this.messages.push({ role: 'assistant', text: reply.text })
			saveChatHistory(this.messages)
			playSound('popup')
			this.scrollToBottom()
		},
		scrollToBottom() {
			this.scrollTarget = ''
			this.$nextTick(() => (this.scrollTarget = 'bottom'))
		}
	}
}
</script>

<style lang="scss" scoped>
.chat-page {
	height: calc(100vh - var(--window-top, 0px) - var(--window-bottom, 0px));
	display: flex;
	flex-direction: column;
}

.messages {
	flex: 1;
	height: 0;
	padding: 12px 14px 0;
	box-sizing: border-box;
}

.welcome {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 10px 30px 20px;
}

.welcome-img {
	width: 90px;
	height: 108px;
	animation: bounce 1.6s ease-in-out infinite;
}

.welcome-text {
	margin-top: 8px;
	font-size: 13px;
	line-height: 1.6;
	text-align: center;
	color: $pm-text-light;
}

.row {
	display: flex;
	align-items: flex-end;
	margin-bottom: 14px;
	animation: float-in 0.3s ease-out;
}

.row.user {
	justify-content: flex-end;
}

.avatar {
	width: 40px;
	height: 48px;
	margin-right: 8px;
	flex-shrink: 0;
}

.bubble {
	max-width: 72%;
	padding: 10px 14px;
	border-radius: 20px;
	background: #fff;
	box-shadow: 0 4px 12px rgba(240, 98, 146, 0.1);
}

.assistant .bubble {
	border-bottom-left-radius: 6px;
}

.user .bubble {
	border-bottom-right-radius: 6px;
	background: linear-gradient(135deg, $pm-primary-light, $pm-primary);
}

.bubble-text {
	font-size: 15px;
	line-height: 1.6;
	white-space: pre-wrap;
	word-break: break-all;
}

.user .bubble-text {
	color: #fff;
}

.typing {
	display: flex;
	padding: 14px 16px;
}

.typing-dot {
	width: 8px;
	height: 8px;
	margin: 0 3px;
	border-radius: 50%;
	background: $pm-primary-light;
	animation: typing 1s ease-in-out infinite;
}

.typing-dot:nth-child(2) { animation-delay: 0.15s; }
.typing-dot:nth-child(3) { animation-delay: 0.3s; }

.bottom-space {
	height: 10px;
}

.composer {
	padding: 8px 12px 12px;
	background: rgba(255, 255, 255, 0.92);
	border-top: 1px solid $pm-border;
}

.quick {
	white-space: nowrap;
	margin-bottom: 4px;
}

.quick ::-webkit-scrollbar {
	display: none;
}

.quick .chip {
	margin-bottom: 6px;
	padding: 6px 12px;
	font-size: 12px;
}

.input-row {
	display: flex;
	align-items: center;
}

.input {
	flex: 1;
	height: 42px;
	padding: 0 16px;
	border-radius: 21px;
	font-size: 15px;
	background: #fff5f8;
	border: 2px solid $pm-border;
}

.send {
	margin-left: 10px;
	height: 42px;
	line-height: 42px;
	padding: 0 18px;
	border-radius: 21px;
	font-size: 15px;
	font-weight: 700;
	color: #fff;
	background: $pm-primary;
	box-shadow: 0 4px 0 #e04f80;
}

.send-hover {
	transform: translateY(3px);
	box-shadow: 0 1px 0 #e04f80;
}

.send.disabled {
	opacity: 0.5;
}

@keyframes typing {
	0%, 100% { transform: translateY(0); opacity: 0.5; }
	50% { transform: translateY(-6px); opacity: 1; }
}

@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-8px); }
}
</style>
