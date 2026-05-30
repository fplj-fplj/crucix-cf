# Crucix CF Pages 复刻版 Spec

## Why
原版 Crucix 是一个基于 Node.js Express 的 OSINT 情报终端，需要自建服务器运行。将其复刻为可部署在 Cloudflare Pages 上的无服务器架构，降低部署门槛，同时添加完整中英双语支持和设置管理界面。

## What Changes
- 将 Express 服务端重构为 Cloudflare Pages Functions（基于 Workers 运行时）
- 将文件系统持久化替换为 Cloudflare KV 存储
- 将 SSE 实时推送替换为轮询模式（适配无服务器架构）
- 将 Telegram/Discord Bot 从轮询模式改为 Webhook 模式
- 添加定时扫描触发器（Cloudflare Workers Cron Triggers）
- 添加完整中英双语 i18n 支持
- 添加设置管理页面（API 密钥、LLM 配置、模型选择）
- 前端保持 Vanilla JS 风格，复刻 Jarvis 风格 HUD 仪表盘
- 使用 Cloudflare Workers Cron Trigger 替代 Node.js setInterval 定时扫描

## Impact
- Affected specs: 全部功能模块需重新适配 CF Workers 运行时
- Affected code: 全新项目，无现有代码影响

---

## ADDED Requirements

### Requirement: Cloudflare Pages 部署架构
系统 SHALL 基于 Cloudflare Pages + Functions 架构，支持一键部署到 CF Pages。

#### Scenario: 部署成功
- **WHEN** 用户执行 `wrangler pages deploy` 或通过 CF Dashboard 连接 Git 仓库
- **THEN** 仪表盘和所有 API 端点均可正常访问

#### Scenario: 静态资源托管
- **WHEN** 用户访问根路径 `/`
- **THEN** 返回仪表盘 HTML 页面，所有 CSS/JS 资源正常加载

### Requirement: Cloudflare KV 数据持久化
系统 SHALL 使用 Cloudflare KV 存储扫描结果、增量数据和配置信息。

#### Scenario: 扫描结果存储
- **WHEN** 一次扫描周期完成
- **THEN** 扫描结果以 JSON 格式存入 KV，key 为 `briefing:latest`，历史记录 key 为 `briefing:{timestamp}`

#### Scenario: 配置信息存储
- **WHEN** 用户通过设置页面保存 API 密钥或 LLM 配置
- **THEN** 配置信息加密后存入 KV，key 为 `config:settings`

#### Scenario: 增量数据存储
- **WHEN** 增量引擎计算出变化
- **THEN** 增量数据存入 KV，key 为 `delta:latest`

### Requirement: 数据源适配器（27+ 源）
系统 SHALL 实现与原版相同的 27+ OSINT 数据源适配器，所有适配器 SHALL 兼容 CF Workers 运行时（无 Node.js 专属 API 依赖）。

#### Scenario: 并行扫描
- **WHEN** 扫描周期触发
- **THEN** 所有已配置的数据源并行请求，30-60 秒内完成

#### Scenario: 优雅降级
- **WHEN** 某数据源 API 密钥未配置或请求失败
- **THEN** 该源返回结构化错误，其余源正常工作，不中断扫描周期

