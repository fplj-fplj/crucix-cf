# Checklist

## 基础架构
- [x] 项目可通过 `wrangler pages dev` 本地运行
- [x] 项目可通过 `wrangler pages deploy` 部署到 CF Pages
- [x] KV 命名空间正确绑定（BRIEFING_KV、CONFIG_KV）
- [x] wrangler.toml 配置完整（KV 绑定、Cron Triggers、兼容性标志）
- [x] 所有后端代码兼容 CF Workers 运行时（无 Node.js 专属 API）

## 数据源
- [x] 所有 20 数据源适配器实现完毕
- [x] 并行扫描在 60 秒内完成
- [x] 未配置密钥的数据源优雅降级（返回结构化错误，不中断扫描）
- [x] safeFetch 工具正确处理超时、重试、中止

## 扫描与增量引擎
- [x] 扫描编排器并行执行所有数据源
- [x] 数据合成器将原始数据正确转换为仪表盘格式
- [x] 增量引擎正确计算数值变化、计数变化、新增/消失信号
- [x] Cron Trigger 每 15 分钟自动触发扫描
- [x] 手动扫描端点 `/api/sweep` 可正常触发

## API 端点
- [x] GET `/api/briefing` 返回最新扫描数据
- [x] GET `/api/delta` 返回最新增量数据
- [x] GET `/api/markets` 返回市场数据
- [x] GET/PUT `/api/settings` 正确读写配置
- [x] GET `/api/models` 可从 LLM API 获取可用模型列表
- [x] GET `/api/health` 返回系统健康状态
- [x] POST `/api/sweep` 触发手动扫描

## LLM 集成
- [x] 7 种 LLM 提供商适配器实现完毕（Anthropic、OpenAI、Gemini、OpenRouter、MiniMax、Mistral、Grok）
- [x] 交易想法生成器产出可操作想法
- [x] 告警评估器正确分类 FLASH/PRIORITY/ROUTINE
- [x] LLM 不可用时回退到基于规则的评估器
- [x] 模型列表可从 API 端点动态获取

## Telegram Bot
- [x] Webhook 注册端点正常工作
- [x] 所有命令正确响应（/status, /sweep, /brief, /alerts, /mute, /unmute, /help）
- [x] 告警消息正确推送到 Telegram 聊天
- [x] Bot 命令支持中英双语响应

## Discord Bot
- [x] Slash 命令注册正常
- [x] Interaction Webhook 正确处理命令
- [x] Rich Embed 告警正确推送（颜色编码：红/黄/蓝）
- [x] Webhook 降级模式正常工作

## 前端仪表盘
- [x] Jarvis 风格 HUD 布局完整渲染
- [x] 启动序列动画正常播放
- [x] 3D 地球（Globe.gl）正常渲染，含标记类型
- [x] 平面地图（Leaflet）正常渲染，含相同标记
- [x] 航班走廊弧线动画正常显示
- [x] 区域筛选功能正常（6 个区域）
- [x] VISUALS FULL/LITE 模式切换正常
- [x] LITE 模式在移动端强制平面地图
- [x] 性能模式偏好保存至 localStorage
- [x] 所有 11 个面板组件正常渲染数据
- [x] 新闻滚动条自动滚动
- [x] OSINT 信息流显示紧急标记
- [x] 轮询客户端每 30 秒获取最新数据
- [x] 增量更新时面板正确刷新

## 设置页面
- [x] 设置页面保持 Jarvis 风格 UI
- [x] API 密钥配置区域完整（所有数据源密钥）
- [x] LLM 配置区域支持提供商选择和模型选择
- [x] 可从 API 获取模型列表并选择
- [x] 支持手动输入自定义模型名称
- [x] Bot 配置区域显示 Webhook 注册状态
- [x] 配置保存后立即生效
- [x] 敏感信息加密存储

## i18n 国际化
- [x] 中英双语切换功能正常
- [x] 首次访问根据浏览器语言自动选择
- [x] 默认语言为中文
- [x] 所有面板标题、按钮、状态标签已翻译
- [x] 信号名称和告警等级已翻译
- [x] 信号指南内容已翻译
- [x] 设置页面文本已翻译
- [x] 错误消息已翻译
- [x] 语言偏好保存至 localStorage
- [x] 数据源原始内容保持原文不翻译

## 告警系统
- [x] 告警正确分级为 FLASH/PRIORITY/ROUTINE
- [x] 语义去重避免重复推送
- [x] 告警同时推送到已配置的 Telegram 和 Discord
- [x] 告警历史记录可查询

## TypeScript 编译验证
- [x] TypeScript 严格模式编译通过（0 错误）
- [x] 所有导入路径正确
- [x] 类型定义完整一致
