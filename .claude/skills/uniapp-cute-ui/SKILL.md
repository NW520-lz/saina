---
name: uniapp-cute-ui
description: 为 uni-app（Vue3）项目做少女风可爱 UI：粉色主题变量、果冻按钮、会走动/偷看/眨眼/点击跳跃说话的 Q 版小人组件、脚本合成的可爱音效（无版权）、PIL 生成的 tabBar 图标、头像像素拼装的开屏动画，并用 HBuilderX CLI 加 Chrome DevTools 截图验证。当用户要求「可爱」「粉色」「女生喜欢」「Q 版人物会动」「按键音效」「启动动画 / 开屏动画」的 uni-app 界面时使用。
---

# uni-app 可爱风 UI 套件

## 资源

| 文件 | 作用 |
|---|---|
| `scripts/gen-sounds.mjs <输出目录>` | 合成 tap / send / success / ding / popup 五个 WAV 音效（正弦波 + 泛音 + 指数衰减） |
| `scripts/gen-splash.py <头像> <uni-app 项目目录>` | 把头像转成 30×30 像素数据 `pages/splash/avatar-pixels.js`，并生成纯色原生启动图 `static/splash/{hdpi,xhdpi,xxhdpi}.png`，需要 Pillow |
| `templates/splash/` | 像素拼装启动动画页 `splash.vue` 和纯函数 `assemble.js`（解码像素、随机起飞点和出发时间），放到 `pages/splash/` |
| `scripts/gen-mascot.mjs <输出目录>` | 生成 Q 版少女的**分层部件**（`parts/` 下 12 个 SVG，共用 200×240 画布）和 normal / blink / happy 三张合成头像 |
| `scripts/gen-icons.py <输出目录>` | 生成 81×81 的 tabBar PNG（爱心、日历、气泡、人像，灰色加粉色两态），需要 Pillow |
| `templates/mascot.vue` | 小人组件，放到 `components/mascot/mascot.vue`（easycom 自动注册） |
| `templates/sound.js` | 音效播放器，放到 `services/sound.js`；它依赖 `getSettings().soundEnabled`，按需修改 |

## 步骤

1. **主题**：在 `uni.scss` 定义 `$pm-primary:#ff6b9a`、`$pm-primary-soft:#ffe4ec`、`$pm-bg:#fff6f9`、`$pm-text:#5a3a48` 等变量，并设 `$uni-primary` 让 uni-ui 组件同色。
2. **全局样式**（App.vue）：页面使用粉色渐变背景；`.card` 用 24px 圆角加粉色阴影；`.btn-cute` 果冻按钮（底部 6px 实色阴影，按下时 translateY(4px)，配合 `hover-class="btn-hover"`）；`.chip` 胶囊选项；`.float-in` 入场动画。
3. **小人组件（分层骨骼动画，不需要帧动画文件）**：用法为 `<mascot ref="mascot" :lines="[...]" />`，在页面里调用 `this.$refs.mascot.say('文字')` 让它说话。
   - 原理：每个部件是一张与画布同尺寸的透明 SVG，叠放后组成人物；CSS 用 `transform-origin` 指向关节点（脖子 50% 66%、肩 35%/65% 70%、髋 43%/57% 87.5%），用 keyframes 旋转各层。翻转（`--flip`）放在最外层 `.flip`，keyframes 里不写翻转。
   - 动作：待机呼吸摇头；走路两腿交替、手臂反向摆、身体颠动，速度 60px/s；走到屏幕边转身探身招手（偷看）；随机挥手；说话时挥手并张嘴（`steps(1)` 切换张嘴层）；点击时举双手跳起；眨眼用 v-show 切换预加载的眼睛层，避免闪烁。
   - 气泡位置按屏幕宽度限制；被点击时用 0.3 秒快速回到屏幕内。`bottom: calc(var(--window-bottom) + 16px)` 用来避开 H5 的 tabBar。
   - **按用户形象定制**：让用户提供照片或 Q 版设定图，照着发型、眉眼、服装和色板修改脚本里的 `COLORS` 和 head / hair-back / body 造型，**不要动关节点**。参考实现：本项目 `tools/gen-mascot.mjs`（李泽版：`fluffyArc` 画蓬松头发，刘海用二次曲线画出长短不一的发尖）。
4. **音效**：在点击、发送、保存成功、弹窗这几个时机分别调用 `playSound('tap'|'send'|'success'|'popup')`；App 和小程序端同时调用 `uni.vibrateShort` 轻震动。
5. **tabBar**：只支持 png/jpg，用 `gen-icons.py` 生成后在 pages.json 中配置 `selectedColor:#FF6B9A`。

## 像素拼装启动动画（静态启动图 + 动画页）

