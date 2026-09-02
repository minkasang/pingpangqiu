import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3 } from 'three'
import type { Group, Mesh } from 'three'
import { useSimStore } from '../state/useSimStore'
import type { TableTennisPhysicsEngine } from '../physics/engine'

const UP = new Vector3(0, 1, 0)
const SHAFT_RADIUS = 0.0035
const HEAD_HEIGHT = 0.026
const HEAD_RADIUS = 0.009

export interface VectorArrowProps {
  /** 每帧取一次向量；返回 null 表示隐藏（例如零向量） */
  get: (engine: TableTennisPhysicsEngine) => Vector3 | null
  /** 世界长度 = 向量模 × scale */
  scale: number
  color: string
  /** 加粗系数，速度箭头略粗 */
  thickness?: number
}

const _direction = new Vector3()

/**
 * 三维矢量箭头。几何体按单位长度构建，每帧只改 scale 与朝向，
 * 不重建几何，保证 60fps。
 *
 * 箭头原点 = 父级 group 原点（BallOverlays 已跟随球心），
 * 本组件只设置方向与长度，不再叠加球心位置。
 */
export function VectorArrow({ get, scale, color, thickness = 1 }: VectorArrowProps) {
  const engine = useSimStore((s) => s.engine)
  const group = useRef<Group>(null)
  const shaft = useRef<Mesh>(null)
  const head = useRef<Mesh>(null)
  const orientation = useMemo(() => new Quaternion(), [])

  useFrame(() => {
    const node = group.current
    if (!node) return

    const vector = get(engine)
    if (!vector || vector.lengthSq() < 1e-12) {
      node.visible = false
      return
    }
    node.visible = true

    const length = Math.max(vector.length() * scale, 0.012)
    _direction.copy(vector).normalize()
    orientation.setFromUnitVectors(UP, _direction)
    node.quaternion.copy(orientation)

    if (shaft.current) shaft.current.scale.y = length
    if (head.current) head.current.position.y = length + HEAD_HEIGHT / 2
  })

  return (
    <group ref={group} visible={false}>
      <mesh ref={shaft} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[SHAFT_RADIUS * thickness, SHAFT_RADIUS * thickness, 1, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={head}>
        <coneGeometry args={[HEAD_RADIUS * thickness, HEAD_HEIGHT, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}
