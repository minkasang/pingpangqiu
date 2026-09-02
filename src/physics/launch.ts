import { Vector3 } from 'three'
import type { SpinType } from './types'

export interface LaunchProfile {
  /** 触球点：发球方（对手，-Z 一侧）端线后上方 */
  position: Vector3
  /** 触球速度 */
  velocity: Vector3
}

const vec = (x: number, y: number, z: number) => new Vector3(x, y, z)

/**
 * 合法发球：先落发球方台面（-Z），过网，再落接球方台面（+Z）。
 * 不同旋转使用不同的典型发球：
 *   快攻/弧圈式发球——平快、第一跳靠近端线
 *   下旋发球——触球点稍高、稍慢，靠第一跳后的旋转过网
 */
const SERVE_FAST: LaunchProfile = {
  position: vec(0, 0.35, -1.5),
  velocity: vec(0, -1.2, 4.5),
}

const SERVE_TOPSPIN: LaunchProfile = {
  position: vec(0, 0.35, -1.5),
  velocity: vec(0, -1.2, 3.2),
}

const SERVE_BACKSPIN: LaunchProfile = {
  position: vec(0, 0.42, -1.45),
  velocity: vec(0, -0.9, 4.2),
}

export const LAUNCH_PROFILES: Record<SpinType, LaunchProfile> = {
  none: SERVE_FAST,
  topspin: SERVE_TOPSPIN,
  backspin: SERVE_BACKSPIN,
  rightSidespin: SERVE_FAST,
  leftSidespin: SERVE_FAST,
  topRight: SERVE_TOPSPIN,
  topLeft: SERVE_TOPSPIN,
  backRight: SERVE_BACKSPIN,
  backLeft: SERVE_BACKSPIN,
}
