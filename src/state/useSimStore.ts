import { create } from 'zustand'
import { sound } from '../audio/sound'
import { PHYSICS_DT } from '../physics/constants'
import { TableTennisPhysicsEngine } from '../physics/engine'
import { LAUNCH_PROFILES } from '../physics/launch'
import { DEFAULT_RACKET_CONTROL } from '../physics/racket'
import type { RacketControl } from '../physics/racket'
import { getScenario } from '../physics/scenarios'
import type { ScenarioId } from '../physics/scenarios'
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

/** 教学场景的当前状态：null = 不在场景模式 */
export type ScenarioPhase = 'wrong' | 'correct' | null

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
  /** 球接近时自动慢放并切镜头 */
  autoMacro: boolean
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
  autoMacro: true,
  racketVelocity: true,
  colliderDebug: false,
  contactDebug: false,
}

export type RacketGripType = 'shakehand' | 'penhold'

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
  /** 球拍握把类型：横拍长刀 (shakehand) vs 直拍竖拍 (penhold) */
  racketGrip: RacketGripType
  /** 当前激活的教学场景（null = 自由模式） */
  activeScenarioId: ScenarioId | null
  /** 当前在演示错误还是正确拍位 */
  scenarioPhase: ScenarioPhase
  /** 选中的接触点 id（用于碰撞检查器高亮） */
  selectedContactId: number | null
  /** 是否启用 Macro 自动慢放与镜头推近 */
  autoMacro: boolean
  /** 用户期望的时间速度（自动慢放会临时覆盖） */
  userTimeScale: number
  /** 是否启用击球合成音效 */
  soundEnabled: boolean
  /** 左侧面板折叠 */
  leftCollapsed: boolean
  /** 右侧面板折叠 */
  rightCollapsed: boolean
  /** 快捷键指南浮层是否开启 */
  shortcutsOpen: boolean

  setSpin: (spin: SpinType) => void
  setRpm: (rpm: number) => void
  setPlaying: (playing: boolean) => void
  togglePlaying: () => void
  setTimeScale: (timeScale: number) => void
  setUserTimeScale: (timeScale: number) => void
  restart: () => void
  stepFrame: () => void
  setCamera: (camera: CameraPreset) => void
  setInspectorMode: (mode: InspectorMode) => void
  toggleDisplay: (key: keyof DisplayOptions) => void
  setRacketControl: (partial: Partial<RacketControl>) => void
  setRacketGrip: (grip: RacketGripType) => void
  toggleSound: () => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setShortcutsOpen: (open: boolean) => void
  toggleShortcuts: () => void
  /** 进入某个场景：设置旋转、转速、应用「错误拍位」并暂停 */
  applyScenario: (id: ScenarioId) => void
  /** 切换到场景中的正确拍位（不影响旋转）））） */
  applyScenarioCorrect: () => void
  /** 回到场景中的错误拍位 */
  revertScenarioToWrong: () => void
  /** 退出场景模式，恢复默认状态 */
  clearScenario: () => void
  /** 选择接触点 */
  selectContact: (id: number | null) => void
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
  racketGrip: 'shakehand',
  activeScenarioId: null,
  scenarioPhase: null,
  selectedContactId: null,
  autoMacro: true,
  userTimeScale: 1,
  soundEnabled: true,
  leftCollapsed: false,
  rightCollapsed: false,
  shortcutsOpen: false,

  setSpin: (spin) => set((s) => ({ spin, engine: createEngine(spin, s.rpm), playing: false })),
  setRpm: (rpm) => set((s) => ({ rpm, engine: createEngine(s.spin, rpm), playing: false })),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setTimeScale: (timeScale) => set({ timeScale, userTimeScale: timeScale }),
  setUserTimeScale: (timeScale) => set({ timeScale, userTimeScale: timeScale }),
  restart: () =>
    set((s) => ({
      engine: createEngine(s.spin, s.rpm),
      playing: false,
      selectedContactId: null,
    })),
  stepFrame: () => get().engine.step(PHYSICS_DT),
  setCamera: (camera) => set({ camera }),
  setInspectorMode: (inspectorMode) => set({ inspectorMode }),
  toggleDisplay: (key) =>
    set((s) => ({ display: { ...s.display, [key]: !s.display[key] } })),
  setRacketControl: (partial) => set((s) => ({ racketControl: { ...s.racketControl, ...partial } })),
  setRacketGrip: (racketGrip) => set({ racketGrip }),
  toggleSound: () => {
    const next = !get().soundEnabled
    sound.setEnabled(next)
    set({ soundEnabled: next })
  },
  toggleLeftPanel: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  toggleShortcuts: () => set((s) => ({ shortcutsOpen: !s.shortcutsOpen })),

  applyScenario: (id) => {
    const scenario = getScenario(id)
    set({
      spin: scenario.spin,
      rpm: scenario.incomingRpm,
      engine: createEngine(scenario.spin, scenario.incomingRpm),
      racketControl: scenario.wrong,
      activeScenarioId: id,
      scenarioPhase: 'wrong',
      playing: false,
    })
  },
  applyScenarioCorrect: () => {
    const id = get().activeScenarioId
    if (!id) return
    const scenario = getScenario(id)
    set({
      racketControl: scenario.correct,
      scenarioPhase: 'correct',
      playing: false,
    })
  },
  revertScenarioToWrong: () => {
    const id = get().activeScenarioId
    if (!id) return
    const scenario = getScenario(id)
    set({
      racketControl: scenario.wrong,
      scenarioPhase: 'wrong',
      playing: false,
    })
  },
  clearScenario: () =>
    set({ activeScenarioId: null, scenarioPhase: null, selectedContactId: null }),
  selectContact: (selectedContactId) => set({ selectedContactId }),
}))
