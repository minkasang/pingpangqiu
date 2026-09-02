import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'
import type { Group } from 'three'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'

const UP = new Vector3(0, 1, 0)
const HALF = 0.085

/**
 * 旋转轴：穿过球心，方向 = 角速度方向，两端有箭头表示旋转的轴向约定，
 * 顶端标 ω。随转速降低整体淡出。
 */
export function SpinAxis() {
  const engine = useSimStore((s) => s.engine)
  const group = useRef<Group>(null)
  const orientation = useMemo(() => new Quaternion(), [])
  const axis = useMemo(() => new Vector3(), [])

  useFrame(() => {
    const node = group.current
    if (!node) return

    const omega = engine.state.angularVelocity
    const speed = omega.length()
    if (speed < 8) {
      // 低于约 76 RPM 时不显示，避免不转球旁边出现误导性的轴
      node.visible = false
      return
    }
    node.visible = true
    axis.copy(omega).divideScalar(speed)
    orientation.setFromUnitVectors(UP, axis)
    node.position.copy(engine.state.position)
    node.quaternion.copy(orientation)

    const opacity = Math.min(speed / 60, 1)
    node.traverse((child) => {
      const mesh = child as { material?: { opacity: number } }
      if (mesh.material && 'opacity' in mesh.material) mesh.material.opacity = opacity
    })
  })

  return (
    <group ref={group} visible={false}>
      <mesh position={[0, HALF / 2, 0]}>
        <cylinderGeometry args={[0.0022, 0.0022, HALF, 6]} />
        <meshBasicMaterial color={PALETTE.angularVelocity} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, -HALF / 2, 0]}>
        <cylinderGeometry args={[0.0022, 0.0022, HALF, 6]} />
        <meshBasicMaterial color={PALETTE.angularVelocity} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, HALF, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.008, 0.022, 10]} />
        <meshBasicMaterial color={PALETTE.angularVelocity} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, -HALF, 0]}>
        <coneGeometry args={[0.008, 0.022, 10]} />
        <meshBasicMaterial color={PALETTE.angularVelocity} transparent toneMapped={false} />
      </mesh>
      <Html center position={[0, HALF + 0.035, 0]} zIndexRange={[20, 0]}>
        <span className="axis-label">ω</span>
      </Html>
    </group>
  )
}
