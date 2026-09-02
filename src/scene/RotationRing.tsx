import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Quaternion, Vector3 } from 'three'
import type { Group } from 'three'
import { BALL } from '../physics/constants'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'

const FORWARD = new Vector3(0, 0, 1)
const UP = new Vector3(0, 1, 0)
const RING_RADIUS = BALL.radius * 1.55
const ARROW_ANGLES = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]

/**
 * 旋转环：与旋转轴垂直的半透明环，环上箭头按右手定则指出旋转方向。
 * 关键点：箭头方向来自 ω 本身，因此上旋 / 下旋 / 侧旋 / 组合旋
 * 全部自动正确，没有任何按类型写死的分支。
 *
 * 位置由父级 BallOverlays 提供（跟随球心），本组件只负责朝向。
 */
export function RotationRing() {
  const engine = useSimStore((s) => s.engine)
  const group = useRef<Group>(null)
  const orientation = useMemo(() => new Quaternion(), [])
  const omegaDirection = useMemo(() => new Vector3(), [])

  /** 环放在局部 XY 平面（法线 +Z），箭头沿切向、指向 ω 的右手旋转方向 */
  const arrows = useMemo(
    () =>
      ARROW_ANGLES.map((angle) => ({
        position: new Vector3(
          Math.cos(angle) * RING_RADIUS,
          Math.sin(angle) * RING_RADIUS,
          0,
        ),
        quaternion: new Quaternion().setFromUnitVectors(
          UP,
          new Vector3(-Math.sin(angle), Math.cos(angle), 0),
        ),
      })),
    [],
  )

  useFrame(() => {
    const node = group.current
    if (!node) return

    const omega = engine.state.angularVelocity
    const speed = omega.length()
    if (speed < 8) {
      node.visible = false
      return
    }
    node.visible = true
    omegaDirection.copy(omega).divideScalar(speed)
    orientation.setFromUnitVectors(FORWARD, omegaDirection)
    node.quaternion.copy(orientation)
  })

  return (
    <group ref={group} visible={false}>
      <mesh>
        <torusGeometry args={[RING_RADIUS, 0.0032, 8, 72]} />
        <meshBasicMaterial
          color={PALETTE.angularVelocity}
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
      {arrows.map((arrow, index) => (
        <mesh key={index} position={arrow.position} quaternion={arrow.quaternion}>
          <coneGeometry args={[0.0075, 0.024, 10]} />
          <meshBasicMaterial color={PALETTE.angularVelocity} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
