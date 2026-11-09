---
name: nuwax-agent-uniapp
description: 在 uni-app 中接入女娲智能体（Nuwax Agent OS，agent.nuwax.com）：用 uniCloud 云函数代理以隐藏 ak- API Key，解析 SSE 流式响应，用「指令协议」让智能体输出结构化 JSON，AI 不可用时降级为本地回复。当用户提供 nuwax 智能体链接或 ak- 开头的 Key，或要求「把女娲智能体接到 App/小程序」时使用。
---

# 女娲智能体接入 uni-app

## 接口要点（2026-11 实测可用）

- Base URL：`https://agent.nuwax.com`；请求头 `Authorization: Bearer ak-xxx`
- 智能体 ID：从链接 `agent.nuwax.com/space/<空间ID>/agent/<智能体ID>` 中取最后一段
- 创建会话：`POST /api/v1/chat/conversation/add`，body `{ agentId, devMode: true, variables }`，返回 `data` 为会话 ID（`code: "0000"` 表示成功）
- 对话：`POST /api/v1/chat/{conversationId}`，body `{ conversationId, message }`，返回 SSE，每行格式为 `data:{eventType, data, error, completed}`
  - `eventType`：MESSAGE / PROCESSING / FINAL_RESULT / HEART_BEAT / ERROR
  - 最终文本在 `FINAL_RESULT.data.outputText` 中；没有时拼接 `MESSAGE` 里 `type=CHAT` 的 `text`
- 常见错误：「智能体模型未配置或已下架」表示用户需要在后台给智能体选择模型
- 知识库**没有开放上传 API**，需要用户在后台手动上传文件（工作空间 → 组件资源 → 知识库）
- 文档：nuwax.com/conversation-chat.html、conversation-create.html、api-key.html

## 步骤

1. **先用 curl 验证 Key 和智能体**（Windows Git Bash 中，中文 body 必须写入文件再用 `--data-binary @file` 发送，否则会报 UTF-8 解析错误）：
   ```bash
   printf '%s' '{"agentId":ID,"devMode":true}' > c.json
   curl -s https://agent.nuwax.com/api/v1/chat/conversation/add -H 'Authorization: Bearer ak-..' -H 'Content-Type: application/json' --data-binary @c.json
   ```
2. **云函数**：把 `templates/` 下的 `index.js`、`sse.js`、`package.json` 复制到 `uniCloud-aliyun/cloudfunctions/nuwax-agent/`；`config.example.js` 复制为 `config.js` 后填入 Key，并把 `config.js` 加入 `.gitignore`。`package.json` 里把 `timeout` 设为 60（大模型响应慢）。
3. **客户端**：`agentClient.js` 调用云函数并在本地保存 conversationId；`assistant.js` 作为门面，失败时降级到本地回复，页面只依赖这个门面。
4. **指令协议**：在系统提示词中约定 `【问候】`、`【今日分析】`、`【聊天】` 等指令，结构化输出要求「只输出 JSON，不要代码块」；客户端用 `extractJson` 截取首个 `{` 到最后一个 `}` 之间的内容再解析，兼容模型多输出文字的情况。
5. **测试**：用 node:test 为 `sse.js` 写测试，覆盖正常输出、只有 CHAT 消息、真实错误响应（模型未配置）、非 SSE 的 JSON 错误。
6. **交付给用户的手动步骤**：在后台给智能体选模型、上传并绑定知识库、粘贴系统提示词；在 HBuilderX 中关联云服务空间并上传部署云函数。

## 注意

- 不要把 Key 写进前端代码（会被打包进安装包），也不要放进 manifest。
- `devMode: true` 时智能体不发布也能调用，正式上线前建议发布智能体并改为 false。
- 云函数未关联服务空间时，H5 控制台会报「应用未关联服务空间」，这时应该走降级逻辑，不能让 App 报错。

## 女娲太慢时：直连 DeepSeek，并在云函数里检索知识库

2026-11 实测：女娲智能体回复一句问候要 25–77 秒，超过云函数 60 秒上限；DeepSeek（`deepseek-chat`，OpenAI 兼容）只要 2–3 秒。模板已改为双服务商，在 `config.js` 的 `provider` 里切换：

- `deepseek.js`：`POST {baseUrl}/chat/completions`，返回 `choices[0].message.content`。
- `knowledge.js`：按「## [KB-」切分条目，用「关键词」字段整词匹配（每个 +3）加中文二字片段模糊匹配（每个 +1），总分至少 2 才算命中，取前 3 条附在 system 提示词后。无需向量库，口语提问也能命中。
- `sync-cloud-assets.mjs`：把系统提示词（两条 `===` 之间）和知识库条目打包成 `knowledge-data.js`。改了提示词或知识库后要重新运行，再上传部署。
- 客户端 `sendToAgent(message, { nickname, knowledgeQuery, history })`：
  - 聊天：`knowledgeQuery` 用用户原话，`history` 带最近 6 条聊天记录（DeepSeek 不保存会话）。
  - 今日分析：`knowledgeQuery` 用阶段名、症状和心情。
  - 问候：不检索知识库。
- 端到端自测：在 Node 里用 `fetch` 模拟 `uniCloud.httpclient.request`，直接 `require` 云函数的 `index.js` 跑真实提示词，可以在不部署的情况下验证整条链路。
