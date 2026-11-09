// 生成 Q 版「李泽」：分层部件（用于骨骼动画）+ 三张合成头像。运行：node tools/gen-mascot.mjs [输出目录]
// 依据《李泽 Q 版角色设定图》：蓬松乱短发、浓眉、偏黑有神的大眼、藏青长款大衣 + 白衬衫 + 西装裤 + 黑皮鞋。
// 所有部件共用 200×240 画布，叠在一起就是完整人物；组件按关节点旋转各层来做动作。
// 关节点（画布坐标）：脖子 (100,158)、左肩 (70,168)、右肩 (130,168)、左髋 (86,210)、右髋 (114,210)。改造型时关节点不要动。
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const OUT_DIR = process.argv[2]
	? resolve(process.argv[2])
	: join(dirname(fileURLToPath(import.meta.url)), '../李泽经期小管家/static/mascot')

// 设定图配色：外套 #1E2545、衬衫 #F8F8F8、头发/鞋 #2B2B2B、肤色 #FFE0D4
const COLORS = {
	coat: '#1E2545',
	coatLight: '#283058',
	coatDark: '#141932',
	shirt: '#F8F8F8',
	hair: '#2B2B2B',
	hairShine: '#4A4A50',
	skin: '#FFE0D4',
	skinShade: '#F5C2AE',
	eye: '#3A2A24',
	pupil: '#1A1210',
	blush: '#FFAFAF',
	mouth: '#C9576A',
	button: '#5C6080'
}

const r1 = (n) => Math.round(n * 10) / 10

// 沿椭圆弧画一圈「蓬松」的小鼓包：每段用二次曲线，控制点向外凸 bump
function fluffyArc(cx, cy, rx, ry, fromDeg, toDeg, count, bump) {
	const point = (deg, extra) => {
		const a = (deg * Math.PI) / 180
		return `${r1(cx + (rx + extra) * Math.cos(a))} ${r1(cy + (ry + extra) * Math.sin(a))}`
	}
	const step = (toDeg - fromDeg) / count
	let d = ''
	for (let i = 0; i < count; i++) {
		const mid = fromDeg + step * (i + 0.5)
		d += ` Q${point(mid, bump)} ${point(fromDeg + step * (i + 1), 0)}`
	}
	return { start: point(fromDeg, 0), d }
}

// 后脑勺的蓬松头发轮廓
const backArc = fluffyArc(100, 86, 68, 60, 0, 360, 18, 9)

// 前额头发：顶部蓬松弧线 + 参差的刘海（尖端朝下）
const frontArc = fluffyArc(100, 86, 64, 56, 168, 372, 13, 8)
const BANGS = 'L159 108 Q155 92 148 80 Q147 92 142 101 Q139 86 132 75 Q129 88 123 95 Q119 82 112 73 Q111 86 105 93 Q101 80 94 71 Q91 84 85 97 Q81 85 74 77 Q71 90 65 99 Q61 88 56 81 Q51 94 43 106 Z'

const leg = (x, shoeX) => `
  <rect x="${x}" y="196" width="14" height="33" rx="5" fill="${COLORS.coatDark}"/>
  <ellipse cx="${shoeX}" cy="232" rx="12.5" ry="6" fill="${COLORS.hair}"/>
  <ellipse cx="${shoeX - 4}" cy="230" rx="4" ry="1.6" fill="#fff" opacity=".35"/>`

// 大衣袖子自然下垂、略向外张，袖口露出白衬衫和手
const arm = (shoulderX, angle) => `
  <g transform="rotate(${angle} ${shoulderX} 168)">
    <rect x="${shoulderX - 8}" y="162" width="16" height="32" rx="8" fill="${COLORS.coatLight}" stroke="${COLORS.coatDark}" stroke-width="1.5"/>
    <rect x="${shoulderX - 6.5}" y="191" width="13" height="4" rx="2" fill="${COLORS.shirt}"/>
    <circle cx="${shoulderX}" cy="200" r="7" fill="${COLORS.skin}"/>
  </g>`

const eyeOpen = (cx) => `
  <ellipse cx="${cx}" cy="119" rx="11.5" ry="13.5" fill="${COLORS.eye}"/>
  <ellipse cx="${cx}" cy="121" rx="7" ry="8.5" fill="${COLORS.pupil}"/>
  <circle cx="${cx + 4}" cy="113" r="3.8" fill="#fff"/><circle cx="${cx - 4}" cy="125" r="1.8" fill="#fff"/>
  <path d="M${cx - 13} ${114} Q${cx} ${102} ${cx + 13} ${112}" stroke="${COLORS.hair}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`

