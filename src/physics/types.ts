import type { Vector3 } from 'three'

/**
 * 七种旋转类型（侧上/侧下各提供左右两侧，共 9 个枚举值）。
 * 关键设计：它们不是九套独立逻辑，而只是九个不同的 angularVelocity 方向。
 */
export type SpinType =
  | 'none'
  | 'topspin'
  | 'backspin'
  | 'rightSidespin'
  | 'leftSidespin'
  | 'topRight'
  | 'topLeft'
  | 'backRight'
  | 'backLeft'

export interface BallState {
  position: Vector3
  velocity: Vector3
  angularVelocity: Vector3
  radius: number
  mass: number
}

export type SurfaceKind = 'table' | 'racket' | 'floor' | 'net'

/** 一次接触的输入：由碰撞检测提供，不含任何响应逻辑 */
export interface ContactInfo {
  /** 接触点（世界坐标） */
  point: Vector3
  /** 单位法线，由接触面指向球心 */
  normal: Vector3
  /** 穿透深度（沿法线方向），用于把球退回真实接触时刻 */
  penetration: number
  /** 接触面自身速度（球台为 0，球拍为挥拍速度） */
  surfaceVelocity: Vector3
  restitution: number
  friction: number
}

/** 接触求解的输出 */
export interface ContactResult {
  velocity: Vector3
  angularVelocity: Vector3
  /** 作用在球上的摩擦冲量（世界坐标） */
  frictionImpulse: Vector3
  /** 接触瞬间接触点的相对滑移速度，教学展示用 */
  slipVelocity: Vector3
  /** 法向冲量大小 */
  normalImpulse: number
}

/** 记录一次接触的前后状态，供碰撞检查器展示 */
export interface ContactEvent {
  id: number
  kind: SurfaceKind
  time: number
  point: Vector3
  normal: Vector3
  before: { velocity: Vector3; angularVelocity: Vector3 }
  after: { velocity: Vector3; angularVelocity: Vector3 }
  /** 法向冲量大小（标量） */
  normalImpulse: number
  frictionImpulse: Vector3
  slipVelocity: Vector3
}

export interface TrajectorySample {
  position: Vector3
  time: number
}
