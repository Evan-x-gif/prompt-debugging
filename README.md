# Prompt Debugger

一个强大的 Prompt 调试工具，支持 OpenAI Responses API 和 Chat Completions API，提供 Prompt 多段拼接、流式输出、参数调优、历史对比等功能。

## ✨ 功能特性

- 🔌 **双 API 支持**：Responses API + Chat Completions API
- 📝 **Prompt 编辑器**：支持 system/developer 指令、多段用户消息、助手预设
- 🖼️ **多模态支持**：支持图片上传（粘贴/拖拽）
- 🎛️ **参数调优**：温度、Top P、最大 Token、流式输出等
- 📊 **输出对比**：Monaco Diff Editor 对比不同版本
- 🔄 **流式输出**：SSE 事件流实时显示
- 💾 **历史记录**：IndexedDB 持久化存储
- 🧪 **测试功能**：测试集批量运行、LLM 自动评分
- 🎨 **现代 UI**：TailwindCSS + 明暗主题切换
- �� **安全配置**：无硬编码 API Key，支持代理模式

## 📋 系统要求

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **浏览器**: Chrome/Edge/Firefox（最新版本）

## 🚀 快速开始

### 1. 克隆项目

\`\`\`bash
git clone git@github.com:952033053/prompt-debugging.git
cd prompt-debugging
\`\`\`

### 2. 安装依赖

\`\`\`bash
# 安装前端依赖
npm install

# （可选）安装代理服务器依赖
cd server
npm install
cd ..
\`\`\`

### 3. 配置 API

本项目需要配置 API 才能正常使用。有两种配置方式：

#### 方式一：在应用内配置（推荐）

1. 启动应用后，在设置面板中填入：
   - **API Base URL**（如：\`https://api.openai.com\`）
   - **API Key**（你的 API 密钥）
   - **Model ID**（如：\`gpt-4\`）
2. 配置会自动保存在浏览器 localStorage 中

#### 方式二：使用环境变量（可选）

1. 复制 \`.env.example\` 为 \`.env\`
2. 填入你的实际配置
3. 重启开发服务器

**⚠️ 安全提醒**：
- 请勿将包含真实 API Key 的 \`.env\` 文件提交到 Git
- \`.gitignore\` 已配置忽略 \`.env\` 文件

### 4. 启动应用

\`\`\`bash
# 启动前端开发服务器
npm run dev

# （可选）启动代理服务器（解决 CORS 问题）
npm run server
\`\`\`

应用将在 \`http://localhost:5173\` 启动。

## 📦 可用命令

### 开发命令

\`\`\`bash
npm run dev          # 启动开发服务器（Vite）
npm run server       # 启动代理服务器（可选）
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # 运行 ESLint 检查
\`\`\`

### 测试命令

\`\`\`bash
npm test             # 运行单元测试（watch 模式）
npm run test:run     # 运行单元测试（单次）
npm run test:coverage # 生成测试覆盖率报告
npm run test:e2e     # 运行 E2E 测试
npm run test:e2e:ui  # E2E 测试 UI 模式
\`\`\`

## 📁 项目结构

\`\`\`
prompt-debugging/
├── src/
│   ├── components/       # React 组件
│   │   ├── layout/       # 布局组件
│   │   ├── params/       # 参数配置面板
│   │   ├── prompt/       # Prompt 编辑器
│   │   ├── output/       # 输出展示
│   │   ├── optimizer/    # Prompt 优化器
│   │   └── testing/      # 测试相关
│   ├── stores/           # Zustand 状态管理
│   ├── lib/              # 工具函数和 API
│   ├── types/            # TypeScript 类型定义
│   └── test/             # 测试配置
├── server/               # 代理服务器（可选）
├── e2e/                  # E2E 测试
├── docs/                 # 项目文档
├── .env.example          # 环境变量模板
├── SECURITY.md           # 安全说明
└── README.md             # 项目说明
\`\`\`

## 🔧 技术栈

### 前端

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **状态管理**: Zustand
- **样式**: TailwindCSS
- **代码编辑器**: Monaco Editor
- **数据持久化**: IndexedDB (idb)
- **Markdown 渲染**: react-markdown
- **图标**: Lucide React

### 开发工具

- **测试框架**: Vitest + Playwright
- **代码检查**: ESLint
- **类型检查**: TypeScript

### 后端（可选）

- **代理服务器**: Express + http-proxy-middleware

## 🌐 代理模式

如果遇到 CORS 问题，可以使用内置的代理服务器：

1. 安装代理服务器依赖：
   \`\`\`bash
   cd server
   npm install
   \`\`\`

2. 启动代理服务器：
   \`\`\`bash
   npm run server
   \`\`\`

3. 在应用设置中启用"代理模式"

代理服务器将运行在 \`http://localhost:3001\`

## 📖 使用指南

### 基本工作流程

1. **配置连接**：在左侧设置面板配置 API 信息
2. **编写 Prompt**：在中间编辑器编写 system 指令和 user 消息
3. **调整参数**：设置温度、Top P、最大 Token 等参数
4. **运行测试**：点击"运行"按钮或按 ⌘+Enter
5. **查看输出**：在右侧查看模型响应和原始数据
6. **对比版本**：使用历史记录功能对比不同版本的输出

### 高级功能

- **多段 Prompt**：将复杂 Prompt 拆分为多个段落管理
- **变量系统**：使用 \`{{变量名}}\` 语法创建可复用的 Prompt 模板
- **图片支持**：直接粘贴或拖拽图片到编辑器
- **Prompt 优化**：使用 AI 优化你的 Prompt
- **测试集**：批量测试多个输入场景
- **LLM 评分**：使用 LLM 自动评估输出质量

## 🔐 安全性

- ✅ 无硬编码的 API Key
- ✅ 配置保存在浏览器 localStorage（不会提交到 Git）
- ✅ 支持环境变量配置
- ✅ 代理模式保护 API Key

详见 [SECURITY.md](./SECURITY.md)

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (\`git checkout -b feature/AmazingFeature\`)
3. 提交更改 (\`git commit -m 'Add some AmazingFeature'\`)
4. 推送到分支 (\`git push origin feature/AmazingFeature\`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

- [OpenAI](https://openai.com/) - API 支持
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [TailwindCSS](https://tailwindcss.com/) - CSS 框架
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理

---

**开始你的 Prompt 调试之旅！** 🚀
