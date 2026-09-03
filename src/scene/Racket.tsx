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
  const grip = useSimStore((s) => s.racketGrip)
  const geos = useMemo(() => createRacketGeometries(grip), [grip])
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

  const isShakehand = grip === 'shakehand'
  const lensY = isShakehand ? -0.144 : -0.138
  const buttY = isShakehand ? -0.174 : -0.17
  const stripeLength = isShakehand ? 0.092 : 0.068
  const stripeY = isShakehand ? -0.124 : -0.132

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
      {/* 1. 五层纯木底板 (饱满水滴卵形板面 + 大面积纯木拍肩 + 贯穿木舌，真实浅原木色) */}
      <mesh geometry={geos.bladeGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#eedbb2" roughness={0.65} metalness={0.02} />
      </mesh>

      {/* 2. 正面高弹蛋糕海绵层 (橙色，面对来球 -Z 侧) */}
      <mesh geometry={geos.spongeGeo} position={[0, 0, -0.0038]} castShadow>
        <meshStandardMaterial color="#ea580c" roughness={0.8} />
      </mesh>

      {/* 3. 正面顶级红双喜/狂飙粘性反胶胶皮 (纯正国乒大红微哑光，全周优美微内凹贴指流线) */}
      <mesh geometry={geos.rubberGeo} position={[0, 0, -0.0056]} castShadow>
        <meshPhysicalMaterial
          color="#d0121a"
          roughness={0.32}
          metalness={0.02}
          clearcoat={0.14}
          clearcoatRoughness={0.24}
        />
      </mesh>

      {/* 4. 反面高弹海绵层 (蓝色，+Z 侧) */}
      <mesh geometry={geos.spongeGeo} position={[0, 0, 0.0038]} castShadow>
        <meshStandardMaterial color="#2563eb" roughness={0.8} />
      </mesh>

      {/* 5. 反面专业反胶胶皮 (经典碳素墨黑) */}
      <mesh geometry={geos.rubberGeo} position={[0, 0, 0.0056]} castShadow>
        <meshPhysicalMaterial
          color="#141414"
          roughness={0.32}
          metalness={0.02}
          clearcoat={0.14}
          clearcoatRoughness={0.24}
        />
      </mesh>

      {/* 6. 贴合拍头外轮廓的专业黑色织物护边带 (Edge Tape) */}
      <mesh geometry={geos.edgeTapeGeo}>
        <meshStandardMaterial color="#0f172a" roughness={0.42} metalness={0.18} />
      </mesh>

      {/* 7. 手柄握把贴片 (正反两面，经典红双喜红木底色 + 浅象牙双跑道条纹 + 椭圆水晶标) */}
      {/* 正面手柄 */}
      <group position={[0, 0, -0.007]}>
        <mesh geometry={geos.handleGeo} castShadow>
          <meshStandardMaterial color="#781d22" roughness={0.55} />
        </mesh>
        {/* 正面两根红双喜标志性乳白/米黄双拼防滑条纹 */}
        {[-1, 1].map((side) => (
          <mesh key={`handle-stripe-front-${side}`} position={[side * 0.0048, stripeY, -0.0042]}>
            <boxGeometry args={[0.0022, stripeLength, 0.0006]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.5} />
          </mesh>
        ))}
        {/* 红双喜椭圆水晶标牌 (黑色椭圆底 + 金色 ★★★★ 标徽 + 弧面透镜) */}
        <group position={[0, lensY, -0.0043]}>
          {/* 黑色底牌 */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.014, 0.024, 0.0008]} />
            <meshStandardMaterial color="#0a0a0c" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* 金色 DHS 星级标记嵌件 */}
          <mesh position={[0, 0, -0.0005]}>
            <boxGeometry args={[0.009, 0.016, 0.0004]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.88} roughness={0.25} />
          </mesh>
          {/* 弧面透明有机玻璃透镜 */}
          <mesh position={[0, 0, -0.0008]}>
            <boxGeometry args={[0.0146, 0.0246, 0.0012]} />
            <meshPhysicalMaterial
              color="#ffffff"
              transmission={0.88}
              roughness={0.08}
              metalness={0.05}
              ior={1.49}
              transparent
              opacity={0.92}
            />
          </mesh>
        </group>
      </group>

      {/* 反面手柄 */}
      <group position={[0, 0, 0.007]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={geos.handleGeo} castShadow>
          <meshStandardMaterial color="#781d22" roughness={0.55} />
        </mesh>
        {/* 反面米黄防滑条纹 */}
        {[-1, 1].map((side) => (
          <mesh key={`handle-stripe-back-${side}`} position={[side * 0.0048, stripeY, -0.0042]}>
            <boxGeometry args={[0.0022, stripeLength, 0.0006]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* 8. 拍柄底部金属铭牌 (蝴蝶金标/红双喜底部拉丝金标) */}
      <mesh position={[0, buttY, 0]}>
        <boxGeometry args={[0.022, 0.003, 0.018]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.22} />
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