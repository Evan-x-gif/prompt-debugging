# Findings & Decisions

## Requirements
- OpenAI Responses API 支持（默认）+ Chat Completions 兼容
- 左栏：连接配置 + 参数面板
- 右栏：Prompt Builder（system/developer + user 多段 + assistant）
- 底部：Output + Compare + Raw I/O
- 支持流式 SSE
- x-request-id 等调试信息展示
- 输出对比（Diff）
- 提示词优化（V1.1）

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Responses API 默认 | OpenAI 推荐新项目优先用 |
| system/developer 可切换 | o1+ 模型用 developer 替代 system |
| user 多段编译为单 message | 默认策略，可配置为多 message |
| Monaco Diff Editor | Compare 视图用 |

## API Reference
- Responses: `POST /v1/responses`
  - model, input, instructions, max_output_tokens, temperature, top_p, stream, tools...
- Chat Completions: `POST /v1/chat/completions`
  - model, messages[], temperature, max_tokens, stream...

## Key Headers
- `x-request-id`: OpenAI 返回，用于调试
- `X-Client-Request-Id`: 前端生成，串联日志

## Resources
- OpenAI API Reference: https://platform.openai.com/docs/api-reference
- Responses API: https://platform.openai.com/docs/api-reference/responses
- Prompt Engineering: https://platform.openai.com/docs/guides/prompt-engineering
