# Tasks

- [x] Task 1: 项目初始化与基础架构搭建
  - [x] SubTask 1.1: 初始化项目目录结构（public/、functions/、lib/、locales/）
  - [x] SubTask 1.2: 创建 package.json、wrangler.toml、tsconfig.json
  - [x] SubTask 1.3: 配置 Cloudflare KV 命名空间（BRIEFING_KV、CONFIG_KV）
  - [x] SubTask 1.4: 创建共享类型定义文件（lib/types.ts）
  - [x] SubTask 1.5: 创建 KV 工具模块（lib/kv.ts — 封装 KV 读写、加密存储）

- [x] Task 2: i18n 国际化系统
  - [x] SubTask 2.1: 创建 i18n 核心模块（public/js/i18n.mjs — 语言切换、翻译函数、自动检测）
  - [x] SubTask 2.2: 创建英文翻译文件（locales/en.json）
  - [x] SubTask 2.3: 创建中文翻译文件（locales/zh.json）
  - [x] SubTask 2.4: 在 HTML 中添加 data-i18n 属性标记所有可翻译文本

- [x] Task 3: 数据源适配器 — Tier 1 卫星与遥感
  - [x] SubTask 3.1: NASA FIRMS 火灾检测适配器（lib/sources/firms.ts）
  - [x] SubTask 3.2: OpenSky Network 航班追踪适配器（lib/sources/opensky.ts）
  - [x] SubTask 3.3: ADS-B Exchange 航班追踪适配器（lib/sources/adsb.ts）

- [x] Task 4: 数据源适配器 — Tier 2 经济指标
  - [x] SubTask 4.1: FRED 经济数据适配器（lib/sources/fred.ts）
  - [x] SubTask 4.2: EIA 能源数据适配器（lib/sources/eia.ts）
  - [x] SubTask 4.3: Yahoo Finance 市场数据适配器（lib/sources/yahoo-finance.ts）

- [x] Task 5: 数据源适配器 — Tier 3 冲突与制裁
  - [x] SubTask 5.1: ACLED 武装冲突事件适配器（lib/sources/acled.ts）
  - [x] SubTask 5.2: GDELT 全球事件适配器（lib/sources/gdelt.ts）
  - [x] SubTask 5.3: OFAC 制裁名单适配器（lib/sources/ofac.ts）

- [x] Task 6: 数据源适配器 — Tier 4 环境与健康
  - [x] SubTask 6.1: Safecast 辐射监测适配器（lib/sources/safecast.ts）
  - [x] SubTask 6.2: EPA RadNet 辐射适配器（lib/sources/epa-radnet.ts）
  - [x] SubTask 6.3: WHO 健康警报适配器（lib/sources/who.ts）

- [x] Task 7: 数据源适配器 — Tier 5 海事与运输
  - [x] SubTask 7.1: AIS Stream 船舶追踪适配器（lib/sources/ais-stream.ts）

- [x] Task 8: 数据源适配器 — Tier 6 网络与基础设施
  - [x] SubTask 8.1: CISA KEV 漏洞目录适配器（lib/sources/cisa-kev.ts）
  - [x] SubTask 8.2: Cloudflare Radar 互联网中断适配器（lib/sources/cf-radar.ts）

- [x] Task 9: 数据源适配器 — Tier 7 太空追踪
  - [x] SubTask 9.1: CelesTrak 卫星追踪适配器（lib/sources/celesttrak.ts）

- [x] Task 10: 数据源适配器 — Tier 8 新闻与OSINT
  - [x] SubTask 10.1: RSS 新闻聚合适配器（lib/sources/rss.ts）
  - [x] SubTask 10.2: Telegram OSINT 频道适配器（lib/sources/telegram-osint.ts）

- [x] Task 11: 数据源适配器 — Tier 9 市场与金融补充
  - [x] SubTask 11.1: 美国国债数据适配器（lib/sources/us-debt.ts）
  - [x] SubTask 11.2: 供应链压力指数适配器（lib/sources/gscpi.ts）

- [x] Task 12: 扫描编排引擎
  - [x] SubTask 12.1: 创建扫描调度器（lib/sweep/orchestrator.ts — 并行执行所有源、超时控制、错误收集）
  - [x] SubTask 12.2: 创建数据合成器（lib/sweep/synthesizer.ts — 将原始数据合成为仪表盘格式）
  - [x] SubTask 12.3: 创建 safeFetch 工具（lib/utils/fetch.ts — 超时、重试、中止、自动 JSON）

- [x] Task 13: 增量引擎
  - [x] SubTask 13.1: 创建增量计算引擎（lib/delta/engine.ts — 数值变化、计数变化、新增/消失信号）
  - [x] SubTask 13.2: 创建增量阈值配置（lib/delta/thresholds.ts — 可配置的变化阈值）

