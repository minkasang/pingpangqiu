import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { Plane, Vector3 } from 'three'
import { computeRacketQuaternion, computeRacketVelocity } from '../physics/racket'
import { useSimStore } from '../state/useSimStore'
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
      {/* 正面红胶皮 (面对来球 -Z 侧) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.0042]} castShadow>
        <cylinderGeometry args={[0.076, 0.076, 0.0018, 64]} />
        <meshPhysicalMaterial
          color="#b91c1c"
          roughness={0.36}
          metalness={0.02}
          clearcoat={0.12}
          clearcoatRoughness={0.25}
        />
      </mesh>
      {/* 正面橙色高弹海绵层 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.0028]} castShadow>
        <cylinderGeometry args={[0.0755, 0.0755, 0.0012, 48]} />
        <meshStandardMaterial color="#f97316" roughness={0.7} />
      </mesh>

      {/* 纯木五层底板 (中间层) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.077, 0.077, 0.0055, 64]} />
        <meshStandardMaterial color="#d97706" roughness={0.52} metalness={0.05} />
      </mesh>

      {/* 侧面黑色专业护边带 (Edge Tape) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.0774, 0.0774, 0.0088, 64, 1, true]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* 反面蓝色海绵层 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.0034]} castShadow>
        <cylinderGeometry args={[0.0755, 0.0755, 0.0012, 48]} />
        <meshStandardMaterial color="#2563eb" roughness={0.7} />
      </mesh>
      {/* 反面黑胶皮 (+Z 侧) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.0048]} castShadow>
        <cylinderGeometry args={[0.076, 0.076, 0.0018, 64]} />
        <meshPhysicalMaterial
          color="#18181b"
          roughness={0.36}
          metalness={0.02}
          clearcoat={0.12}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* FL 收腰人体工学拼木手柄 */}
      <group position={[0, -0.118, 0]}>
        {/* 手柄主体 (木纹质感，上细下宽 FL 造型) */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.027, 0.096, 0.024]} />
          <meshStandardMaterial color="#78350f" roughness={0.65} />
        </mesh>
        {/* 手柄两侧拼接防滑色块 */}
        {[-1, 1].map((side) => (
          <mesh key={`handle-trim-${side}`} position={[side * 0.008, 0, 0]}>
            <boxGeometry args={[0.005, 0.096, 0.025]} />
            <meshStandardMaterial color="#b45309" roughness={0.6} />
          </mesh>
        ))}
        {/* 手柄底部金属品牌底标 */}
        <mesh position={[0, -0.048, 0]}>
          <boxGeometry args={[0.016, 0.004, 0.014]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

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