#### 数据源清单：
| 层级 | 数据源 | 需要密钥 |
|------|--------|----------|
| Tier 1: 卫星与遥感 | NASA FIRMS 火灾检测 | FIRMS_MAP_KEY |
| Tier 1: 卫星与遥感 | OpenSky Network 航班追踪 | 否 |
| Tier 1: 卫星与遥感 | ADS-B Exchange 航班追踪 | ADSB_API_KEY |
| Tier 2: 经济指标 | FRED 经济数据 | FRED_API_KEY |
| Tier 2: 经济指标 | EIA 能源数据 | EIA_API_KEY |
| Tier 2: 经济指标 | Yahoo Finance 市场数据 | 否 |
| Tier 3: 冲突与制裁 | ACLED 武装冲突事件 | ACLED_EMAIL + ACLED_PASSWORD |
| Tier 3: 冲突与制裁 | GDELT 全球事件 | 否 |
| Tier 3: 冲突与制裁 | OFAC 制裁名单 | 否 |
| Tier 4: 环境与健康 | Safecast 辐射监测 | 否 |
| Tier 4: 环境与健康 | EPA RadNet 辐射 | 否 |
| Tier 4: 环境与健康 | WHO 健康警报 | 否 |
| Tier 5: 海事与运输 | AIS Stream 船舶追踪 | AISSTREAM_API_KEY |
| Tier 5: 海事与运输 | Marine Traffic 船舶 | 否 |
| Tier 6: 网络与基础设施 | CISA KEV 漏洞目录 | 否 |
| Tier 6: 网络与基础设施 | Cloudflare Radar 互联网中断 | CLOUDFLARE_API_TOKEN |
| Tier 7: 太空追踪 | CelesTrak 卫星追踪 | 否 |
| Tier 7: 太空追踪 | Space-Track 卫星 | 否 |
| Tier 8: 新闻与OSINT | RSS 新闻聚合 | 否 |
| Tier 8: 新闻与OSINT | Telegram OSINT 频道 | TELEGRAM_BOT_TOKEN |
| Tier 8: 新闻与OSINT | GDELT 新闻 | 否 |
| Tier 9: 市场与金融 | Yahoo Finance 指数/加密/商品 | 否 |
| Tier 9: 市场与金融 | 美国国债数据 | 否 |
| Tier 9: 市场与金融 | 供应链压力指数 | 否 |

### Requirement: Jarvis 风格 HUD 仪表盘
系统 SHALL 提供与原版一致的 Jarvis 风格全功能仪表盘。

#### Scenario: 仪表盘加载
- **WHEN** 用户访问根路径
- **THEN** 显示启动序列动画，随后加载完整 HUD 仪表盘

#### Scenario: 3D 地球视图
- **WHEN** 用户选择地球视图
- **THEN** 渲染 Globe.gl 3D 地球，带大气光晕、星空背景、自动旋转，9 种标记类型

#### Scenario: 平面地图视图
- **WHEN** 用户切换到平面地图
- **THEN** 渲染 Leaflet 平面地图，带相同标记类型和区域筛选

#### Scenario: 区域筛选
- **WHEN** 用户选择区域（世界/美洲/欧洲/中东/亚太/非洲）
- **THEN** 地球旋转至该区域或平面地图缩放至该区域

#### Scenario: 性能模式切换
- **WHEN** 用户切换 VISUALS FULL / VISUALS LITE
- **THEN** LITE 模式禁用装饰性背景效果、模糊滤镜、非必要动画，移动端强制平面地图模式
- **THEN** 偏好保存至 localStorage

#### 仪表盘组件清单：
- 传感器网格面板（航班活动、热力异常、SDR 覆盖、海事监控、核设施、冲突事件、健康警报、世界新闻、OSINT 源、卫星）
- 核监控面板（辐射读数、异常检测）
- 风险仪表盘（VIX、高收益利差、美元指数、失业申请、供应链压力指数）
- 太空监控面板（CelesTrak 卫星追踪、新发射、军事卫星、Starlink/OneWeb 数量、ISS 位置）
- 实时新闻滚动条（RSS + GDELT + Telegram 合并）
- OSINT 信息流（Telegram 频道帖子，带紧急标记）
- 宏观+市场面板（指数、加密、能源、金属、宏观指标）
- 可操作交易想法面板（AI 生成或信号关联）
- 跨源信号面板
- 扫描增量面板（变化、升级、降级、严重度）
- 信号指南面板（信号含义解释）
- 航班走廊弧线动画（3D 地球上）

### Requirement: 轮询式数据更新
系统 SHALL 使用轮询模式替代 SSE，前端定时从 API 获取最新数据。

#### Scenario: 自动刷新
- **WHEN** 仪表盘加载完成
- **THEN** 每 30 秒轮询 `/api/briefing` 获取最新数据，如有更新则刷新面板

