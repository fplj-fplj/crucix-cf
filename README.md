# Crucix CF Workers

**你的专属情报终端。27 个数据源。一个命令。零云依赖。**

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/fplj-fplj/crucix-cf-pages)
[![Node.js 22+](https://img.shields.io/badge/node-22%2B-brightgreen)](#前置要求)
[![License: AGPL v3](https://img.shields.io/badge/license-AGPLv3-blue.svg)](LICENSE)

**访问在线演示**: [https://crucix-cf-pages.pages.dev/](https://crucix-cf-pages.pages.dev/)

---

## 🙏 致谢

本项目是 [Crucix](https://github.com/calesthio/Crucix) 的复刻版本，感谢原作者 [calesthio](https://github.com/calesthio) 创造了如此出色的 OSINT 情报终端。

原项目的创新设计和架构为这个 CF Workers 版本奠定了坚实基础。我们在原版基础上进行了以下改进：
- 适配 Cloudflare Workers 无服务器架构
- 添加完整中英双语支持
- 新增内容翻译功能（Google/Microsoft 翻译）
- 将 Bot 从轮询模式改为 Webhook 模式
- 优化前端性能和响应式设计

---

## 功能特性

### 🌍 Jarvis 风格 HUD 仪表盘

- **3D WebGL 地球**（Globe.gl）— 大气光晕、星空背景、自动旋转，支持切换平面地图
- **9 种标记类型**：火灾热力、航空活动、辐射站点、海事咽喉、SDR 接收器、OSINT 事件、健康警报、世界新闻、冲突事件
- **航班走廊弧线动画** — 3D 地球上动态航线路径
- **6 大区域筛选**：全球 / 美洲 / 欧洲 / 中东 / 亚太 / 非洲

### 📊 实时数据面板

- **传感器网格** — 15 项关键指标实时监控
- **核监控面板** — Safecast + EPA RadNet 辐射数据
- **风险仪表盘** — VIX、高收益利差、美元指数、供应链压力
- **太空监控** — CelesTrak 卫星追踪（Starlink/OneWeb/军事卫星/ISS）
- **新闻滚动条** — RSS + GDELT + Telegram OSINT 合并推送
- **OSINT 信息流** — 17 个情报频道，紧急标记
- **宏观+市场** — 指数、加密货币、能源、金属
- **可操作交易想法** — AI 生成（需 LLM）或信号关联
- **跨源信号** — 多域交叉分析
- **扫描增量** — 周期间变化检测

### 🤖 双 Bot 系统（Webhook 模式）

**Telegram Bot：**

| 命令 | 功能 |
|------|------|
| `/status` | 系统健康状态 |
| `/sweep` | 触发手动扫描 |
| `/brief` | 情报文本摘要 |
| `/alerts` | 告警历史 |
| `/mute 2h` | 临时静默 |
| `/unmute` | 恢复告警 |
| `/help` | 帮助信息 |

**Discord Bot：**

| 命令 | 功能 |
|------|------|
| `/status` | 系统健康状态 |
| `/sweep` | 触发手动扫描 |
| `/brief` | 情报文本摘要 |
| `/alerts` | 告警历史 |

告警推送：FLASH（🔴）/ PRIORITY（🟡）/ ROUTINE（🔵）三级分级

### 🧠 LLM 增强层

支持 **8 种 LLM 提供商**：

| 提供商 | 默认模型 | API Key |
|--------|---------|---------|
| Anthropic | claude-sonnet-4 | ✅ 需要 |
| OpenAI | gpt-4o | ✅ 需要 |
| Google Gemini | gemini-1.5-pro | ✅ 需要 |
| OpenRouter | auto | ✅ 需要 |
| MiniMax | MiniMax-Text-01 | ✅ 需要 |
| Mistral | mistral-large | ✅ 需要 |
| Grok | grok-3 | ✅ 需要 |

LLM 功能：AI 交易想法生成、智能告警评估（FLASH/PRIORITY/ROUTINE）、语义去重

### 🌐 i18n 国际化

- **完整中英双语** — 默认中文，可切换英文
- 浏览器语言自动检测
- 所有 UI 文本、信号指南、Bot 命令均已翻译

### 📝 内容翻译（可选）

自动翻译非中文内容，支持：
- **Google 翻译 API**
- **Microsoft 翻译 API**
- 可开关，在设置页面配置

---

## 🚀 Cloudflare Workers 快速部署

### 方式一：一键部署（快速开始）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/fplj-fplj/crucix-cf-pages)

点击上方按钮快速开始部署。部署前需要先创建 KV 命名空间并配置 `wrangler.toml`。

---

### 方式二：手动部署（推荐，更可控）

#### 第一步：Fork 仓库

点击 GitHub 页面右上角 **Fork**，创建你自己的副本。

#### 第二步：创建 Cloudflare KV 命名空间

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **KV** → **Create a namespace**
3. 创建两个命名空间：
   - `BRIEFING_KV`（用于存储扫描结果）
   - `CONFIG_KV`（用于存储配置）
4. 复制两个命名空间的 **ID**

#### 第三步：配置 wrangler.toml

在 fork 的仓库中编辑 `wrangler.toml`，填入你的 KV 命名空间 ID：

```toml
[[kv_namespaces]]
binding = "BRIEFING_KV"
id = "YOUR_BRIEFING_KV_ID"  # 替换这里

[[kv_namespaces]]
binding = "CONFIG_KV"
id = "YOUR_CONFIG_KV_ID"    # 替换这里
```

#### 第四步：部署到 Cloudflare Workers

在本地运行：

```bash
npm install
npm run deploy
```

或者使用 GitHub Actions 自动部署（见下文）。

#### 第五步：访问应用

部署完成后访问 `https://your-worker-name.your-subdomain.workers.dev/`

---

### 方式三：使用 GitHub Actions 自动部署

#### 第一步：Fork 仓库 + 创建 KV 命名空间

同方式二的第一步和第二步。

#### 第二步：配置 GitHub Secrets

在 fork 的仓库中：

1. 进入 **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. 添加以下 Secret：

| Secret 名称 | 说明 |
|------------|------|
| `CF_ACCOUNT_ID` | Cloudflare 账户 ID（Dashboard 右下角） |
| `CF_API_TOKEN` | Cloudflare API Token（创建 Token，权限：Account:Workers KV:Edit，Worker Scripts:Edit） |

#### 第三步：配置 wrangler.toml

在仓库中编辑 `wrangler.toml`，填入你的 KV 命名空间 ID。

#### 第四步：自动部署

**🔒 默认关闭自动构建** - 为了避免频繁的部署失败通知，默认仅支持手动触发部署。

**如何手动触发部署：**
- 访问 GitHub 仓库 → Actions → Deploy to Cloudflare Workers → Run workflow

**如何开启自动构建（可选）：**
1. 打开 `.github/workflows/deploy.yml` 文件
2. 找到 `on:` 部分，取消注释以下两行：
   ```yaml
   # push:
   #   branches: [main]
   ```
   改为：
   ```yaml
   push:
     branches: [main]
   ```
3. 提交并推送更改

**开启后效果：**
- 每次推送到 `main` 分支时，GitHub Actions 将自动运行 TypeScript 检查并部署到 Cloudflare Workers

**注意事项：**
- 确保已正确配置以下 Secrets：
  - `CF_API_TOKEN` - Cloudflare API Token
  - `CF_ACCOUNT_ID` - Cloudflare Account ID
- （可选）如果已提前创建 KV 命名空间，添加以下 Secrets 以避免重新创建：
  - `KV_BRIEFING_ID` - BRIEFING_KV 命名空间 ID
  - `KV_CONFIG_ID` - CONFIG_KV 命名空间 ID
- `wrangler.toml` 中的 KV 占位符会在部署时自动替换

---

### 方式四：本地开发

#### 前置要求

- **Node.js 22+**（使用原生 `fetch`、top-level `await`、ESM）
- **Wrangler CLI**: `npm install -g wrangler`
- **Cloudflare 账户**（免费即可）

#### 克隆并安装

```bash
git clone https://github.com/YOUR_USERNAME/crucix-cf-pages.git
cd crucix-cf-pages
npm install
```

#### 创建 KV 命名空间（本地测试）

```bash
wrangler kv namespace create BRIEFING_KV
wrangler kv namespace create CONFIG_KV
```

将输出的 ID 填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "BRIEFING_KV"
id = "YOUR_BRIEFING_KV_ID"  # 替换这里

[[kv_namespaces]]
binding = "CONFIG_KV"
id = "YOUR_CONFIG_KV_ID"    # 替换这里
```

#### 本地开发

```bash
npm run dev
```

访问 `http://localhost:8787`，使用 wrangler 本地开发环境。

#### 生产部署

```bash
npm run deploy
```

---

## ⚙️ 配置指南

访问部署后的 `/settings` 页面配置所有选项。

### API 密钥配置

#### 免费 API 密钥（推荐，3 分钟注册）

| 密钥 | 获取地址 | 解锁数据 | 费用 |
|------|---------|---------|------|
| FRED API Key | [fred.stlouisfed.org/docs/api](https://fred.stlouisfed.org/docs/api/api_key.html) | 联邦储备经济数据、VIX、CPI | 🆓 免费 |
| NASA FIRMS Map Key | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/area/) | 卫星火灾检测 | 🆓 免费 |
| EIA API Key | [api.eia.gov/register](https://www.eia.gov/opendata/register.php) | 能源数据 | 🆓 免费 |
| SAFECAST API | [api.safecast.org](https://api.safecast.org/) | 辐射监测数据 | 🆓 免费 |
| CISA KEV | [cisa.gov/known-exploited-vulnerabilities-catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | 已知漏洞目录 | 🆓 免费 |
| GDELT API | [api.gdeltproject.org](https://www.gdeltproject.org/) | 全球事件数据 | 🆓 免费 |
| WHO API | [who.int/data/gho](https://www.who.int/data/gho) | 全球健康数据 | 🆓 免费 |

#### 付费 API 密钥（可选）

| 密钥 | 获取地址 | 解锁数据 | 费用 |
|------|---------|---------|------|
| ACLED Email + Password | [acleddata.com/register](https://acleddata.com/register/) | 武装冲突事件 | 💰 付费 |
| AIS Stream API Key | [aisstream.io](https://aisstream.io/) | 船舶追踪 | 💰 付费 |
| ADSB API Key | [RapidAPI](https://rapidapi.com/adsbexchange/api/adsbexchange-com1) | 详细航班追踪 | 💰 付费 |
| OpenSky Network | [opensky-network.org/api](https://opensky-network.org/api/) | 航班追踪数据 | 💰 付费/受限免费 |

#### 需 Cloudflare 账户（免费套餐可用）

| 密钥 | 获取地址 | 解锁数据 | 费用 |
|------|---------|---------|------|
| Cloudflare API Token | [dash.cloudflare.com](https://dash.cloudflare.com/profile/api-tokens) | 互联网中断监测 | 🆓 免费套餐可用 |

### LLM 配置

1. 在设置页面选择 LLM 提供商
2. 输入 API Key
3. 选择模型（可点击"获取模型列表"自动获取可用模型，或手动输入）
4. 保存后即可使用 AI 交易想法和智能告警评估

### 翻译配置

本项目提供多种免费翻译服务（均无需 API Key）：

1. 开启"翻译非中文内容"
2. 选择翻译提供商：
   - **Google (Free)** - 默认推荐，无需配置
   - **Microsoft (Free)** - 无需配置
   - **DeepL (Free)** - 每月 50 万字符免费额度
   - **DeepL (API Key)** - 需要 DeepL Pro API Key（更高额度）
   - **MyMemory (Free)** - 免费翻译服务
   - **LibreTranslate (Free)** - 免费开源翻译，可自定义服务器
3. （可选）如需使用 DeepL Pro，输入 API Key
4. 保存即可使用

*注：除 DeepL Pro 外，所有翻译服务均无需 API Key！*

### Telegram Bot 配置

1. 在 Telegram 中搜索 [@BotFather](https://t.me/BotFather)，创建 Bot，复制 Bot Token
2. 在 Telegram 中搜索 [@userinfobot](https://t.me/userinfobot)，获取你的 Chat ID
3. 在设置页面填入 Token 和 Chat ID
4. 点击"注册 Webhook"

### Discord Bot 配置

1. 进入 [Discord Developer Portal](https://discord.com/developers/applications)，创建 Application
2. 进入 **Bot**，点击 **Reset Token**，复制 Token
3. 开启 **Message Content Intent**（Required for Slash Commands）
4. 在设置页面填入 Token、Channel ID、Guild ID
5. 点击"注册 Slash 命令"

---

## 🏗️ 架构说明

```
crucix-cf-pages/
├── src/
│   ├── index.ts           # Worker 主入口
│   ├── types.ts           # TypeScript 类型定义
│   ├── api/              # API 端点
│   │   ├── briefing.ts    # GET /api/briefing
│   │   ├── sweep.ts       # POST /api/sweep
│   │   ├── delta.ts       # GET /api/delta
│   │   ├── markets.ts     # GET /api/markets
│   │   ├── settings.ts    # GET/PUT /api/settings
│   │   ├── models.ts      # GET /api/models
│   │   ├── health.ts     # GET /api/health
│   │   ├── translate.ts   # POST /api/translate
│   │   ├── telegram/      # Telegram Webhook
│   │   └── discord/       # Discord Interaction
│   ├── utils/            # 工具模块
│   │   ├── sources/       # 20 个数据源适配器
│   │   ├── sweep/         # 扫描编排 + 数据合成
│   │   ├── delta/         # 增量计算引擎
│   │   ├── llm/           # LLM 集成层（8 提供商）
│   │   ├── alerts/        # 告警系统
│   │   ├── bots/          # Bot 逻辑
│   │   └── utils/         # 工具函数
│   └── workers/           # Worker 相关
│       └── cron-sweep.ts  # Cron Trigger 定时扫描
├── public/               # 静态资源
│   ├── index.html         # 主仪表盘
│   ├── settings.html      # 设置页面
│   ├── css/               # 样式（Jarvis 风格）
│   ├── js/                # 前端模块
│   └── locales/           # i18n 翻译文件
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions 部署配置
├── wrangler.toml         # Cloudflare Workers 配置
└── tsconfig.json         # TypeScript 配置
```

### 技术栈

| 组件 | 技术 |
|------|------|
| 前端框架 | Vanilla JS（零依赖） |
| 3D 可视化 | Globe.gl |
| 地图 | Leaflet + CartoDB Dark Matter |
| 后端 | Cloudflare Workers |
| 数据存储 | Cloudflare KV |
| 定时任务 | Workers Cron Triggers |
| Bot | Telegram Webhook / Discord Interaction |
| 类型检查 | TypeScript（strict 模式） |
| 运行环境 | Cloudflare Workers |

---

## ⚠️ 代币/资产声明

> [!WARNING]
> **Crucix CF Workers 未发行任何官方代币、币种、NFT、空投、预售或任何区块链资产。**
> 任何使用 Crucix 名称、Logo 或品牌标识的代币或数字资产均与 Crucix 无关联或背书。
> 请勿购买、推广、连接钱包领取、签署交易或基于第三方帖子、DM 或网站发送资金。

---

## 📖 为什么要做这个

世界上大多数实时情报——卫星图像、辐射水平、冲突事件、经济指标、航班追踪、海事活动——都是公开的。只是分散在数十个政府 API、研究机构和开放数据源中，没有人有时间逐一检查。

Crucix 把它们汇聚到一处。不在付费墙后，不在企业平台中，不需要安全许可。只需开放数据，在你自己的机器上聚合和交叉关联，每 15 分钟更新一次。

为任何想了解世界正在发生什么的人而构建——研究人员、记者、交易员、OSINT 分析师，或者只是相信信息获取不应取决于预算的好奇者。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

[AGPL-3.0](LICENSE)
