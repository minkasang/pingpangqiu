import type { Vector3 } from 'three'

export function fmt(value: number, digits = 2): string {
  return value.toFixed(digits)
}

export function fmtVec(v: Vector3, digits = 2): string {
  return `[${v.x.toFixed(digits)}, ${v.y.toFixed(digits)}, ${v.z.toFixed(digits)}]`
}

/** 以毫秒显示时间，避开小数秒难读的问题 */
export function fmtTime(seconds: number): string {
  return `${(seconds * 1000).toFixed(0)} ms`
}