#### Scenario: 首次加载
- **WHEN** 仪表盘首次加载且无缓存数据
- **THEN** 显示加载动画，轮询直到首次扫描数据可用

### Requirement: Cloudflare Workers Cron 定时扫描
系统 SHALL 使用 Cloudflare Workers Cron Triggers 实现定时扫描。

#### Scenario: 定时触发
- **WHEN** Cron 触发器按配置间隔（默认 15 分钟）触发
- **THEN** 执行完整扫描周期，更新 KV 中的数据

#### Scenario: 手动触发
- **WHEN** 用户通过仪表盘或 Bot 命令请求手动扫描
- **THEN** 调用 `/api/sweep` 端点触发即时扫描

### Requirement: 增量引擎
系统 SHALL 实现与原版一致的增量引擎，计算扫描周期间的信号变化。

#### Scenario: 增量计算
- **WHEN** 新扫描完成
- **THEN** 与上次扫描结果对比，计算数值变化、计数变化、新增/消失信号

#### Scenario: 增量展示
- **WHEN** 用户查看扫描增量面板
- **THEN** 显示变化类型（新信号/升级/降级）、严重度、具体数值变化

### Requirement: Telegram Bot（Webhook 模式）
系统 SHALL 实现 Telegram Bot，使用 Webhook 模式替代轮询。

#### Scenario: Webhook 注册
- **WHEN** 用户在设置页面配置 TELEGRAM_BOT_TOKEN
- **THEN** 系统自动向 Telegram 注册 Webhook URL

#### Scenario: 命令响应
- **WHEN** Telegram 向 Webhook URL 发送用户命令
- **THEN** Worker 处理命令并返回响应

#### 支持命令：
| 命令 | 功能 |
|------|------|
| `/status` | 系统健康、上次扫描时间、源状态、LLM 状态 |
| `/sweep` | 触发手动扫描 |
| `/brief` | 最新情报文本摘要 |
| `/alerts` | 近期告警历史 |
| `/mute` / `/mute 2h` | 静默告警 |
| `/unmute` | 恢复告警 |
| `/help` | 显示所有命令 |

#### Scenario: 告警推送
- **WHEN** 扫描检测到 FLASH/PRIORITY/ROUTINE 级别信号
- **THEN** 通过 Telegram Bot API 主动推送告警消息到配置的聊天

### Requirement: Discord Bot（Webhook 模式）
系统 SHALL 实现 Discord Bot，使用 Webhook + Interaction 模式。

#### Scenario: Slash 命令注册
- **WHEN** 用户配置 DISCORD_BOT_TOKEN
- **THEN** 系统注册 Slash 命令到 Discord

#### Scenario: 命令响应
- **WHEN** Discord 向 Interaction Webhook 发送 Slash 命令
- **THEN** Worker 处理命令并返回 Rich Embed 响应

#### Scenario: 告警推送
- **WHEN** 扫描检测到告警级信号
- **THEN** 通过 Discord Webhook 推送 Rich Embed 告警（红色 FLASH、黄色 PRIORITY、蓝色 ROUTINE）

### Requirement: LLM 集成层
系统 SHALL 支持 8 种 LLM 提供商，用于 AI 交易想法生成和智能告警评估。

#### Scenario: LLM 交易想法
- **WHEN** 扫描完成且 LLM 已配置
- **THEN** 生成 5-8 条可操作交易想法，引用具体数据

#### Scenario: 智能告警评估
- **WHEN** 检测到信号变化
- **THEN** LLM 将信号分类为 FLASH/PRIORITY/ROUTINE，附带跨域关联和置信度评分

#### Scenario: 优雅降级
- **WHEN** LLM 不可用或请求失败
- **THEN** 回退到基于规则的告警评估引擎，不中断扫描周期

#### 支持提供商：
Anthropic Claude、OpenAI、Google Gemini、OpenRouter、OpenAI Codex、MiniMax、Mistral、Grok

### Requirement: 设置管理页面
系统 SHALL 提供设置管理页面，用于配置 API 密钥、LLM 参数和 Bot 配置。