1. **原生启动图用纯色**，颜色和动画页背景完全一致（本项目 `#FFE9F1`），manifest 设 `splashscreen.waiting:false`（去掉加载雪花），`distribute.splashscreens` 用 `androidStyle:"default"` 并配置三张图。不要用「拼好的头像」做启动图，否则动画开始时头像会先「炸开」再拼回去。启动图只在云打包后生效；iOS 必须用 storyboard，默认沿用通用启动界面。
2. **动画页放在 pages.json 第一个**（`navigationStyle:custom`，`app-plus.background` 设为同色），这样它只在冷启动时出现，从后台切回来不会重播。结束后：需要引导就 `uni.reLaunch` 到引导页，否则 `uni.switchTab` 到首页。「是否需要引导」写成一个函数（`storage.needsOnboarding()`），首页和动画页共用。
3. **像素数据离线生成**：裁剪时以脸为中心（`CROP`），先减到 40 色，再在每个格子里「占比 ≥30% 的颜色中取最深的」。直接取平均色会把眼睛糊掉。去掉圆角格子后大约 880 个方块，用 `palette + rows` 字符串存储，大约 3KB。
4. **动画只用 CSS，不用 canvas 也不逐帧跑 JS**：每个方块的起飞姿态（`translate(vw,vh) rotate scale(.3)` 和 `opacity:0`）写在行内 style 里，`@keyframes` 只写 `to`（没有 `from`，起点就是行内样式），`animation-delay` 随机，并保证 `delay + 飞行时长 ≤ 拼好的时刻`（这一条有单元测试）。不要在 keyframes 里用 `var()`：Chrome trace 实测样式计算会多一倍左右。
5. **时间线由 JS 定时器切换阶段 class**（`playing → assembled → leaving`，用累加的 class，避免切换阶段时把前一阶段的动画去掉）：onReady 开始播（首屏已经渲染完，原生启动图正好关闭），1.2s 弹一下并 `playSound('ding')`，标题淡入，1.7s 淡出，2s 跳转。点一下屏幕跳过；用 `left` 标记防止重复跳转；onUnload 清掉定时器。
6. **冷启动的应用内提示要让路**：`App.onShow` 原本会弹出 toast 盖住动画。在 `onLaunch(options)` 里判断 `options.path` 是否为动画页，如果是，就跳过这一次提醒，改由动画页离开时调用。
7. **验证**：用 playwright 的 `recordVideo` 录屏，再用 `ffmpeg -vf fps=10,tile=10x4` 拼成一张图检查每一帧（截图太慢，跟不上 2 秒的动画）；用 MutationObserver 记录 class 切换的时间点。

## 「好用又贴心」的常用模式（参考实现见本项目）

- **首次引导**：独立页面 `pages/welcome`（`navigationStyle: custom`）。首页 `onShow` 判断「`settings.onboarded` 为假且没有任何数据」时调用 `uni.reLaunch` 跳过去，完成后用 `uni.switchTab` 回来。每次只问一个问题，并提供「记不清了 / 先随便看看」的退路。由答案生成初始数据的逻辑写成纯函数，方便测试（`domain/cycle.js` 的 `initialPeriod`）。
- **3 秒打卡**：首页的状态图标点一下，弹出底部弹层（`components/quick-log`），点选项就保存，用 `patchLog` 只合并这一个字段。数据会出现「只记了一部分」的情况，所以展示和发给 AI 的描述都要按字段分别判断是否已记录（`hasValue`）。H5 的 tabBar（z-index 998）会盖住 uni-popup（99），底部弹层要加上 `padding-bottom: calc(var(--window-bottom) + 22px)`，并设置 `:safe-area="false"`。
- **惊喜内容（例如伴侣写的小纸条）**：内容单独放在 `content/*.js` 里，方便非开发者修改；触发规则写成纯函数（`domain/notes.js`：优先级排序、每个时机每天一张、挑最久没看过的），并写一个测试校验内容文件的 `when` 拼写。弹窗分两步，先信封后信纸，更有仪式感；收到的内容存进历史，在「我的」页里可以重温。和问候弹窗之间要排队：问候关闭后再检查纸条。
- **本地定时提醒**：使用 `uni.createPushMessage({ delay })`。需要勾选 uni-push 2.0 模块并云打包；没有取消接口，所以只预约近 10 天的，用 `date+hour+text` 作为 key 去重；还要提供一个「10 秒后测试提醒」按钮，方便在真机上验证杀掉后台后能否送达。
- **备份**：`uni.setClipboardData` 复制 JSON（带 `app` 标识和 `version`），引导用户发到微信文件传输助手保存；恢复时用 `uni.getClipboardData` 读取，经 `parseBackup` 校验后弹窗确认再覆盖。
- **统计**：用纯 CSS 条形图（`width:%` + `scaleX` 生长动画）就够了，不需要引入图表库；超出正常范围用橙色标记，提示语要温和，不制造焦虑。

## 验证（不需要登录 DCloud）

1. 在任务管理器中找到 HBuilderX 安装目录下的 `cli.exe`（PowerShell：`(Get-Process HBuilderX).Path`）。
2. 后台运行 `cli.exe launch web --project <项目绝对路径> --browser Chrome`，开发服务器地址为 http://localhost:5173/。（`publish web` 需要登录，`--compile true` 编译完会立即停止服务器，这两种都不适合截图验证。）
3. 用 chrome-devtools 打开页面，emulate 为 `390x844x2,mobile,touch` 后截图；通过 `uni.setStorageSync` 注入测试数据。如果 chrome-devtools 的浏览器被其他会话占用，可以在临时目录执行 `npm i playwright-core`，用 node_repl 加上 `executablePath` 指向系统 Chrome，启动无头浏览器；新建的 context 存储是空的，正好用来测试首次打开的流程。
4. H5 中 tab 页会同时挂载，用 `querySelector('.mascot')` 可能拿到隐藏页面的元素；应筛选所在 `uni-page` 可见的那一个。
