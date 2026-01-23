# Prompt Debugger 开发路线图

## 当前版本：v0.1.0 (MVP)

### 已完成功能
- [x] 连接配置（Base URL + API Key + Model）
- [x] API 类型切换（Responses / Chat Completions）
- [x] Prompt 多段拼接 + 变量注入
- [x] 基础参数（temperature, top_p, max_tokens, stream）
- [x] Run / Stop（流式支持）
- [x] 输出展示（渲染 + 原文）
- [x] Raw Request/Response + cURL
- [x] 历史记录（IndexedDB）
- [x] A/B 对比（基础版）
- [x] Prompt Lint
- [x] 键盘快捷键

---

## v0.2.0 - 参数完善 + 结构化输出

### Phase 1: 高级参数补全 (P0)

#### 1.1 Responses API 参数
- [ ] `truncation`: auto/disabled（超上下文处理）
- [ ] `seed`: 确定性输出（Beta）
- [ ] `stop`: 停止序列
- [ ] `store`: 是否存储响应
- [ ] `previous_response_id`: 多轮对话串联

#### 1.2 Chat Completions 参数
- [ ] `n`: 生成多个候选
- [ ] `stop`: 停止序列
- [ ] `seed`: 确定性输出
- [ ] `logprobs` / `top_logprobs`: token 概率
- [ ] `logit_bias`: token 偏置
- [ ] `presence_penalty` / `frequency_penalty`: ✅ 已有
- [ ] `reasoning_effort`: 推理强度
- [ ] `verbosity`: 输出冗长程度

#### 1.3 UI 改进
- [ ] 参数分组折叠（常用 / 高级 / 结构化 / 工具）
- [ ] 参数说明 tooltip
- [ ] 模型兼容性提示（如 stop 不支持 o3/o4-mini）

### Phase 2: 结构化输出 UI (P0)

#### 2.1 JSON Schema 编辑器
- [ ] Monaco Editor 集成（JSON 语法高亮）
- [ ] Schema 模板库（常用结构快速选择）
- [ ] Schema 验证（实时检查语法）
- [ ] strict 模式开关

#### 2.2 输出校验
- [ ] 响应 JSON 自动校验 schema
- [ ] 校验失败标红 + 错误提示
- [ ] 一键修复建议

### Phase 3: 工具调用 UI (P1)

#### 3.1 Tools 编辑器
- [ ] 工具定义 JSON 编辑
- [ ] 工具模板库
- [ ] tool_choice 策略选择
- [ ] parallel_tool_calls 开关

#### 3.2 工具调用可视化
- [ ] tool_calls 结构化展示
- [ ] 手动注入工具返回（调试用）
- [ ] 工具调用链回放

---

## v0.3.0 - Prompt Optimizer

### Phase 4: 可配置 Prompt 优化器 (P1)

#### 4.1 优化策略开关
- [ ] 明确任务：补齐角色、目标、边界条件
- [ ] 补约束：输出格式、禁用项、长度、语气
- [ ] 补示例：few-shot（可选）
- [ ] 补自检：让模型在输出前检查
- [ ] 结构化输出：自动生成 json_schema
- [ ] 稳健性：缺参处理、不确定回答

#### 4.2 优化器输出（结构化）
```json
{
  "optimized_prompt": "改写后的 prompt",
  "diff_summary": ["改动1", "改动2"],
  "risk_flags": ["可能改变语义"],
  "test_suggestions": ["建议测试用例"]
}
```

#### 4.3 对比与回滚
- [ ] 原 prompt vs 优化 prompt diff
- [ ] 同参数下：Run 原版 vs Run 优化版
- [ ] 一键回滚（保留原文）

### Phase 5: Usage 详细展示 (P0)

- [ ] prompt_tokens / completion_tokens / total_tokens
- [ ] 耗时（首 token 延迟 + 总耗时）
- [ ] finish_reason
- [ ] 成本估算（按模型定价）
- [ ] cache 命中提示

---

## v0.4.0 - 平台化能力

### Phase 6: 测试集与矩阵跑分 (P1)

- [ ] Test Cases：同一 prompt 跑一组输入样例
- [ ] 多模型矩阵：gpt-4.1 vs gpt-5
- [ ] 多参数矩阵：temperature 0.2 vs 0.8
- [ ] 结果汇总表格

### Phase 7: LLM-as-Judge 自动评分 (P2)

- [ ] 定义评分 rubric
- [ ] 让模型对输出打分
- [ ] 评分历史趋势

### Phase 8: SSE 事件流查看 (P1)

- [ ] 实时显示 SSE 事件
- [ ] 事件类型过滤
- [ ] 事件时间线

---

## 技术债务

- [ ] 单元测试覆盖
- [ ] E2E 测试（Playwright）
- [ ] 错误边界处理
- [ ] 性能优化（大历史记录）
- [ ] 国际化支持

---

## 数据结构定义

### PromptSegment
```typescript
interface PromptSegment {
  id: string
  role: 'system' | 'developer' | 'user' | 'assistant'
  enabled: boolean
  content: string
  title?: string
  mimeType?: string
}
```

### RunConfig
```typescript
interface RunConfig {
  apiType: 'responses' | 'chat'
  baseUrl: string
  model: string
  params: ParamsDraft
  segments: PromptSegment[]
  variables: Record<string, string>
}
```

### RunRecord
```typescript
interface RunRecord {
  id: string
  createdAt: string
  requestJson: object
  responseJson: object | null
  outputText: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  latencyMs: number
  firstTokenMs?: number
  finishReason?: string
  error: string | null
}
```

### CompareSession
```typescript
interface CompareSession {
  runAId: string
  runBId: string
  diffMode: 'line' | 'word' | 'json'
}
```
