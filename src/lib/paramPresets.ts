import type { ParamsDraft } from '@/types'

/**
 * 参数预设配置
 * 根据模型类型提供最佳参数配置
 * 
 * 注意：所有预设都包含完整的参数配置，确保聚合 API 兼容性
 * 不支持的参数（如 presencePenalty、frequencyPenalty 等）设为默认值（0 或 false）
 */

/**
 * 语言模型预设（文本生成）
 * 适用于：GPT-4、Claude、Gemini 等纯文本模型
 * 特点：平衡创造性和准确性，适合对话和内容生成
 */
export const languageModelPreset: ParamsDraft = {
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 4096,
  stream: true,
  stop: [],
  seed: null,
  // 聚合 API 通常不支持以下参数，设为默认值
  presencePenalty: 0,
  frequencyPenalty: 0,
  n: 1,
  logprobs: false,
  topLogprobs: null,
  logitBias: {},
  truncation: 'auto',
  store: false,
  previousResponseId: '',
  reasoningEffort: null,
  structuredOutput: {
    enabled: false,
    schemaJson: '{}',
    strict: true,
  },
  tools: {
    enabled: false,
    toolJson: '[]',
    toolChoice: 'auto',
    parallelToolCalls: true,
  },
}

/**
 * 视觉模型预设（多模态）
 * 适用于：GPT-4V、Claude 3、Gemini Pro Vision 等支持图像的模型
 * 特点：较低温度保证准确性，适合图像理解和分析
 */
export const visionModelPreset: ParamsDraft = {
  temperature: 0.3,
  topP: 0.8,
  maxOutputTokens: 2048,
  stream: true,
  stop: [],
  seed: null,
  // 聚合 API 通常不支持以下参数，设为默认值
  presencePenalty: 0,
  frequencyPenalty: 0,
  n: 1,
  logprobs: false,
  topLogprobs: null,
  logitBias: {},
  truncation: 'auto',
  store: false,
  previousResponseId: '',
  reasoningEffort: null,
  structuredOutput: {
    enabled: false,
    schemaJson: '{}',
    strict: true,
  },
  tools: {
    enabled: false,
    toolJson: '[]',
    toolChoice: 'auto',
    parallelToolCalls: true,
  },
}

/**
 * 推理模型预设（深度思考）
 * 适用于：o1、o3、gpt-5 等推理模型
 * 特点：启用推理模式，适合复杂问题求解
 */
export const reasoningModelPreset: ParamsDraft = {
  temperature: 1,
  topP: 1,
  maxOutputTokens: 8192,
  stream: true,
  stop: [],
  seed: null,
  reasoningEffort: 'medium',
  // 推理模型通常不支持以下参数，设为默认值
  presencePenalty: 0,
  frequencyPenalty: 0,
  n: 1,
  logprobs: false,
  topLogprobs: null,
  logitBias: {},
  truncation: 'auto',
  store: false,
  previousResponseId: '',
  structuredOutput: {
    enabled: false,
    schemaJson: '{}',
    strict: true,
  },
  tools: {
    enabled: false,
    toolJson: '[]',
    toolChoice: 'auto',
    parallelToolCalls: true,
  },
}

/**
 * 精确输出预设（结构化数据）
 * 适用于：需要 JSON 输出、数据提取等场景
 * 特点：低温度保证稳定性，适合结构化输出
 */
export const preciseOutputPreset: ParamsDraft = {
  temperature: 0.2,
  topP: 0.8,
  maxOutputTokens: 4096,
  stream: false,
  stop: [],
  seed: null,
  // 聚合 API 通常不支持以下参数，设为默认值
  presencePenalty: 0,
  frequencyPenalty: 0,
  n: 1,
  logprobs: false,
  topLogprobs: null,
  logitBias: {},
  truncation: 'auto',
  store: false,
  previousResponseId: '',
  reasoningEffort: null,
  structuredOutput: {
    enabled: false,
    schemaJson: '{}',
    strict: true,
  },
  tools: {
    enabled: false,
    toolJson: '[]',
    toolChoice: 'auto',
    parallelToolCalls: true,
  },
}

/**
 * 创意生成预设（内容创作）
 * 适用于：故事创作、营销文案、创意写作等
 * 特点：高温度增强创造性和多样性
 */
export const creativePreset: ParamsDraft = {
  temperature: 1.2,
  topP: 0.95,
  maxOutputTokens: 8192,
  stream: true,
  stop: [],
  seed: null,
  // 聚合 API 通常不支持以下参数，设为默认值（避免报错）
  presencePenalty: 0,
  frequencyPenalty: 0,
  n: 1,
  logprobs: false,
  topLogprobs: null,
  logitBias: {},
  truncation: 'auto',
  store: false,
  previousResponseId: '',
  reasoningEffort: null,
  structuredOutput: {
    enabled: false,
    schemaJson: '{}',
    strict: true,
  },
  tools: {
    enabled: false,
    toolJson: '[]',
    toolChoice: 'auto',
    parallelToolCalls: true,
  },
}

/**
 * 预设配置映射
 */
export const presetConfigs = {
  language: {
    name: '语言模型',
    description: '适合对话和文本生成，平衡创造性和准确性',
    params: languageModelPreset,
    icon: '💬',
  },
  vision: {
    name: '视觉模型',
    description: '适合图像理解和分析，注重准确性',
    params: visionModelPreset,
    icon: '👁️',
  },
  reasoning: {
    name: '推理模型',
    description: '适合复杂问题求解，启用深度思考',
    params: reasoningModelPreset,
    icon: '🧠',
  },
  precise: {
    name: '精确输出',
    description: '适合结构化数据和 JSON 输出',
    params: preciseOutputPreset,
    icon: '🎯',
  },
  creative: {
    name: '创意生成',
    description: '适合内容创作和营销文案',
    params: creativePreset,
    icon: '✨',
  },
} as const

export type PresetType = keyof typeof presetConfigs

/**
 * 获取预设配置
 */
export function getPresetParams(presetType: PresetType): ParamsDraft {
  return { ...presetConfigs[presetType].params }
}

/**
 * 获取所有预设列表
 */
export function getAllPresets() {
  return Object.entries(presetConfigs).map(([key, config]) => ({
    type: key as PresetType,
    ...config,
  }))
}
