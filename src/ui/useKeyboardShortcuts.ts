import { useEffect } from 'react'
import { useSimStore } from '../state/useSimStore'
import type { CameraPreset } from '../theme'

export const CAMERA_KEY_MAP: Record<string, CameraPreset> = {
  '1': 'player',
  '2': 'side',
  '3': 'top',
  '4': 'ball',
  '5': 'contact',
}

/**
 * 全局键盘快捷键响应处理。
 * 当用户在输入框/滑块等交互元素聚焦时，不拦截通用快捷键。
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在文本输入或表单控件内误触发
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        // 如果按 Escape 允许失焦
        if (e.key === 'Escape') target.blur()
        return
      }

      const store = useSimStore.getState()

      if (e.code === 'Space') {
        e.preventDefault()
        store.togglePlaying()
        return
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        store.restart()
        return
      }

      if (e.key === '.' || e.key === '>' || e.key === 'ArrowRight') {
        e.preventDefault()
        store.stepFrame()
        return
      }

      const preset = CAMERA_KEY_MAP[e.key]
      if (preset) {
        e.preventDefault()
        store.setCamera(preset)
        return
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        store.toggleSound()
        return
      }

      if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault()
        store.toggleShortcuts()
        return
      }

      if (e.key === 'Escape') {
        if (store.shortcutsOpen) {
          store.setShortcutsOpen(false)
          return
        }
        if (store.selectedContactId !== null) {
          store.selectContact(null)
          return
        }
        if (store.activeScenarioId !== null) {
          store.clearScenario()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
