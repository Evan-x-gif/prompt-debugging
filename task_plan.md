# Task Plan: Prompt Debugger SPA

## Goal
构建一个单页面 Prompt 调试器，支持 OpenAI Responses API，提供 Prompt 多段拼接、原始请求查看、输出对比等功能。

## Current Phase
Phase 5 - Complete

## Phases

### Phase 1: 项目初始化
- [x] 创建规划文件
- [x] 初始化 Vite + React + TypeScript
- [x] 安装依赖（zustand, monaco-editor, idb, lucide-react）
- [x] 配置 TailwindCSS
- **Status:** complete

### Phase 2: 核心类型与状态
- [x] 定义 TypeScript 类型（WorkspaceConfig, PromptDraft, RunRecord）
- [x] 实现 Zustand stores（workspaceStore, promptStore, historyStore, runStore）
- [x] IndexedDB 持久化
- **Status:** complete

### Phase 3: API 层 + 编译器
- [x] Prompt 编译器（多段拼接 → messages）
- [x] API 请求层（Responses + Chat Completions）
- [x] SSE 流式处理
- [x] cURL 命令生成
- **Status:** complete

### Phase 4: UI 组件
- [x] 布局（左栏参数 + 右栏 Prompt + 底部输出）
- [x] 参数面板（连接配置 + 生成参数）
- [x] Prompt Builder（system/developer + user 多段 + assistant）
- [x] Output 面板 + Compare 视图
- [x] Raw Request/Response + Headers + cURL 查看
- **Status:** complete

### Phase 5: 代理服务 + 集成
- [x] Express 代理服务
- [x] 开发服务器启动
- [ ] 端到端测试（待用户验证）
- **Status:** complete

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| React + Vite + TypeScript | 现代前端栈，开发体验好 |
| shadcn/ui | 轻量现代，组件质量高 |
| Monaco Editor | 代码编辑体验最佳 |
| Zustand + IndexedDB | 轻量状态管理 + 大数据持久化 |
| 默认 Responses API | OpenAI 官方推荐 |
| 带代理模式 | 解决 CORS + Key 安全 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