const PARTS = {
	'hair-back': `<path d="M${backArc.start}${backArc.d} Z" fill="${COLORS.hair}"/>`,
	'leg-l': leg(80, 86),
	'leg-r': leg(106, 114),
	body: `
  <path d="M72 156 L128 156 Q138 160 140 172 L146 214 Q100 221 54 214 L60 172 Q62 160 72 156 Z" fill="${COLORS.coat}"/>
  <path d="M86 156 L114 156 L100 184 Z" fill="${COLORS.shirt}"/>
  <path d="M86 156 L95 156 L100 166 L93 170 Z M114 156 L105 156 L100 166 L107 170 Z" fill="#E6E6EC"/>
  <path d="M84 156 L100 186 L92 190 L78 160 Z M116 156 L100 186 L108 190 L122 160 Z" fill="${COLORS.coatDark}"/>
  <path d="M100 186 L100 217" stroke="${COLORS.coatDark}" stroke-width="1.6"/>
  <circle cx="106" cy="194" r="2.6" fill="${COLORS.button}"/>
  <circle cx="106" cy="206" r="2.6" fill="${COLORS.button}"/>
  <path d="M66 200 L79 200 M121 200 L134 200" stroke="${COLORS.coatDark}" stroke-width="1.8" stroke-linecap="round"/>`,
	'arm-l': arm(70, 14),
	'arm-r': arm(130, -14),
	head: `
  <ellipse cx="40" cy="117" rx="9" ry="13" fill="${COLORS.skin}"/>
  <ellipse cx="41" cy="118" rx="4.5" ry="7" fill="${COLORS.skinShade}"/>
  <ellipse cx="160" cy="117" rx="9" ry="13" fill="${COLORS.skin}"/>
  <ellipse cx="159" cy="118" rx="4.5" ry="7" fill="${COLORS.skinShade}"/>
  <path d="M42 100 Q42 150 100 157 Q158 150 158 100 Q158 52 100 50 Q42 52 42 100 Z" fill="${COLORS.skin}"/>
  <path d="M62 101 Q75 95 89 99" stroke="${COLORS.hair}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
  <path d="M111 99 Q125 95 138 101" stroke="${COLORS.hair}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="64" cy="136" rx="10" ry="5.5" fill="${COLORS.blush}" opacity=".55"/>
  <ellipse cx="136" cy="136" rx="10" ry="5.5" fill="${COLORS.blush}" opacity=".55"/>
  <path d="M${frontArc.start}${frontArc.d} ${BANGS}" fill="${COLORS.hair}"/>
  <path d="M70 52 Q86 40 102 44 M112 40 Q128 42 140 54 M60 66 Q66 56 76 54" stroke="${COLORS.hairShine}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M94 32 Q95 21 104 18 M106 31 Q112 23 121 25" stroke="${COLORS.hair}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
	'eyes-open': eyeOpen(76) + eyeOpen(124),
	'eyes-closed': `
  <path d="M65 119 Q76 126 87 119" stroke="${COLORS.hair}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M113 119 Q124 126 135 119" stroke="${COLORS.hair}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
	'eyes-happy': `
  <path d="M65 122 Q76 108 87 122" stroke="${COLORS.hair}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M113 122 Q124 108 135 122" stroke="${COLORS.hair}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
	'mouth-smile': `<path d="M95 140 Q100 144 105 140" stroke="${COLORS.mouth}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
	'mouth-open': `<path d="M91 137 Q100 152 109 137 Z" fill="${COLORS.mouth}"/><path d="M95 144 Q100 148 105 144" fill="#FF9EB5"/>`
}

const svg = (...names) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">${names.map((n) => PARTS[n]).join('')}</svg>\n`

const BODY = ['hair-back', 'leg-l', 'leg-r', 'body', 'arm-l', 'arm-r', 'head']

const files = {
	// 合成头像：聊天头像、弹窗等静态场景使用
	'normal.svg': svg(...BODY, 'eyes-open', 'mouth-smile'),
	'blink.svg': svg(...BODY, 'eyes-closed', 'mouth-smile'),
	'happy.svg': svg(...BODY, 'eyes-happy', 'mouth-open')
}
for (const name of Object.keys(PARTS)) files[`parts/${name}.svg`] = svg(name)

mkdirSync(join(OUT_DIR, 'parts'), { recursive: true })
for (const [name, content] of Object.entries(files)) {
	writeFileSync(join(OUT_DIR, name), content)
	console.log('生成', name)
}
