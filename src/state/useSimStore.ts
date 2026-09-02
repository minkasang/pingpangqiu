import { create } from 'zustand'
import { PHYSICS_DT } from '../physics/constants'
import { TableTennisPhysicsEngine } from '../physics/engine'
import { LAUNCH_PROFILES } from '../physics/launch'
import { DEFAULT_RACKET_CONTROL } from '../physics/racket'
import type { RacketControl } from '../physics/racket'
import { angularVelocityFromSpin } from '../physics/spin'
import type { SpinType } from '../physics/types'
import type { CameraPreset, InspectorMode } from '../theme'

export const DEFAULT_RPM = 3200

export function createEngine(spin: SpinType, rpm: number): TableTennisPhysicsEngine {
  const profile = LAUNCH_PROFILES[spin]
  return new TableTennisPhysicsEngine({
    position: profile.position.clone(),
    velocity: profile.velocity.clone(),
    angularVelocity: angularVelocityFromSpin(spin, rpm),
  })
}

export const TIME_SCALES = [0.05, 0.1, 0.25, 0.5, 1] as const

  /** 每个可视化元素独立开关，颜色与 3D 中箭头一一对应 */
export interface DisplayOptions {
  /** 合速度 */
  velocity: boolean
  /** 前后分量 vz */
  velocityZ: boolean
  /** 垂直分量 vy */
  velocityY: boolean
  /** 左右分量 vx */
  velocityX: boolean
  magnus: boolean
  drag: boolean
  gravity: boolean
  spinAxis: boolean
  spinRing: boolean
  trajectory: boolean
  /** Ghost 预测轨迹 */
  prediction: boolean
  /** 球拍速度箭头 */
  racketVelocity: boolean
  colliderDebug: boolean
  contactDebug: boolean
}

const DEFAULT_DISPLAY: DisplayOptions = {
  velocity: true,
  velocityZ: true,
  velocityY: true,
  velocityX: true,
  magnus: true,
  drag: true,
  gravity: true,
  spinAxis: true,
  spinRing: true,
  trajectory: true,
  prediction: true,
  racketVelocity: true,
  colliderDebug: false,
  contactDebug: false,
}

interface SimStore {
  spin: SpinType
  rpm: number
  engine: TableTennisPhysicsEngine
  playing: boolean
  timeScale: number
  display: DisplayOptions
  camera: CameraPreset
  inspectorMode: InspectorMode
  racketControl: RacketControl

  setSpin: (spin: SpinType) => void
  setRpm: (rpm: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setTimeScale: (timeScale: number) => void
  restart: () => void
  stepFrame: () => void
  setCamera: (camera: CameraPreset) => void
  setInspectorMode: (mode: InspectorMode) => void
  toggleDisplay: (key: keyof DisplayOptions) => void
  setRacketControl: (partial: Partial<RacketControl>) => void
}

export const useSimStore = create<SimStore>((set, get) => ({
  spin: 'topspin',
  rpm: DEFAULT_RPM,
  engine: createEngine('topspin', DEFAULT_RPM),
  // 默认暂停：按 spec 要求，选完旋转先给预览，再手动 Run Simulation
  playing: false,
  timeScale: 1,
  display: DEFAULT_DISPLAY,
  camera: 'side',
  inspectorMode: 'physics',
  racketControl: DEFAULT_RACKET_CONTROL,

  setSpin: (spin) => set((s) => ({ spin, engine: createEngine(spin, s.rpm), playing: false })),
  setRpm: (rpm) => set((s) => ({ rpm, engine: createEngine(s.spin, rpm), playing: false })),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setTimeScale: (timeScale) => set({ timeScale }),
  restart: () => set((s) => ({ engine: createEngine(s.spin, s.rpm), playing: false })),
  stepFrame: () => get().engine.step(PHYSICS_DT),
  setCamera: (camera) => set({ camera }),
  setInspectorMode: (inspectorMode) => set({ inspectorMode }),
  toggleDisplay: (key) =>
    set((s) => ({ display: { ...s.display, [key]: !s.display[key] } })),
  setRacketControl: (partial) => set((s) => ({ racketControl: { ...s.racketControl, ...partial } })),
}))
