import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { ControlBar } from './ui/ControlBar'
import { DisplayOptionsPanel } from './ui/DisplayOptionsPanel'
import { PhysicsInspector } from './ui/PhysicsInspector'
import { RacketControlPanel } from './ui/RacketControlPanel'
import { SpinLibrary } from './ui/SpinLibrary'
import { Timeline } from './ui/Timeline'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <h1>乒乓球旋转实验室</h1>
        <span className="subtitle">统一旋转向量 · 马格努斯力 · 可解释物理模拟</span>
      </header>

      <main className="viewport">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [3.3, 0.78, 0.1], fov: 38, near: 0.01, far: 60 }}
        >
          <Scene />
        </Canvas>
        <aside className="panel panel-left">
          <SpinLibrary />
          <DisplayOptionsPanel />
        </aside>
        <div className="right-side">
          <PhysicsInspector />
          <RacketControlPanel />
        </div>
      </main>

      <footer className="bottombar">
        <ControlBar />
        <Timeline />
      </footer>
    </div>
  )
}
