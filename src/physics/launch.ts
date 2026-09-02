import { Vector3 } from 'three'
import type { SpinType } from './types'

export interface LaunchProfile {
  /** 击球点（对手一侧端线附近，符合真实回击动作） */
  position: Vector3
  /** 出球速度 */
  velocity: Vector3
}

const vec = (x: number, y: number, z: number) => new Vector3(x, y, z)

const DRIVE: LaunchProfile = {
  position: vec(0, 0.35, -1.55),
  velocity: vec(0, 0.9, 11),
}

const LOB: LaunchProfile = {
  position: vec(0, 0.55, -1.45),
  velocity: vec(0, 1.2, 4.5),
}

const RALLY: LaunchProfile = {
  position: vec(0, 0.3, -1.55),
  velocity: vec(0, 0.5, 9),
}

/**
 * 每种旋转对应一种符合实际的来球。
 *
 * 比赛规则：回击必须过网并落在对方台面。上旋弧圈球快而平（马格努斯力
 * 提供下扎），下旋削球慢而高（靠高弧线过网），因此不同旋转类型使用
 * 不同的典型击球参数——这是「现实中的打法差异」，不是物理分支。
 */
export const LAUNCH_PROFILES: Record<SpinType, LaunchProfile> = {
  none: RALLY,
  topspin: DRIVE,
  backspin: LOB,
  rightSidespin: RALLY,
  leftSidespin: RALLY,
  topRight: DRIVE,
  topLeft: DRIVE,
  backRight: LOB,
  backLeft: LOB,
}
