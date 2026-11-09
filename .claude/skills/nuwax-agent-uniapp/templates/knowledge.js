'use strict'

// 知识库关键词检索：用条目的标题和「关键词」字段匹配用户的问题，挑出最相关的几条交给模型参考。
// 条目格式见 knowledge-base/00-格式说明与索引.md：每条以「## [KB-xx-xxx] 标题」开头，含「- 关键词：」一行。

function splitEntries(markdown) {
	return markdown
		.split(/\r?\n(?=## \[KB-)/)
		.filter(part => part.startsWith('## [KB-'))
		.map(part => {
			const title = (part.match(/^## \[KB-[\w-]+\] (.+)/) || [])[1] || ''
			const keywordLine = (part.match(/- 关键词：(.+)/) || [])[1] || ''
			const keywords = keywordLine.split(/[、，,]/).map(k => k.trim()).filter(Boolean)
			return { title: title.trim(), keywords, text: part.trim() }
		})
}

// 中文按相邻两个字切分，用来做模糊匹配（「肚子好疼」也能命中「肚子疼」）
function bigrams(text) {
	const clean = text.replace(/[\s\p{P}\p{S}]/gu, '')
	const set = new Set()
	for (let i = 0; i < clean.length - 1; i++) set.add(clean.slice(i, i + 2))
	return set
}

function scoreEntry(entry, query) {
	let score = 0
	for (const keyword of entry.keywords) if (query.includes(keyword)) score += 3
	const target = entry.title + entry.keywords.join('')
	for (const pair of bigrams(query)) if (target.includes(pair)) score += 1
	return score
}

const MIN_SCORE = 2

function searchKnowledge(entries, query, limit = 3) {
	if (!query) return []
	return entries
		.map(entry => ({ entry, score: scoreEntry(entry, query) }))
		.filter(item => item.score >= MIN_SCORE)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map(item => item.entry)
}

module.exports = { splitEntries, searchKnowledge }
