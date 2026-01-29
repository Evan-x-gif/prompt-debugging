import { test, expect } from '@playwright/test'

test.describe('SSE Event Flow Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    
    // 等待页面加载
    await page.waitForLoadState('networkidle')
  })

  test('should display SSE events when running a streaming request', async ({ page }) => {
    // 1. 检查初始状态
    await expect(page.locator('h1')).toContainText('Prompt 调试器')
    
    // 2. 检查是否有运行按钮
    const runButton = page.locator('button:has-text("运行")')
    await expect(runButton).toBeVisible()
    
    // 3. 切换到事件流标签页
    const sseTab = page.locator('button:has-text("事件流")')
    await sseTab.click()
    
    // 4. 检查初始状态（应该显示"暂无 SSE 事件"）
    await expect(page.getByText('暂无 SSE 事件')).toBeVisible()
    
    // 5. 点击运行按钮（如果模型已配置）
    const isRunButtonEnabled = await runButton.isEnabled()
    
    if (isRunButtonEnabled) {
      console.log('[TEST] 运行按钮已启用，开始测试...')
      
      // 点击运行
      await runButton.click()
      
      // 等待请求开始（按钮变为"停止"）
      await expect(page.locator('button:has-text("停止")')).toBeVisible({ timeout: 5000 })
      
      // 等待一段时间让 SSE 事件产生
      await page.waitForTimeout(2000)
      
      // 切换到事件流标签页（如果不在）
      await sseTab.click()
      
      // 检查是否有事件显示
      const eventCount = page.locator('.event, [class*="event"]')
      const count = await eventCount.count()
      
      console.log('[TEST] SSE 事件数量:', count)
      
      // 应该至少有一些事件
      expect(count).toBeGreaterThan(0)
      
      // 检查事件流标题
      await expect(page.getByText('SSE 事件流')).toBeVisible()
      
      // 检查事件计数显示
      await expect(page.locator('text=/\\d+ 事件/')).toBeVisible()
    } else {
      console.log('[TEST] 运行按钮未启用，跳过实际请求测试')
      console.log('[TEST] 请配置 API 后手动测试')
    }
  })

  test('should show console logs for SSE events', async ({ page }) => {
    // 监听控制台日志
    const consoleLogs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      consoleLogs.push(text)
      if (text.includes('[API]') || text.includes('[DEBUG]') || text.includes('[runStore]')) {
        console.log('[BROWSER]', text)
      }
    })
    
    // 切换到事件流标签页
    const sseTab = page.locator('button:has-text("事件流")')
    await sseTab.click()
    
    // 检查运行按钮
    const runButton = page.locator('button:has-text("运行")')
    const isEnabled = await runButton.isEnabled()
    
    if (isEnabled) {
      // 点击运行
      await runButton.click()
      
      // 等待一段时间
      await page.waitForTimeout(3000)
      
      // 检查是否有 SSE 相关的日志
      const sseLogCount = consoleLogs.filter(log => 
        log.includes('SSE') || 
        log.includes('onSSEEvent') || 
        log.includes('addSSEEvent')
      ).length
      
      console.log('[TEST] SSE 相关日志数量:', sseLogCount)
      console.log('[TEST] 所有日志:', consoleLogs.filter(log => 
        log.includes('[API]') || log.includes('[DEBUG]') || log.includes('[runStore]')
      ))
      
      // 应该有 SSE 相关的日志
      expect(sseLogCount).toBeGreaterThan(0)
    } else {
      console.log('[TEST] 运行按钮未启用，跳过日志测试')
    }
  })
})
