import { Vector3 } from 'three'
import type { RacketControl } from './racket'

/**
 * Macro 接触模式的触发距离阈值（spec 第十四节）。
 * 球与球拍中心距离进入 10 cm → 自动慢放到 0.1×；进入 3 cm → 进入微观特写镜头。
 */
export const MACRO_DIST_SLOWDOWN = 0.1
export const MACRO_DIST_MACRO = 0.03
export const MACRO_TIME_SCALE = 0.1

export type MacroMode = 'far' | 'slowdown' | 'macro'

/**
 * 球与球拍中心距离（不含各自半径）：纯函数，便于测试。
 * Spec 允许的合理近似：球体为质点，球拍近似为半径 0.075 m 的柱体中心。
 */
export function useMacroView(ballPos: Vector3, racketControl: RacketControl, ballRadius: number): MacroMode {
  const dx = ballPos.x - racketControl.x
  const dy = ballPos.y - racketControl.y
  const dz = ballPos.z - racketControl.z
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) - ballRadius - 0.075
  if (dist < MACRO_DIST_MACRO) return 'macro'
  if (dist < MACRO_DIST_SLOWDOWN) return 'slowdown'
  return 'far'
}