- [x] Task 14: LLM 集成层
  - [x] SubTask 14.1: 创建 LLM 统一接口（lib/llm/provider.ts — 统一调用接口、错误处理、降级逻辑）
  - [x] SubTask 14.2: 创建 Anthropic 适配器（lib/llm/anthropic.ts）
  - [x] SubTask 14.3: 创建 OpenAI 适配器（lib/llm/openai.ts）
  - [x] SubTask 14.4: 创建 Gemini 适配器（lib/llm/gemini.ts）
  - [x] SubTask 14.5: 创建 OpenRouter 适配器（lib/llm/openrouter.ts）
  - [x] SubTask 14.6: 创建 MiniMax 适配器（lib/llm/minimax.ts）
  - [x] SubTask 14.7: 创建 Mistral 适配器（lib/llm/mistral.ts）
  - [x] SubTask 14.8: 创建 Grok 适配器（lib/llm/grok.ts）
  - [x] SubTask 14.9: 创建交易想法生成器（lib/llm/trade-ideas.ts）
  - [x] SubTask 14.10: 创建告警评估器（lib/llm/alert-evaluator.ts）
  - [x] SubTask 14.11: 创建基于规则的降级评估器（lib/llm/rule-evaluator.ts）

- [x] Task 15: 告警系统
  - [x] SubTask 15.1: 创建告警分级引擎（lib/alerts/classifier.ts — FLASH/PRIORITY/ROUTINE）
  - [x] SubTask 15.2: 创建语义去重器（lib/alerts/dedup.ts）
  - [x] SubTask 15.3: 创建告警历史记录（KV 存储）

- [x] Task 16: Telegram Bot（Webhook 模式）
  - [x] SubTask 16.1: 创建 Telegram Webhook 处理函数（functions/api/telegram/webhook.ts）
  - [x] SubTask 16.2: 创建 Telegram Bot 逻辑模块（lib/bots/telegram.ts — 命令处理、消息格式化）
  - [x] SubTask 16.3: 创建 Webhook 注册端点（functions/api/telegram/register.ts）
  - [x] SubTask 16.4: 实现所有 Bot 命令（/status, /sweep, /brief, /alerts, /mute, /unmute, /help）

- [x] Task 17: Discord Bot（Webhook 模式）
  - [x] SubTask 17.1: 创建 Discord Interaction 处理函数（functions/api/discord/interaction.ts）
  - [x] SubTask 17.2: 创建 Discord Bot 逻辑模块（lib/bots/discord.ts — Slash 命令、Rich Embed 格式化）
  - [x] SubTask 17.3: 创建 Slash 命令注册端点（functions/api/discord/register.ts）
  - [x] SubTask 17.4: 创建 Discord Webhook 告警推送（lib/bots/discord-webhook.ts）

- [x] Task 18: API 端点（CF Pages Functions）
  - [x] SubTask 18.1: 创建扫描触发端点（functions/api/sweep.ts — POST 触发扫描）
  - [x] SubTask 18.2: 创建数据查询端点（functions/api/briefing.ts — GET 最新扫描数据）
  - [x] SubTask 18.3: 创建增量查询端点（functions/api/delta.ts — GET 最新增量数据）
  - [x] SubTask 18.4: 创建市场数据端点（functions/api/markets.ts — GET 市场数据）
  - [x] SubTask 18.5: 创建设置 CRUD 端点（functions/api/settings.ts — GET/PUT 配置）
  - [x] SubTask 18.6: 创建模型列表端点（functions/api/models.ts — GET 从 LLM API 获取可用模型）
  - [x] SubTask 18.7: 创建健康检查端点（functions/api/health.ts — GET 系统状态）

- [x] Task 19: Cron Trigger Worker（定时扫描）
  - [x] SubTask 19.1: 创建独立 Worker 入口（workers/cron-sweep.ts — Cron 触发扫描逻辑）
  - [x] SubTask 19.2: 配置 wrangler.toml 中的 Cron Triggers（默认每 15 分钟）

- [x] Task 20: 前端仪表盘 — 基础框架
  - [x] SubTask 20.1: 创建主 HTML 页面（public/index.html — Jarvis 风格布局骨架）
  - [x] SubTask 20.2: 创建全局 CSS 样式（public/css/main.css — 暗色主题、HUD 风格、响应式）
  - [x] SubTask 20.3: 创建启动序列动画（public/js/boot-sequence.mjs）
  - [x] SubTask 20.4: 创建仪表盘控制器（public/js/dashboard.mjs — 初始化、轮询、面板管理）

