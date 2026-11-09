<script>
import { remindInApp, scheduleReminders } from '@/services/notify.js'

const SPLASH_PATH = 'pages/splash/splash'
let remindAfterSplash = false

export default {
	onLaunch(options) {
		// 冷启动先播启动动画：应用内提醒交给动画页播完再弹，免得盖住动画
		remindAfterSplash = String(options && options.path).endsWith(SPLASH_PATH)
	},
	onShow() {
		if (remindAfterSplash) remindAfterSplash = false
		else remindInApp()
		scheduleReminders()
	}
}
</script>

<style lang="scss">
@import '@/uni_modules/uni-scss/index.scss';

page {
	background: linear-gradient(180deg, #ffe9f1 0%, $pm-bg 320px);
	color: $pm-text;
	font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
	min-height: 100%;
}

.page {
	padding: 16px 16px 140px;
}

.card {
	background: #fff;
	border-radius: $pm-radius;
	box-shadow: $pm-shadow;
	padding: 18px;
	margin-bottom: 16px;
}

.card-title {
	font-size: 16px;
	font-weight: 700;
	color: $pm-text;
	margin-bottom: 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.muted {
	color: $pm-text-light;
	font-size: 13px;
}

/* 果冻感按钮 */
.btn-cute {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 46px;
	padding: 0 22px;
	border-radius: 23px;
	font-size: 15px;
	font-weight: 700;
	color: #fff;
	background: linear-gradient(135deg, $pm-primary-light, $pm-primary);
	box-shadow: 0 6px 0 #e04f80, 0 10px 18px rgba(255, 107, 154, 0.35);
	transition: transform 0.12s, box-shadow 0.12s;
}

.btn-cute:active,
.btn-cute.btn-hover {
	transform: translateY(4px) scale(0.97);
	box-shadow: 0 2px 0 #e04f80, 0 4px 8px rgba(255, 107, 154, 0.3);
}

.btn-cute.ghost {
	color: $pm-primary;
	background: $pm-primary-soft;
	box-shadow: 0 6px 0 #ffc2d4;
}

.btn-cute.ghost:active,
.btn-cute.ghost.btn-hover {
	box-shadow: 0 2px 0 #ffc2d4;
}

.chip {
	display: inline-flex;
	align-items: center;
	padding: 8px 14px;
	margin: 0 8px 10px 0;
	border-radius: 18px;
	font-size: 13px;
	color: $pm-text;
	background: #fff5f8;
	border: 2px solid $pm-border;
	transition: all 0.15s;
}

.chip.active {
	color: #fff;
	background: $pm-primary;
	border-color: $pm-primary;
	transform: scale(1.05);
}

@keyframes float-in {
	from { opacity: 0; transform: translateY(16px); }
	to { opacity: 1; transform: translateY(0); }
}

.float-in {
	animation: float-in 0.45s ease-out both;
}
</style>
