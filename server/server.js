'use strict'

// 小泽 AI 后端：POST /api/ai（App 调用）、GET /api/health（健康检查）。只用 Node 内置模块，需要 Node 18+。
// 启动：node server.js（线上用 PM2 守护，Nginx 反向代理到 config.port）
const http = require('node:http')
const config = require('./config.js')
const { handleAi } = require('./ai.js')

const MAX_BODY_BYTES = 64 * 1024
const WINDOW_MS = 60 * 1000

// 简单的按 IP 限流：每个 IP 在 1 分钟窗口内的请求次数
const hits = new Map()
function allowRequest(ip, now = Date.now()) {
	const record = hits.get(ip)
	if (!record || now - record.start > WINDOW_MS) {
		hits.set(ip, { start: now, count: 1 })
		return true
	}
	record.count++
	return record.count <= config.rateLimitPerMinute
}
setInterval(() => {
	const now = Date.now()
	for (const [ip, record] of hits) if (now - record.start > WINDOW_MS) hits.delete(ip)
}, WINDOW_MS).unref()

// 经过 Nginx 时真实 IP 在 X-Real-IP 里；只信任来自本机代理的这个头
function clientIp(req) {
	const remote = req.socket.remoteAddress || ''
	const fromProxy = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1'
	return (fromProxy && req.headers['x-real-ip']) || remote
}

function send(res, status, body) {
	res.writeHead(status, {
		'Content-Type': 'application/json; charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type, X-App-Token',
		'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
	})
	res.end(body === undefined ? '' : JSON.stringify(body))
}

function readJson(req) {
	return new Promise((resolve, reject) => {
		let size = 0
		const chunks = []
		req.on('data', chunk => {
			size += chunk.length
			if (size > MAX_BODY_BYTES) {
				reject(new Error('请求内容太大'))
				req.destroy()
			} else chunks.push(chunk)
		})
		req.on('end', () => {
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
			} catch (e) {
				reject(new Error('请求格式不正确'))
			}
		})
		req.on('error', reject)
	})
}

async function route(req, res) {
	const path = req.url.split('?')[0]
	if (req.method === 'OPTIONS') return send(res, 204)
	if (req.method === 'GET' && path === '/api/health') return send(res, 200, { ok: true })
	if (req.method !== 'POST' || path !== '/api/ai') return send(res, 404, { ok: false, error: '接口不存在' })

	if (req.headers['x-app-token'] !== config.appToken) return send(res, 401, { ok: false, error: '口令不正确' })
	const ip = clientIp(req)
	if (!allowRequest(ip)) return send(res, 429, { ok: false, error: '请求太频繁，休息一下再来吧' })

	let event
	try {
		event = await readJson(req)
	} catch (e) {
		return send(res, 400, { ok: false, error: e.message })
	}
	const started = Date.now()
	const result = await handleAi(event)
	console.log(`[ai] ${ip} ok=${result.ok} ${Date.now() - started}ms`)
	send(res, 200, result)
}

const server = http.createServer((req, res) => {
	route(req, res).catch(e => {
		console.error('[server] error:', e)
		if (!res.headersSent) send(res, 500, { ok: false, error: '服务器开小差了' })
	})
})

server.listen(config.port, config.host, () => {
	console.log(`小泽 AI 后端已启动：http://${config.host}:${config.port}（provider=${config.provider}）`)
})