#### Scenario: 访问设置页面
- **WHEN** 用户访问 `/settings`
- **THEN** 显示设置管理界面，包含所有可配置项

#### Scenario: API 密钥配置
- **WHEN** 用户填写并保存 API 密钥
- **THEN** 密钥加密后存储至 KV，立即生效

#### Scenario: LLM 配置
- **WHEN** 用户选择 LLM 提供商
- **THEN** 显示该提供商的默认模型，用户可选择默认模型或手动输入自定义模型名称

#### Scenario: 从 API 获取模型列表
- **WHEN** 用户点击「获取模型列表」按钮
- **THEN** 系统调用 LLM API 的 `/models` 端点获取可用模型列表，用户可从中选择

#### Scenario: Bot 配置
- **WHEN** 用户配置 Telegram/Discord Bot Token
- **THEN** 系统自动注册 Webhook，显示配置状态

#### Scenario: 设置页面风格
- **WHEN** 设置页面渲染
- **THEN** 保持与仪表盘一致的 Jarvis 风格 UI 设计

### Requirement: 完整中英双语 i18n
系统 SHALL 提供完整的中英双语支持，所有 UI 文本均可切换。

#### Scenario: 语言切换
- **WHEN** 用户点击语言切换按钮
- **THEN** 所有 UI 文本立即切换为对应语言，偏好保存至 localStorage

#### Scenario: 默认语言
- **WHEN** 用户首次访问
- **THEN** 根据浏览器语言自动选择中文或英文，默认中文

#### Scenario: 翻译范围
- **WHEN** i18n 系统运行
- **THEN** 以下内容全部翻译：面板标题、按钮文本、状态标签、信号名称、告警等级、信号指南、设置页面、错误消息、Bot 命令帮助文本

#### Scenario: 数据内容不翻译
- **WHEN** 显示来自数据源的原始内容
- **THEN** 新闻标题、OSINT 帖子、市场数据等原始内容保持原文，不进行机器翻译

### Requirement: 告警系统
系统 SHALL 实现多层级告警系统，支持语义去重。

#### Scenario: 告警分级
- **WHEN** 信号被评估
- **THEN** 分类为 FLASH（红色）、PRIORITY（黄色）、ROUTINE（蓝色）三个等级

#### Scenario: 语义去重
- **WHEN** 多个信号描述同一事件
- **THEN** 合并为单一告警，避免重复推送

#### Scenario: 告警推送
- **WHEN** 告警生成且 Bot 已配置
- **THEN** 同时推送到 Telegram 和 Discord（如均已配置）

---

## MODIFIED Requirements

### Requirement: 无服务器架构适配
原版基于 Express + 文件系统 + 长轮询，修改为 CF Workers + KV + Webhook + 轮询架构。

**关键变更：**
- Express 路由 → CF Pages Functions（`functions/` 目录）
- `fs.readFileSync` / `fs.writeFileSync` → KV 读写
- SSE 长连接 → 前端 30 秒轮询
- `setInterval` 定时扫描 → CF Workers Cron Triggers
- Telegram 轮询 → Webhook 模式
- Discord WebSocket → Webhook + Interaction 模式
- `process.env` → KV 存储的加密配置 + 环境变量（敏感密钥通过 CF Dashboard 设置）
- `node-fetch` / 原生 `fetch` → CF Workers 原生 `fetch` API

---

## REMOVED Requirements

### Requirement: Docker 部署
**Reason**: CF Pages 不需要 Docker，直接通过 `wrangler` 或 Git 集成部署
**Migration**: 使用 `wrangler pages deploy` 或 CF Dashboard Git 集成

### Requirement: 本地文件系统存储
**Reason**: CF Workers 无法访问文件系统
**Migration**: 使用 Cloudflare KV 替代

### Requirement: Node.js 专属依赖
**Reason**: CF Workers 运行时不支持 Node.js 专属 API（如 `fs`、`net`、`child_process`）
**Migration**: 使用 Web 标准 API 替代
