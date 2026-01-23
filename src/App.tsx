import { useState, useEffect, useCallback } from 'react'
import { Layout } from './components/layout/Layout'
import { SettingsPanel } from './components/params/SettingsPanel'
import { PromptBuilder } from './components/prompt/PromptBuilder'
import { PromptLint } from './components/prompt/PromptLint'
import { OutputPanel } from './components/output/OutputPanel'

function App() {
  const [activeTab, setActiveTab] = useState<'output' | 'compare' | 'raw'>('output')

  // 键盘快捷键支持
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd/Ctrl + Enter: 运行
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      const runButton = document.querySelector('[data-run-button]') as HTMLButtonElement
      if (runButton && !runButton.disabled) {
        runButton.click()
      }
    }
    // Cmd/Ctrl + K: 聚焦到模型输入框
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      const modelInput = document.querySelector('[data-model-input]') as HTMLInputElement
      if (modelInput) {
        modelInput.focus()
        modelInput.select()
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <Layout>
      <div className="flex h-full">
        {/* Left Panel - Settings */}
        <div className="w-80 border-r border-border/50 overflow-y-auto backdrop-blur-sm bg-white/40 dark:bg-black/20">
          <SettingsPanel />
        </div>

        {/* Right Panel - Prompt + Output */}
        <div className="flex-1 flex flex-col min-w-0 bg-white/30 dark:bg-black/10 backdrop-blur-sm">
          {/* Prompt Builder */}
          <div className="flex-1 overflow-y-auto border-b border-border/50">
            <PromptBuilder />
            <PromptLint />
          </div>

          {/* Output Panel */}
          <div className="h-[40%] min-h-[200px] bg-white/50 dark:bg-black/30 backdrop-blur-sm">
            <OutputPanel activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default App
