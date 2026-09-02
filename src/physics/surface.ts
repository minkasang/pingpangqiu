import { Quaternion, Vector3 } from 'three'
import { FLOOR_Y, SURFACE, TABLE } from './constants'
import type { ContactInfo, SurfaceKind } from './types'

/**
 * 用有向包围盒描述可碰撞表面。球台、地面、球拍都用同一个描述，
 * 接触检测因此只有一套代码，且与球拍姿态无关。
 */
export interface BoxSurface {
  kind: SurfaceKind
  center: Vector3
  /** 局部 → 世界 的旋转 */
  rotation: Quaternion
  halfExtents: Vector3
  /** 表面自身速度（球拍为挥拍速度） */
  velocity: Vector3
  restitution: number
  friction: number
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

export function createTableSurface(): BoxSurface {
  return {
    kind: 'table',
    center: new Vector3(0, TABLE.surfaceY - TABLE.thickness / 2, 0),
    rotation: new Quaternion(),
    halfExtents: new Vector3(TABLE.width / 2, TABLE.thickness / 2, TABLE.length / 2),
    velocity: new Vector3(0, 0, 0),
    restitution: SURFACE.table.restitution,
    friction: SURFACE.table.friction,
  }
}

export function createFloorSurface(): BoxSurface {
  return {
    kind: 'floor',
    center: new Vector3(0, FLOOR_Y - 0.05, 0),
    rotation: new Quaternion(),
    halfExtents: new Vector3(4, 0.05, 4),
    velocity: new Vector3(0, 0, 0),
    restitution: SURFACE.floor.restitution,
    friction: SURFACE.floor.friction,
  }
}

export const RACKET_HALF_EXTENTS = new Vector3(0.075, 0.075, 0.006)

/** 球网比台面宽（1.83m），两端各伸出 15.25cm */
export const NET_WIDTH = 1.83

export function createNetSurface(): BoxSurface {
  return {
    kind: 'net',
    center: new Vector3(0, TABLE.netHeight / 2, 0),
    rotation: new Quaternion(),
    halfExtents: new Vector3(NET_WIDTH / 2, TABLE.netHeight / 2, 0.004),
    velocity: new Vector3(0, 0, 0),
    // 触网基本卸掉全部反弹
    restitution: 0.05,
    friction: 0.3,
  }
}

export function createRacketSurface(center: Vector3, rotation: Quaternion, velocity: Vector3): BoxSurface {
  return {
    kind: 'racket',
    center: center.clone(),
    rotation: rotation.clone(),
    halfExtents: RACKET_HALF_EXTENTS.clone(),
    velocity: velocity.clone(),
    restitution: SURFACE.racket.restitution,
    friction: SURFACE.racket.friction,
  }
}

const _local = new Vector3()
const _closest = new Vector3()
const _delta = new Vector3()
const _inverse = new Quaternion()

/**
 * 球与有向包围盒的接触检测。
 *
 * 返回 null 表示未接触；否则给出接触点、由表面指向球心的单位法线，
 * 以及表面的自身速度。棱边与角点会被自动处理，无需额外分支。
 */
export function detectSphereBox(
  sphereCenter: Vector3,
  radius: number,
  surface: BoxSurface,
): ContactInfo | null {
  _inverse.copy(surface.rotation).invert()
  _local.copy(sphereCenter).sub(surface.center).applyQuaternion(_inverse)

  const h = surface.halfExtents
  _closest.set(clamp(_local.x, -h.x, h.x), clamp(_local.y, -h.y, h.y), clamp(_local.z, -h.z, h.z))
  _delta.copy(_local).sub(_closest)

  const distance = _delta.length()
  if (distance > radius) return null

  if (distance > 1e-9) {
    _delta.divideScalar(distance)
  } else {
    // 球心落在盒内：沿穿透最浅的轴推出
    const gapX = h.x - Math.abs(_local.x)
    const gapY = h.y - Math.abs(_local.y)
    const gapZ = h.z - Math.abs(_local.z)
    if (gapX <= gapY && gapX <= gapZ) _delta.set(Math.sign(_local.x) || 1, 0, 0)
    else if (gapY <= gapZ) _delta.set(0, Math.sign(_local.y) || 1, 0)
    else _delta.set(0, 0, Math.sign(_local.z) || 1)
  }

  return {
    point: _closest.clone().applyQuaternion(surface.rotation).add(surface.center),
    normal: _delta.clone().applyQuaternion(surface.rotation),
    penetration: radius - distance,
    surfaceVelocity: surface.velocity.clone(),
    restitution: surface.restitution,
    friction: surface.friction,
  }
}
