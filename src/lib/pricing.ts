// 模型定价配置（单位：美元 / 1M tokens）
export interface ModelPricing {
  inputPrice: number  // 输入价格
  outputPrice: number // 输出价格
  cachedPrice?: number // 缓存价格（可选）
}

// OpenAI 官方定价（2024 年数据，可能需要更新）
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT-4o 系列
  'gpt-4o': { inputPrice: 2.5, outputPrice: 10, cachedPrice: 1.25 },
  'gpt-4o-mini': { inputPrice: 0.15, outputPrice: 0.6, cachedPrice: 0.075 },
  'gpt-4o-2024-11-20': { inputPrice: 2.5, outputPrice: 10, cachedPrice: 1.25 },
  'gpt-4o-2024-08-06': { inputPrice: 2.5, outputPrice: 10, cachedPrice: 1.25 },
  
  // GPT-4 Turbo
  'gpt-4-turbo': { inputPrice: 10, outputPrice: 30 },
  'gpt-4-turbo-preview': { inputPrice: 10, outputPrice: 30 },
  
  // GPT-4
  'gpt-4': { inputPrice: 30, outputPrice: 60 },
  'gpt-4-32k': { inputPrice: 60, outputPrice: 120 },
  
  // GPT-3.5
  'gpt-3.5-turbo': { inputPrice: 0.5, outputPrice: 1.5 },
  'gpt-3.5-turbo-16k': { inputPrice: 3, outputPrice: 4 },
  
  // o1 系列（推理模型）
  'o1': { inputPrice: 15, outputPrice: 60, cachedPrice: 7.5 },
  'o1-mini': { inputPrice: 3, outputPrice: 12, cachedPrice: 1.5 },
  'o1-preview': { inputPrice: 15, outputPrice: 60 },
  
  // o3 系列
  'o3-mini': { inputPrice: 1.1, outputPrice: 4.4, cachedPrice: 0.55 },
  
  // Claude 系列（Anthropic）
  'claude-3-5-sonnet-20241022': { inputPrice: 3, outputPrice: 15, cachedPrice: 0.3 },
  'claude-3-5-haiku-20241022': { inputPrice: 0.8, outputPrice: 4, cachedPrice: 0.08 },
  'claude-3-opus-20240229': { inputPrice: 15, outputPrice: 75, cachedPrice: 1.5 },
  
  // DeepSeek 系列
  'deepseek-chat': { inputPrice: 0.14, outputPrice: 0.28, cachedPrice: 0.014 },
  'deepseek-reasoner': { inputPrice: 0.55, outputPrice: 2.19 },
  'deepseek-ai/deepseek-v3.1-terminus': { inputPrice: 0.14, outputPrice: 0.28 },
  
  // Moonshot
  'moonshot-v1-8k': { inputPrice: 0.85, outputPrice: 0.85 },
  'moonshot-v1-32k': { inputPrice: 1.7, outputPrice: 1.7 },
  'moonshot-v1-128k': { inputPrice: 4.25, outputPrice: 4.25 },
}

// 默认定价（未知模型）
const DEFAULT_PRICING: ModelPricing = {
  inputPrice: 1,
  outputPrice: 2,
}

/**
 * 获取模型定价
 */
export function getModelPricing(modelId: string): ModelPricing {
  // 精确匹配
  if (MODEL_PRICING[modelId]) {
    return MODEL_PRICING[modelId]
  }
  
  // 模糊匹配（处理版本号后缀）
  const baseModel = modelId.split('-').slice(0, 3).join('-')
  if (MODEL_PRICING[baseModel]) {
    return MODEL_PRICING[baseModel]
  }
  
  // 前缀匹配
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelId.startsWith(key) || key.startsWith(modelId)) {
      return pricing
    }
  }
  
  return DEFAULT_PRICING
}

/**
 * 计算成本（美元）
 */
export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
  cachedTokens: number = 0
): {
  inputCost: number
  outputCost: number
  cachedCost: number
  totalCost: number
  pricePerMillion: ModelPricing
} {
  const pricing = getModelPricing(modelId)
  
  // 计算实际输入 token（减去缓存命中的）
  const actualInputTokens = promptTokens - cachedTokens
  
  // 计算成本（转换为美元，定价是每百万 token）
  const inputCost = (actualInputTokens / 1_000_000) * pricing.inputPrice
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPrice
  const cachedCost = pricing.cachedPrice 
    ? (cachedTokens / 1_000_000) * pricing.cachedPrice 
    : 0
  
  return {
    inputCost,
    outputCost,
    cachedCost,
    totalCost: inputCost + outputCost + cachedCost,
    pricePerMillion: pricing,
  }
}

/**
 * 格式化成本显示
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return '< $0.0001'
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`
  }
  if (cost < 1) {
    return `$${cost.toFixed(3)}`
  }
  return `$${cost.toFixed(2)}`
}

/**
 * 格式化成本详情
 */
export function formatCostBreakdown(
  modelId: string,
  promptTokens: number,
  completionTokens: number,
  cachedTokens: number = 0
): string {
  const { inputCost, outputCost, cachedCost, totalCost, pricePerMillion } = calculateCost(
    modelId,
    promptTokens,
    completionTokens,
    cachedTokens
  )
  
  let breakdown = `输入: ${formatCost(inputCost)} (${promptTokens - cachedTokens} tokens @ $${pricePerMillion.inputPrice}/M)`
  breakdown += `\n输出: ${formatCost(outputCost)} (${completionTokens} tokens @ $${pricePerMillion.outputPrice}/M)`
  
  if (cachedTokens > 0 && pricePerMillion.cachedPrice) {
    breakdown += `\n缓存: ${formatCost(cachedCost)} (${cachedTokens} tokens @ $${pricePerMillion.cachedPrice}/M)`
  }
  
  breakdown += `\n总计: ${formatCost(totalCost)}`
  
  return breakdown
}
