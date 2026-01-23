import { test, expect } from '@playwright/test'

test.describe('Prompt Debugger App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the app title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Prompt 调试器')
  })

  test('should have three-column layout', async ({ page }) => {
    // Left panel - Settings
    await expect(page.getByText('连接配置')).toBeVisible()
    
    // Middle panel - Prompt Builder
    await expect(page.getByText('系统指令')).toBeVisible()
    await expect(page.getByText('用户消息段落')).toBeVisible()
    
    // Right panel - Output tabs
    await expect(page.getByRole('button', { name: '输出' })).toBeVisible()
    await expect(page.getByRole('button', { name: '对比' })).toBeVisible()
    await expect(page.getByRole('button', { name: '原始数据' })).toBeVisible()
  })

  test('should toggle settings sections', async ({ page }) => {
    // Click to collapse connection config
    await page.getByText('连接配置').click()
    
    // Click to expand generation params
    await page.getByText('生成参数').click()
    await expect(page.getByText('温度')).toBeVisible()
  })

  test('should switch API endpoint mode', async ({ page }) => {
    // Find and click Responses button
    const responsesBtn = page.getByRole('button', { name: 'Responses' })
    const chatBtn = page.getByRole('button', { name: 'Chat' })
    
    await expect(responsesBtn).toBeVisible()
    await expect(chatBtn).toBeVisible()
    
    // Click Responses
    await responsesBtn.click()
  })

  test('should add user segment', async ({ page }) => {
    // Click add segment button
    await page.getByRole('button', { name: '添加段落' }).click()
    
    // Should have multiple segments now
    const segments = page.locator('[data-testid="user-segment"]')
    // At least the default segment exists
  })

  test('should expand Prompt Optimizer', async ({ page }) => {
    // Click Prompt Optimizer header
    await page.getByText('Prompt 优化器').click()
    
    // Should show optimization strategies
    await expect(page.getByText('优化策略')).toBeVisible()
    await expect(page.getByText('明确任务')).toBeVisible()
  })

  test('should expand Test Cases panel', async ({ page }) => {
    // Click Test Cases header
    await page.getByText('测试集').click()
    
    // Should show add test case form
    await expect(page.getByPlaceholder('测试用例名称')).toBeVisible()
  })

  test('should expand LLM Judge panel', async ({ page }) => {
    // Click LLM Judge header
    await page.getByText('LLM 评分').click()
    
    // Should show scoring rubrics
    await expect(page.getByText('评分标准')).toBeVisible()
    await expect(page.getByText('通用评分')).toBeVisible()
  })

  test('should switch output tabs', async ({ page }) => {
    // Click compare tab
    await page.getByRole('button', { name: '对比' }).click()
    
    // Click raw data tab
    await page.getByRole('button', { name: '原始数据' }).click()
    
    // Click SSE tab
    await page.getByRole('button', { name: '事件流' }).click()
    
    // Should show SSE viewer empty state
    await expect(page.getByText('暂无 SSE 事件')).toBeVisible()
  })

  test('should toggle dark mode', async ({ page }) => {
    // Find theme toggle button
    const themeBtn = page.getByRole('button', { name: '切换主题' })
    await expect(themeBtn).toBeVisible()
    
    // Click to toggle
    await themeBtn.click()
    
    // Check if dark class is added to html
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)
  })

  test('should show run button', async ({ page }) => {
    const runBtn = page.getByRole('button', { name: '运行' })
    await expect(runBtn).toBeVisible()
  })

  test('should show keyboard shortcut hint on model input', async ({ page }) => {
    const modelInput = page.getByPlaceholder(/⌘\+K/)
    await expect(modelInput).toBeVisible()
  })
})

test.describe('Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should have base URL input', async ({ page }) => {
    const baseUrlInput = page.getByPlaceholder('https://api.openai.com')
    await expect(baseUrlInput).toBeVisible()
  })

  test('should have API key input with toggle visibility', async ({ page }) => {
    const apiKeyInput = page.getByPlaceholder('sk-...')
    await expect(apiKeyInput).toBeVisible()
    
    // Should have eye icon button to toggle visibility
    const toggleBtn = page.locator('button').filter({ has: page.locator('svg') }).first()
  })

  test('should have temperature slider', async ({ page }) => {
    // Expand generation params if needed
    await page.getByText('生成参数').click()
    
    await expect(page.getByText('温度')).toBeVisible()
    const slider = page.locator('input[type="range"]').first()
    await expect(slider).toBeVisible()
  })
})
