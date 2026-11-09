# 经期小管家

一个基于 uni-app 的经期记录与健康陪伴应用，包含周期推算、每日记录、提醒、备份、本地兜底回复和可选 AI 后端。

## 开始使用

1. 用 HBuilderX 打开 `李泽经期小管家/`。
2. 如需 AI 服务，复制 `server/config.example.js` 为 `server/config.js`，填入自己的服务商密钥和随机 `appToken`。
3. 复制 `李泽经期小管家/services/ai/apiConfig.example.js` 为 `apiConfig.js`，填入自己的后端地址和同一个 `appToken`（这两个配置文件都已加入 `.gitignore`）。
4. 运行测试：

```bash
node --test tests/*.test.mjs
```

完整说明见 [使用说明.md](./使用说明.md)。健康知识库仅供科普，不能替代医生诊断。

## 隐私

经期记录默认只保存在设备本地。不要把真实 API Key、服务器地址、访问口令或个人数据提交到公开仓库。

## 许可证

本项目采用 MIT License，详见 [LICENSE](./LICENSE)。
