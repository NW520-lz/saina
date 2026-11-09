// 把系统提示词和知识库打包进 server/（DeepSeek 模式使用）。
// 修改了 agent/系统提示词.md 或 knowledge-base/ 后运行：node tools/sync-server-assets.mjs，再把 server/ 重新部署到服务器。
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FUNCTION_DIR = join(ROOT, 'server')
const { splitEntries } = createRequire(import.meta.url)(join(FUNCTION_DIR, 'knowledge.js'))

// 系统提示词：取两条 === 之间的内容
const promptFile = readFileSync(join(ROOT, 'agent/系统提示词.md'), 'utf8')
const systemPrompt = promptFile.split(/^===\s*$/m)[1].trim()

// 知识库：00 号是格式说明，不参与检索
const kbDir = join(ROOT, 'knowledge-base')
const entries = readdirSync(kbDir)
	.filter(name => /^(0[1-9]|[1-9]\d)-.+\.md$/.test(name))
	.sort()
	.flatMap(name => splitEntries(readFileSync(join(kbDir, name), 'utf8')))

writeFileSync(
	join(FUNCTION_DIR, 'knowledge-data.js'),
	`'use strict'\n// 由 tools/sync-server-assets.mjs 自动生成，请勿手动修改\nmodule.exports = ${JSON.stringify({ systemPrompt, entries }, null, '\t')}\n`
)
console.log(`系统提示词 ${systemPrompt.length} 字，知识库 ${entries.length} 条 → server/knowledge-data.js`)
