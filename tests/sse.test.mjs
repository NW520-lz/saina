import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { parseAgentStream } = require('../server/sse.js')

const line = obj => 'data:' + JSON.stringify(obj) + '\n\n'

test('优先使用 FINAL_RESULT.outputText', () => {
	const raw =
		line({ eventType: 'MESSAGE', data: { role: 'ASSISTANT', type: 'CHAT', text: '你' } }) +
		line({ eventType: 'HEART_BEAT' }) +
		line({ eventType: 'MESSAGE', data: { role: 'ASSISTANT', type: 'CHAT', text: '好' } }) +
		line({ eventType: 'FINAL_RESULT', data: { success: true, outputText: '你好呀' }, completed: true })
	assert.deepEqual(parseAgentStream(raw), { text: '你好呀', error: '' })
})

test('没有 FINAL_RESULT 时拼接 CHAT 消息，忽略思考消息', () => {
	const raw =
		line({ eventType: 'MESSAGE', data: { role: 'ASSISTANT', type: 'THINK', text: '思考中' } }) +
		line({ eventType: 'MESSAGE', data: { role: 'ASSISTANT', type: 'CHAT', text: '你' } }) +
		line({ eventType: 'MESSAGE', data: { role: 'ASSISTANT', type: 'CHAT', text: '好' } })
	assert.equal(parseAgentStream(raw).text, '你好')
})

test('真实错误响应：模型未配置', () => {
	// 2026-11-09 实测返回
	const raw =
		'data:{"eventType":"MESSAGE","error":null,"data":{"role":"ASSISTANT","type":"CHAT","text":"智能体模型未配置或已下架","finished":true,"finishReason":"ERROR"},"completed":false}\n\n' +
		'data:{"eventType":"FINAL_RESULT","error":"智能体模型未配置或已下架","data":{"success":false,"error":"智能体模型未配置或已下架","outputText":null},"completed":true}\n'
	assert.deepEqual(parseAgentStream(raw), { text: '', error: '智能体模型未配置或已下架' })
})

test('非 SSE 的 JSON 错误', () => {
	assert.equal(parseAgentStream('{"code":"4000","message":"bad"}').text, '')
})
