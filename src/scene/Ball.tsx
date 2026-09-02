import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { BALL } from '../physics/constants'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'

const R = BALL.radius

/**
 * 球表面参考标记：一条细色环 + 两个极点。
 * 纯白球高速旋转时看不出转的方向，这两个标记只负责让旋转可见。
 * 环和点都要凸出球面足够多，否则远距离观察时会被球体本身挡住。
 */
function BallMarkings() {
  return (
    <group>
      <mesh>
        <torusGeometry args={[R * 1.02, R * 0.11, 10, 72]} />
        <meshStandardMaterial color={PALETTE.ballMark} roughness={0.35} metalness={0.1} />
      </mesh>
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, 0, side * R * 1.01]}>
          <sphereGeometry args={[R * 0.22, 16, 12]} />
          <meshStandardMaterial color={PALETTE.ballMark} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}

export function Ball() {
  const engine = useSimStore((s) => s.engine)
  const group = useRef<Group>(null)

  useFrame(() => {
    const node = group.current
    if (!node) return
    node.position.copy(engine.state.position)
    node.quaternion.copy(engine.orientation)
  })

  return (
    <group ref={group}>
      <mesh castShadow>
        <sphereGeometry args={[R, 48, 32]} />
        <meshStandardMaterial color={PALETTE.ball} roughness={0.4} metalness={0.02} />
      </mesh>
      <BallMarkings />
    </group>
  )
}
