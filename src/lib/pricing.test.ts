import { describe, it, expect } from 'vitest'
import { getModelPricing, calculateCost, formatCost } from './pricing'

describe('getModelPricing', () => {
  it('should return exact match pricing', () => {
    const pricing = getModelPricing('gpt-4o')
    expect(pricing.inputPrice).toBe(2.5)
    expect(pricing.outputPrice).toBe(10)
  })

  it('should return pricing for gpt-4o-mini', () => {
    const pricing = getModelPricing('gpt-4o-mini')
    expect(pricing.inputPrice).toBe(0.15)
    expect(pricing.outputPrice).toBe(0.6)
  })

  it('should return default pricing for unknown model', () => {
    const pricing = getModelPricing('unknown-model-xyz')
    expect(pricing.inputPrice).toBeDefined()
    expect(pricing.outputPrice).toBeDefined()
  })

  it('should handle deepseek models', () => {
    const pricing = getModelPricing('deepseek-chat')
    expect(pricing.inputPrice).toBe(0.14)
    expect(pricing.outputPrice).toBe(0.28)
  })
})

describe('calculateCost', () => {
  it('should calculate cost correctly', () => {
    const result = calculateCost('gpt-4o', 1000, 500, 0)
    
    // 1000 input tokens at $2.5/M = $0.0025
    // 500 output tokens at $10/M = $0.005
    expect(result.inputCost).toBeCloseTo(0.0025, 6)
    expect(result.outputCost).toBeCloseTo(0.005, 6)
    expect(result.totalCost).toBeCloseTo(0.0075, 6)
  })

  it('should handle cached tokens', () => {
    const result = calculateCost('gpt-4o', 1000, 500, 200)
    
    // 800 actual input tokens at $2.5/M = $0.002
    // 200 cached tokens at $1.25/M = $0.00025
    // 500 output tokens at $10/M = $0.005
    expect(result.inputCost).toBeCloseTo(0.002, 6)
    expect(result.cachedCost).toBeCloseTo(0.00025, 6)
    expect(result.totalCost).toBeCloseTo(0.00725, 6)
  })

  it('should return zero for zero tokens', () => {
    const result = calculateCost('gpt-4o', 0, 0, 0)
    expect(result.totalCost).toBe(0)
  })
})

describe('formatCost', () => {
  it('should format very small costs', () => {
    expect(formatCost(0.00001)).toBe('< $0.0001')
  })

  it('should format small costs with 4 decimals', () => {
    expect(formatCost(0.0025)).toBe('$0.0025')
  })

  it('should format medium costs with 3 decimals', () => {
    expect(formatCost(0.125)).toBe('$0.125')
  })

  it('should format large costs with 2 decimals', () => {
    expect(formatCost(1.5)).toBe('$1.50')
  })
})
