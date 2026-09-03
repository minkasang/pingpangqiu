import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { useSimStore } from './state/useSimStore'
import { ControlBar } from './ui/ControlBar'
import { DisplayOptionsPanel } from './ui/DisplayOptionsPanel'
import { PhysicsInspector } from './ui/PhysicsInspector'
import { RacketControlPanel } from './ui/RacketControlPanel'
import { ScenariosPanel } from './ui/ScenariosPanel'
import { ShortcutsModal } from './ui/ShortcutsModal'
import { SpinLibrary } from './ui/SpinLibrary'
import { Timeline } from './ui/Timeline'
import { useKeyboardShortcuts } from './ui/useKeyboardShortcuts'

export default function App() {
  useKeyboardShortcuts()

  const leftCollapsed = useSimStore((s) => s.leftCollapsed)
  const rightCollapsed = useSimStore((s) => s.rightCollapsed)
  const toggleLeft = useSimStore((s) => s.toggleLeftPanel)
  const toggleRight = useSimStore((s) => s.toggleRightPanel)
  const toggleShortcuts = useSimStore((s) => s.toggleShortcuts)

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-title">
          <h1>乒乓球旋转实验室</h1>
          <span className="subtitle">统一旋转向量 · 马格努斯力 · 可解释物理模拟</span>
        </div>
        <div className="topbar-actions">
          <button className="topbar-btn" onClick={toggleShortcuts} title="快捷键与帮助 (?)">
            ⌨️ 快捷键
          </button>
        </div>
      </header>

      <main className="viewport">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [3.3, 0.78, 0.1], fov: 38, near: 0.01, far: 60 }}
        >
          <Scene />
        </Canvas>

        {/* 左侧控制栏 */}
        {leftCollapsed ? (
          <button
            className="panel-tab panel-tab-left"
            onClick={toggleLeft}
            title="展开旋转库与设置"
          >
            ▶ 控制面板
          </button>
        ) : (
          <aside className="panel panel-left">
            <div className="panel-header-actions">
              <span className="panel-tag">控制库</span>
              <button className="collapse-btn" onClick={toggleLeft} title="收起左侧面板">
                ◀ 折叠
              </button>
            </div>
            <SpinLibrary />
            <ScenariosPanel />
            <DisplayOptionsPanel />
          </aside>
        )}

        {/* 右侧数据与球拍控制 */}
        {rightCollapsed ? (
          <button
            className="panel-tab panel-tab-right"
            onClick={toggleRight}
            title="展开物理检查器与球拍控制"
          >
            ◀ 物理数据与球拍
          </button>
        ) : (
          <div className="right-side">
            <div className="panel-header-actions-right">
              <button className="collapse-btn" onClick={toggleRight} title="收起右侧面板">
                折叠 ▶
              </button>
            </div>
            <PhysicsInspector />
            <RacketControlPanel />
          </div>
        )}
      </main>

      <footer className="bottombar">
        <ControlBar />
        <Timeline />
      </footer>

      <ShortcutsModal />
    </div>
  )
}
