import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group } from 'three'
import { Plane, Vector3 } from 'three'
import { computeRacketQuaternion, computeRacketVelocity } from '../physics/racket'
import { useSimStore } from '../state/useSimStore'
import { createRacketGeometries } from './racketGeometry'
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
  const geos = useMemo(() => createRacketGeometries(), [])
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
      {/* 1. 五层纯木底板 (含水滴卵形板面与向下贯穿手柄的实木舌部) */}
      <mesh geometry={geos.bladeGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#c89666" roughness={0.52} metalness={0.04} />
      </mesh>

      {/* 2. 正面高弹蛋糕海绵层 (橙色，面对来球 -Z 侧) */}
      <mesh geometry={geos.spongeGeo} position={[0, 0, -0.0038]} castShadow>
        <meshStandardMaterial color="#ea580c" roughness={0.78} />
      </mesh>

      {/* 3. 正面顶级粘性反胶胶皮 (红双喜狂飙/蝴蝶红反胶微哑光质感) */}
      <mesh geometry={geos.rubberGeo} position={[0, 0, -0.0056]} castShadow>
        <meshPhysicalMaterial
          color="#be123c"
          roughness={0.32}
          metalness={0.02}
          clearcoat={0.16}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* 正面胶皮底部 ITTF 认证标凹凸标记区 */}
      <mesh position={[0, -0.025, -0.0066]}>
        <planeGeometry args={[0.038, 0.012]} />
        <meshStandardMaterial color="#9f1239" roughness={0.4} />
      </mesh>

      {/* 4. 反面高弹海绵层 (蓝色，+Z 侧) */}
      <mesh geometry={geos.spongeGeo} position={[0, 0, 0.0038]} castShadow>
        <meshStandardMaterial color="#2563eb" roughness={0.78} />
      </mesh>

      {/* 5. 反面专业反胶胶皮 (碳素深黑质感) */}
      <mesh geometry={geos.rubberGeo} position={[0, 0, 0.0056]} castShadow>
        <meshPhysicalMaterial
          color="#171717"
          roughness={0.32}
          metalness={0.02}
          clearcoat={0.16}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* 反面胶皮底部 ITTF 认证标 */}
      <mesh position={[0, -0.025, 0.0066]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.038, 0.012]} />
        <meshStandardMaterial color="#262626" roughness={0.4} />
      </mesh>

      {/* 6. 全贴合专业黑色织物护边带 (Edge Tape) */}
      <mesh geometry={geos.edgeTapeGeo}>
        <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.2} />
      </mesh>

      {/* 7. FL (Flared) 人体工学拼木收腰手柄贴片 (前后面各一片，夹持实木底板舌部) */}
      {/* 正面手柄贴片 */}
      <group position={[0, 0, -0.0066]}>
        <mesh geometry={geos.handleGeo} castShadow>
          <meshStandardMaterial color="#451a03" roughness={0.58} />
        </mesh>
        {/* 手柄两侧枫木防滑拼接细饰条 */}
        {[-1, 1].map((side) => (
          <mesh key={`handle-stripe-front-${side}`} position={[side * 0.006, -0.114, -0.004]}>
            <boxGeometry args={[0.002, 0.096, 0.0006]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.5} />
          </mesh>
        ))}
        {/* 正面中央水晶透镜标牌 (Crystal Lens) */}
        <group position={[0, -0.138, -0.004]}>
          {/* 金属底牌 */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.013, 0.023, 0.0008]} />
            <meshStandardMaterial color="#eab308" metalness={0.88} roughness={0.25} />
          </mesh>
          {/* 弧面亚克力透镜外罩 */}
          <mesh position={[0, 0, -0.0006]}>
            <boxGeometry args={[0.0145, 0.0245, 0.0012]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transmission={0.85}
              roughness={0.1}
              metalness={0.05}
              ior={1.49}
              transparent
              opacity={0.9}
            />
          </mesh>
        </group>
      </group>

      {/* 反面手柄贴片 */}
      <group position={[0, 0, 0.0066]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geos.handleGeo} castShadow>
          <meshStandardMaterial color="#451a03" roughness={0.58} />
        </mesh>
        {/* 反面手柄拼木饰条 */}
        {[-1, 1].map((side) => (
          <mesh key={`handle-stripe-back-${side}`} position={[side * 0.006, -0.114, -0.004]}>
            <boxGeometry args={[0.002, 0.096, 0.0006]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* 8. 拍柄底部金属底标牌 (蝴蝶金标/红双喜铭牌) */}
      <mesh position={[0, -0.165, 0]}>
        <boxGeometry args={[0.022, 0.0035, 0.018]} />
        <meshStandardMaterial color="#eab308" metalness={0.88} roughness={0.25} />
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