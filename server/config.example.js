'use strict'

// 复制为 config.js 并填入自己的密钥（config.js 已加入 .gitignore）
module.exports = {
	// 服务监听地址：只监听本机，由 Nginx 反向代理对外
	host: '127.0.0.1',
	port: 3210,
	// App 请求时带的口令（请求头 X-App-Token），挡住随手乱刷的请求
	appToken: '换成一串随机字符，与 App 的 services/ai/apiConfig.js 保持一致',
	// 每个 IP 每分钟最多请求次数
	rateLimitPerMinute: 20,
	// deepseek：直连 DeepSeek，知识库在服务器内按关键词检索；nuwax：女娲智能体，知识库在女娲后台
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
