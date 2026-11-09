// 生成 Q 版形象「小桃」：分层部件（用于骨骼动画）+ 三张合成头像。运行：node tools/gen-mascot.mjs [输出目录]
// 所有部件共用 200×240 画布，叠在一起就是完整人物；组件按关节点旋转各层来做动作。
// 关节点（画布坐标）：脖子 (100,158)、左肩 (70,168)、右肩 (130,168)、左髋 (86,210)、右髋 (114,210)。
// 换成本人形象时：改 COLORS 和 head / hairBack 的造型即可，关节点不要动。
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const OUT_DIR = process.argv[2]
	? resolve(process.argv[2])
	: join(dirname(fileURLToPath(import.meta.url)), '../李泽经期小管家/static/mascot')

const COLORS = {
	hair: '#7A5444',
	hairBack: '#6B4A3A',
	skin: '#FFE6D8',
	dress: '#FF8FB1',
	dressDark: '#F06292',
	eye: '#4A2C3A',
	blush: '#FF9EB5',
	mouth: '#D45A7A'
}

const leg = (x, shoeX) => `
  <rect x="${x}" y="204" width="13" height="28" rx="6.5" fill="${COLORS.skin}"/>
  <ellipse cx="${shoeX}" cy="233" rx="11" ry="5.5" fill="${COLORS.dressDark}"/>`

// 手臂自然下垂、略向外张；袖子画成肩部的小圆泡泡袖
const arm = (shoulderX, angle) => `
  <g transform="rotate(${angle} ${shoulderX} 168)">
    <rect x="${shoulderX - 7}" y="166" width="14" height="34" rx="7" fill="${COLORS.skin}"/>
  </g>
  <circle cx="${shoulderX}" cy="168" r="10" fill="${COLORS.dress}"/>`

const PARTS = {
	'hair-back': `<path d="M32 104 Q28 28 100 24 Q172 28 168 104 L170 168 Q150 182 138 160 L62 160 Q50 182 30 168 Z" fill="${COLORS.hairBack}"/>`,
	'leg-l': leg(80, 86),
	'leg-r': leg(107, 114),
	body: `
  <path d="M70 158 L130 158 L152 218 Q100 232 48 218 Z" fill="${COLORS.dress}"/>
  <path d="M60 206 Q100 214 140 206 L148 218 Q100 230 52 218 Z" fill="${COLORS.dressDark}" opacity=".5"/>
  <path d="M82 158 L100 176 L118 158 Z" fill="#fff"/>
  <circle cx="100" cy="190" r="5" fill="#fff" opacity=".9"/>`,
	'arm-l': arm(70, 18),
	'arm-r': arm(130, -18),
	head: `
  <ellipse cx="100" cy="100" rx="62" ry="58" fill="${COLORS.skin}"/>
  <path d="M38 98 Q38 40 100 36 Q162 40 162 98 Q152 72 130 64 Q120 84 100 82 Q82 72 74 62 Q50 72 38 98 Z" fill="${COLORS.hair}"/>
  <path d="M40 92 Q30 132 46 154 Q46 122 52 102 Z" fill="${COLORS.hair}"/>
  <path d="M160 92 Q170 132 154 154 Q154 122 148 102 Z" fill="${COLORS.hair}"/>
  <ellipse cx="62" cy="130" rx="11" ry="6" fill="${COLORS.blush}" opacity=".65"/>
  <ellipse cx="138" cy="130" rx="11" ry="6" fill="${COLORS.blush}" opacity=".65"/>
  <g transform="translate(142 54) rotate(15)">
    <circle r="12" fill="#FFB5A7"/>
    <path d="M0 -11 Q-3 0 0 11" stroke="#FF8C7A" stroke-width="2" fill="none"/>
    <ellipse cx="7" cy="-13" rx="7" ry="3.5" fill="#7DD3B0" transform="rotate(-30 7 -13)"/>
  </g>`,
	'eyes-open': `
  <ellipse cx="76" cy="110" rx="11" ry="14" fill="${COLORS.eye}"/>
  <ellipse cx="124" cy="110" rx="11" ry="14" fill="${COLORS.eye}"/>
  <circle cx="80" cy="104" r="4.5" fill="#fff"/><circle cx="72" cy="116" r="2" fill="#fff"/>
  <circle cx="128" cy="104" r="4.5" fill="#fff"/><circle cx="120" cy="116" r="2" fill="#fff"/>`,
	'eyes-closed': `
  <path d="M65 112 Q76 119 87 112" stroke="${COLORS.eye}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M113 112 Q124 119 135 112" stroke="${COLORS.eye}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
	'eyes-happy': `
  <path d="M65 115 Q76 101 87 115" stroke="${COLORS.eye}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M113 115 Q124 101 135 115" stroke="${COLORS.eye}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
	'mouth-smile': `<path d="M93 132 Q100 138 107 132" stroke="${COLORS.mouth}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
	'mouth-open': `<path d="M91 129 Q100 144 109 129 Z" fill="${COLORS.mouth}"/><path d="M95 136 Q100 140 105 136" fill="#FF9EB5"/>`
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
