# prompt_tsc - Spec-Driven Development Project

## 🌱 项目概述

这是一个基于 GitHub Spec-Kit 的规范驱动开发项目。

## 🚀 快速开始

### 1. 配置 API（首次使用必须）

本项目需要配置 API 才能正常使用。有两种配置方式：

#### 方式一：在应用内配置（推荐）
1. 启动应用后，在设置面板中填入：
   - API Base URL（如：`https://api.openai.com`）
   - API Key（你的 API 密钥）
   - Model ID（如：`gpt-4`）
2. 配置会自动保存在浏览器 localStorage 中

#### 方式二：使用环境变量（可选）
1. 复制 `.env.example` 为 `.env`
2. 填入你的实际配置
3. 重启开发服务器

**⚠️ 安全提醒**：
- 请勿将包含真实 API Key 的 `.env` 文件提交到 Git
- `.gitignore` 已配置忽略 `.env` 文件

### 2. 使用 Windsurf AI 助手

在 Windsurf 中，您可以使用以下斜杠命令来进行规范驱动开发：

- `/speckit.constitution` - 创建项目治理原则和开发指南
- `/speckit.specify` - 描述您想要构建的内容（专注于"什么"和"为什么"）
- `/speckit.plan` - 提供技术栈和架构选择
- `/speckit.tasks` - 从实施计划创建可操作的任务列表
- `/speckit.implement` - 执行所有任务并根据计划构建功能

### 3. 开发流程

1. **建立项目原则** - 使用 `/speckit.constitution` 创建指导原则
2. **创建规范** - 使用 `/speckit.specify` 描述功能需求
3. **技术实施计划** - 使用 `/speckit.plan` 制定技术方案
4. **任务分解** - 使用 `/speckit.tasks` 创建任务清单
5. **执行实施** - 使用 `/speckit.implement` 开始开发

## 📁 项目结构

```
prompt_tsc/
├── README.md                 # 项目说明文档
├── .windsurf/               # Windsurf IDE 配置
├── docs/                    # 项目文档
│   ├── constitution.md      # 项目治理原则
│   ├── specification.md     # 功能规范
│   └── plan.md             # 技术实施计划
└── src/                    # 源代码目录
```

## 🔧 工具

- **Spec-Kit CLI**: 已安装 v0.0.22
- **AI 助手**: Windsurf (推荐)
- **开发方法**: Spec-Driven Development

## 📚 更多资源

- [Spec-Kit GitHub 仓库](https://github.com/github/spec-kit)
- [规范驱动开发指南](https://github.com/github/spec-kit/blob/main/spec-driven.md)

---

**开始您的规范驱动开发之旅！** 🚀
