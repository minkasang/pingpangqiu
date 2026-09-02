import { create } from 'zustand'
import { Vector3 } from 'three'
import { PHYSICS_DT } from '../physics/constants'
import { TableTennisPhysicsEngine } from '../physics/engine'
import { angularVelocityFromSpin } from '../physics/spin'
import type { SpinType } from '../physics/types'
import type { CameraPreset, InspectorMode } from '../theme'

/** 发球点：对手一侧端线上方 */
export const BALL_START = new Vector3(0, 0.34, -1.32)
/** 出球速度：朝接球者（+Z）平飞，略向下 */
export const BALL_LAUNCH = new Vector3(0, -1.4, 7.2)
export const DEFAULT_RPM = 3200

export function createEngine(spin: SpinType, rpm: number): TableTennisPhysicsEngine {
  return new TableTennisPhysicsEngine({
    position: BALL_START.clone(),
    velocity: BALL_LAUNCH.clone(),
    angularVelocity: angularVelocityFromSpin(spin, rpm),
  })
}

export const TIME_SCALES = [0.05, 0.1, 0.25, 0.5, 1] as const

interface SimStore {
  spin: SpinType
  rpm: number
  engine: TableTennisPhysicsEngine
  playing: boolean
  timeScale: number
  showForces: boolean
  showDebug: boolean
  camera: CameraPreset
  inspectorMode: InspectorMode

  setSpin: (spin: SpinType) => void
  setRpm: (rpm: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setTimeScale: (timeScale: number) => void
  restart: () => void
  stepFrame: () => void
  setCamera: (camera: CameraPreset) => void
  setInspectorMode: (mode: InspectorMode) => void
  toggleForces: () => void
  toggleDebug: () => void
}

export const useSimStore = create<SimStore>((set, get) => ({
  spin: 'topspin',
  rpm: DEFAULT_RPM,
  engine: createEngine('topspin', DEFAULT_RPM),
  // 默认暂停：按 spec 要求，选完旋转先给预览，再手动 Run Simulation
  playing: false,
  timeScale: 1,
  showForces: true,
  showDebug: false,
  camera: 'side',
  inspectorMode: 'physics',

  setSpin: (spin) => set((s) => ({ spin, engine: createEngine(spin, s.rpm), playing: false })),
  setRpm: (rpm) => set((s) => ({ rpm, engine: createEngine(s.spin, rpm), playing: false })),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setTimeScale: (timeScale) => set({ timeScale }),
  restart: () => set((s) => ({ engine: createEngine(s.spin, s.rpm), playing: false })),
  stepFrame: () => get().engine.step(PHYSICS_DT),
  setCamera: (camera) => set({ camera }),
  setInspectorMode: (inspectorMode) => set({ inspectorMode }),
  toggleForces: () => set((s) => ({ showForces: !s.showForces })),
  toggleDebug: () => set((s) => ({ showDebug: !s.showDebug })),
}))