- [x] Task 21: 前端仪表盘 — 3D 地球与地图
  - [x] SubTask 21.1: 创建 Globe.gl 3D 地球模块（public/js/globe.mjs — 地球渲染、标记、弧线、旋转）
  - [x] SubTask 21.2: 创建 Leaflet 平面地图模块（public/js/map.mjs — 地图渲染、标记、区域缩放）
  - [x] SubTask 21.3: 创建标记渲染器（public/js/markers.mjs — 9 种标记类型的统一渲染接口）

- [x] Task 22: 前端仪表盘 — 面板组件
  - [x] SubTask 22.1: 创建传感器网格面板（public/js/panels/sensor-grid.mjs）
  - [x] SubTask 22.2: 创建核监控面板（public/js/panels/nuclear-watch.mjs）
  - [x] SubTask 22.3: 创建风险仪表面板（public/js/panels/risk-gauges.mjs）
  - [x] SubTask 22.4: 创建太空监控面板（public/js/panels/space-watch.mjs）
  - [x] SubTask 22.5: 创建新闻滚动条（public/js/panels/news-ticker.mjs）
  - [x] SubTask 22.6: 创建 OSINT 信息流面板（public/js/panels/osint-feed.mjs）
  - [x] SubTask 22.7: 创建市场数据面板（public/js/panels/markets.mjs）
  - [x] SubTask 22.8: 创建交易想法面板（public/js/panels/trade-ideas.mjs）
  - [x] SubTask 22.9: 创建跨源信号面板（public/js/panels/cross-signals.mjs）
  - [x] SubTask 22.10: 创建扫描增量面板（public/js/panels/sweep-delta.mjs）
  - [x] SubTask 22.11: 创建信号指南面板（public/js/panels/signal-guide.mjs）

- [x] Task 23: 前端仪表盘 — 交互功能
  - [x] SubTask 23.1: 创建区域筛选控制器（public/js/region-filter.mjs）
  - [x] SubTask 23.2: 创建性能模式切换（public/js/visuals-mode.mjs）
  - [x] SubTask 23.3: 创建数据轮询客户端（public/js/poll-client.mjs — 30 秒轮询、增量更新）

- [x] Task 24: 设置管理页面
  - [x] SubTask 24.1: 创建设置页面 HTML（public/settings.html）
  - [x] SubTask 24.2: 创建设置页面 CSS（public/css/settings.css — Jarvis 风格）
  - [x] SubTask 24.3: 创建设置页面 JS（public/js/settings.mjs — 表单处理、API 调用、状态显示）
  - [x] SubTask 24.4: 实现 API 密钥配置区域（所有数据源密钥的输入和保存）
  - [x] SubTask 24.5: 实现 LLM 配置区域（提供商选择、模型选择/输入、从 API 获取模型列表）
  - [x] SubTask 24.6: 实现 Bot 配置区域（Telegram/Discord Token、Webhook 注册状态）
  - [x] SubTask 24.7: 实现扫描间隔配置

- [x] Task 25: 集成测试与部署验证
  - [x] SubTask 25.1: 本地开发环境测试（wrangler pages dev）
  - [x] SubTask 25.2: 验证所有 API 端点正常响应
  - [x] SubTask 25.3: 验证仪表盘完整功能（3D 地球、面板、轮询更新）
  - [x] SubTask 25.4: 验证 i18n 中英切换
  - [x] SubTask 25.5: 验证设置页面功能
  - [x] SubTask 25.6: 验证 Cron Trigger 触发扫描
  - [x] SubTask 25.7: 验证 Telegram/Discord Webhook（如已配置）

# Task Dependencies
- [Task 1] 是所有后续任务的基础
- [Task 2] i18n 系统需在 Task 20-24 前完成
- [Task 3-11] 数据源适配器可并行开发，均依赖 Task 1
- [Task 12] 依赖 Task 3-11（至少部分完成）
- [Task 13] 依赖 Task 12
- [Task 14] 依赖 Task 1
- [Task 15] 依赖 Task 13 和 Task 14
- [Task 16] 依赖 Task 15 和 Task 18
- [Task 17] 依赖 Task 15 和 Task 18
- [Task 18] 依赖 Task 1、Task 12、Task 13
- [Task 19] 依赖 Task 12 和 Task 18
- [Task 20] 依赖 Task 1 和 Task 2
- [Task 21] 依赖 Task 20
- [Task 22] 依赖 Task 20 和 Task 21
- [Task 23] 依赖 Task 20
- [Task 24] 依赖 Task 1、Task 2、Task 18
- [Task 25] 依赖所有前序任务

# Parallelizable Work
以下任务组可并行开发：
- Group A: Task 3-11（所有数据源适配器）
- Group B: Task 14（LLM 集成层）
- Group C: Task 2（i18n 系统）
- Group D: Task 20-23（前端仪表盘，在 i18n 完成后）
