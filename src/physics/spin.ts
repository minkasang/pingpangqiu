import { Vector3 } from 'three'
import { RAD_TO_RPM, RPM_TO_RAD } from './constants'
import type { SpinType } from './types'

const INV_SQRT2 = Math.SQRT1_2

/**
 * 统一旋转向量。
 *
 * 约定球沿 +Z 飞行（v = (0, 0, +v)），Magnus 力 F_m ∝ ω × v：
 *   上旋 ω = (+ω, 0, 0) → ω × v = (0, -ωv, 0)，向下，上旋下沉
 *   下旋 ω = (-ω, 0, 0) → 向上，下旋飘
 *   右旋 ω = (0, +ω, 0) → (+ωv, 0, 0)，向 +X，即接球者右手边
 *   左旋 ω = (0, -ω, 0) → 向 -X，即接球者左手边
 *
 * 侧上旋 / 侧下旋不做任何特殊处理，只是把两个分量归一化后叠加，
 * 因此方向关系自动正确。
 */
export function spinAxis(type: SpinType): Vector3 {
  switch (type) {
    case 'none':
      return new Vector3(0, 0, 0)
    case 'topspin':
      return new Vector3(1, 0, 0)
    case 'backspin':
      return new Vector3(-1, 0, 0)
    case 'rightSidespin':
      return new Vector3(0, 1, 0)
    case 'leftSidespin':
      return new Vector3(0, -1, 0)
    case 'topRight':
      return new Vector3(INV_SQRT2, INV_SQRT2, 0)
    case 'topLeft':
      return new Vector3(INV_SQRT2, -INV_SQRT2, 0)
    case 'backRight':
      return new Vector3(-INV_SQRT2, INV_SQRT2, 0)
    case 'backLeft':
      return new Vector3(-INV_SQRT2, -INV_SQRT2, 0)
  }
}

/** 由旋转类型与转速（RPM）得到角速度向量 */
export function angularVelocityFromSpin(type: SpinType, rpm: number): Vector3 {
  return spinAxis(type).multiplyScalar(rpm * RPM_TO_RAD)
}

/** 角速度向量的模换算成 RPM */
export function rpmOf(angularVelocity: Vector3): number {
  return angularVelocity.length() * RAD_TO_RPM
}

export const SPIN_LABEL: Record<SpinType, string> = {
  none: '不转球',
  topspin: '上旋',
  backspin: '下旋',
  rightSidespin: '右侧旋',
  leftSidespin: '左侧旋',
  topRight: '右侧上旋',
  topLeft: '左侧上旋',
  backRight: '右侧下旋',
  backLeft: '左侧下旋',
}

/** 侧栏旋转库默认展示的 7 项 */
export const SPIN_LIBRARY: SpinType[] = [
  'none',
  'topspin',
  'backspin',
  'leftSidespin',
  'rightSidespin',
  'topRight',
  'backRight',
]
