'use strict'

// 发 POST 请求（Node 18+ 自带 fetch），超时自动中断
async function postJson(url, headers, body, timeoutMs) {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...headers },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(timeoutMs)
	})
	return { status: res.status, text: await res.text() }
}

module.exports = { postJson }
