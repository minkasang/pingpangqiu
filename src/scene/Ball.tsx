import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
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

const SQUASH_DURATION = 0.12

/** 球姿态 + 接触瞬间的轻微视觉夸张（球向法向方向被压扁） */
export function Ball() {
  const engine = useSimStore((s) => s.engine)
  const group = useRef<Group>(null)
  const ballMesh = useRef<Mesh>(null)
  const lastContactCountRef = useRef(0)
  const squashStartTime = useRef(-1)

  useFrame(() => {
    const node = group.current
    if (!node) return
    node.position.copy(engine.state.position)
    node.quaternion.copy(engine.orientation)

    // 检测新接触，触发 squash 动画
    const contactCount = engine.contacts.length
    if (contactCount > lastContactCountRef.current) {
      const latest = engine.contacts[contactCount - 1]
      squashStartTime.current = engine.time
      void latest
    }
    lastContactCountRef.current = contactCount

    // squash 振幅：t=0 时 0.3（向法向压 30%），随时间衰减回 0
    if (ballMesh.current) {
      const t = engine.time - squashStartTime.current
      let amount = 0
      if (t >= 0 && t < SQUASH_DURATION) {
        const phase = t / SQUASH_DURATION
        // 一个衰减正弦：在 0 时刻给最大压扁，慢慢回到原状
        amount = 0.3 * Math.cos((phase * Math.PI) / 2) * (1 - phase * 0.3)
      }
      const sy = 1 - amount
      ballMesh.current.scale.set(1, sy, 1)
    }
  })

  return (
    <group ref={group}>
      <mesh ref={ballMesh} castShadow>
        <sphereGeometry args={[R, 64, 48]} />
        <meshPhysicalMaterial
          color={PALETTE.ball}
          roughness={0.28}
          metalness={0.01}
          clearcoat={0.18}
          clearcoatRoughness={0.35}
        />
      </mesh>
      <BallMarkings />
    </group>
  )
}