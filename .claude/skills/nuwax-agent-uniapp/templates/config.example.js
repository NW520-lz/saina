'use strict'

// 复制为 config.js 并填入自己的密钥（config.js 已加入 .gitignore）
module.exports = {
	// deepseek：直连 DeepSeek，知识库在云函数内按关键词检索；nuwax：女娲智能体，知识库在女娲后台
	provider: 'deepseek',
	deepseek: {
		baseUrl: 'https://api.deepseek.com',
		apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
		model: 'deepseek-chat'
	},
	nuwax: {
		baseUrl: 'https://agent.nuwax.com',
		apiKey: 'ak-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
		agentId: 0,
		devMode: true
	}
}
