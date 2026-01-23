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
        <div className="w-72 shrink-0 border-r border-border/50 overflow-y-auto backdrop-blur-sm bg-white/40 dark:bg-black/20">
          <SettingsPanel />
        </div>

        {/* Middle Panel - Prompt Builder */}
        <div className="flex-1 min-w-[400px] border-r border-border/50 overflow-y-auto bg-white/30 dark:bg-black/10 backdrop-blur-sm">
          <PromptBuilder />
          <PromptLint />
        </div>

        {/* Right Panel - Output */}
        <div className="w-[45%] min-w-[400px] shrink-0 overflow-hidden bg-white/50 dark:bg-black/30 backdrop-blur-sm">
          <OutputPanel activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </Layout>
  )
}

export default App
