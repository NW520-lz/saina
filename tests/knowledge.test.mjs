// 运行：node --test tests/*.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const DIR = '../server/'
const { splitEntries, searchKnowledge } = require(DIR + 'knowledge.js')
const { systemPrompt, entries } = require(DIR + 'knowledge-data.js')

const titles = results => results.map(e => e.title)

test('按「## [KB-」切分条目并解析标题和关键词', () => {
	const md = '# 标题\n\n## [KB-01-001] 痛经\n- 关键词：痛经、肚子疼\n- 核心要点：…\n\n## [KB-01-002] 失眠\n- 关键词：睡不着'
	const list = splitEntries(md)
	assert.equal(list.length, 2)
	assert.equal(list[0].title, '痛经')
	assert.deepEqual(list[0].keywords, ['痛经', '肚子疼'])
	assert.ok(list[1].text.startsWith('## [KB-01-002]'))
})

test('打包的数据包含系统提示词和全部知识库条目', () => {
	assert.ok(systemPrompt.includes('小泽'))
	assert.ok(!systemPrompt.includes('==='))
	assert.ok(entries.length >= 70)
	assert.ok(entries.every(e => e.title && e.keywords.length))
})

test('口语提问能命中相关条目', () => {
	assert.ok(titles(searchKnowledge(entries, '肚子好疼怎么办')).some(t => t.includes('痛经')))
	assert.ok(titles(searchKnowledge(entries, '手脚冰凉是不是宫寒')).some(t => /宫寒|体寒|怕冷/.test(t)))
})

test('无关内容和空查询不返回条目，最多返回 3 条', () => {
	assert.deepEqual(searchKnowledge(entries, ''), [])
	assert.deepEqual(searchKnowledge(entries, 'hello'), [])
	assert.ok(searchKnowledge(entries, '痛经 腰酸 失眠 长痘 头痛 焦虑').length <= 3)
})
