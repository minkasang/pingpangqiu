import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { Plane, Vector3 } from 'three'
import { computeRacketQuaternion, computeRacketVelocity } from '../physics/racket'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'
import { VectorArrow } from './VectorArrow'

const X_LIMIT = 0.6
const Y_MIN = 0.05
const Y_MAX = 0.9

interface ControlsLike {
  enabled: boolean
}

/**
 * 球拍 3D 组件：姿态由 store 驱动，可直接拖拽改变 X/Y 位置。
 * 拖拽时禁用 OrbitControls，避免视角旋转与位置拖动冲突。
 */
export function Racket() {
  const control = useSimStore((s) => s.racketControl)
  const setRacketControl = useSimStore((s) => s.setRacketControl)
  const showRacketVelocity = useSimStore((s) => s.display.racketVelocity)
  const controls = useThree((state) => state.controls) as unknown as ControlsLike | null

  const group = useRef<Group>(null)
  const dragging = useRef(false)
  const plane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const hit = useMemo(() => new Vector3(), [])

  // 拖拽平面固定在球拍当前 Z 位置（实时同步）
  plane.constant = -control.z

  const quaternion = useMemo(
    () => computeRacketQuaternion(control.pitchDeg, control.yawDeg, control.rollDeg),
    [control.pitchDeg, control.yawDeg, control.rollDeg],
  )

  useFrame(() => {
    const node = group.current
    if (!node) return
    node.position.set(control.x, control.y, control.z)
    node.quaternion.copy(quaternion)
  })

  const clampX = (value: number) => Math.min(X_LIMIT, Math.max(-X_LIMIT, value))
  const clampY = (value: number) => Math.min(Y_MAX, Math.max(Y_MIN, value))

  const handlePointerDown = (event: { stopPropagation: () => void; pointerId: number; target: Element }) => {
    event.stopPropagation()
    dragging.current = true
    if (controls) controls.enabled = false
    try {
      event.target.setPointerCapture?.(event.pointerId)
    } catch {
      // 浏览器若不支持则忽略，raycast 自管拖拽
    }
  }

  const handlePointerMove = (event: { ray: { intersectPlane: (plane: Plane, target: Vector3) => Vector3 | null } }) => {
    if (!dragging.current) return
    const point = event.ray.intersectPlane(plane, hit)
    if (!point) return
    setRacketControl({ x: clampX(point.x), y: clampY(point.y) })
  }

  const handlePointerUp = (event: { pointerId: number; target: Element }) => {
    dragging.current = false
    if (controls) controls.enabled = true
    try {
      event.target.releasePointerCapture?.(event.pointerId)
    } catch {
      // 同上
    }
  }

  return (
    <group
      ref={group}
      position={[control.x, control.y, control.z]}
      quaternion={quaternion}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerUp}
      onPointerOver={() => {
        document.body.style.cursor = 'grab'
      }}
      onPointerLeave={() => {
        document.body.style.cursor = ''
        if (dragging.current && controls) controls.enabled = true
        dragging.current = false
      }}
    >
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.008, 48]} />
        <meshStandardMaterial color={PALETTE.racket} roughness={0.85} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.008]} castShadow>
        <cylinderGeometry args={[0.078, 0.078, 0.006, 48]} />
        <meshStandardMaterial color={PALETTE.racketBlade} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, -0.125, 0.009]} castShadow>
        <boxGeometry args={[0.028, 0.11, 0.022]} />
        <meshStandardMaterial color="#5b3a1c" roughness={0.7} />
      </mesh>

      {showRacketVelocity && (
        <VectorArrow
          get={() => computeRacketVelocity(control.action, control.speed)}
          scale={0.05}
          color="#e2e8f0"
          thickness={1.15}
        />
      )}
    </group>
  )
}