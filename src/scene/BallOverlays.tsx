import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { useSimStore } from '../state/useSimStore'
import { dragForce, gravityForce, magnusForce } from '../physics/forces'
import { PALETTE } from '../theme'
import { RotationRing } from './RotationRing'
import { SpinAxis } from './SpinAxis'
import { VectorArrow } from './VectorArrow'

/**
 * 力矢量。比例系数统一放在这里：
 *   速度 0.03 m/(m/s)，力 4 m/N（同尺度才能直观比较力的大小）
 */
function ForceArrows() {
  const showForces = useSimStore((s) => s.showForces)
  if (!showForces) return null

  return (
    <>
      <VectorArrow
        get={(engine) => engine.state.velocity}
        scale={0.03}
        color={PALETTE.velocity}
        thickness={1.25}
      />
      <VectorArrow
        get={(engine) => magnusForce(engine.state.angularVelocity, engine.state.velocity)}
        scale={4}
        color={PALETTE.forceMagnus}
      />
      <VectorArrow
        get={(engine) => dragForce(engine.state.velocity)}
        scale={4}
        color={PALETTE.forceDrag}
      />
      <VectorArrow get={() => gravityForce()} scale={4} color={PALETTE.forceGravity} />
    </>
  )
}

/** 跟随球心但不随球自转的可视化层：旋转轴、旋转环、力矢量 */
export function BallOverlays() {
  const engine = useSimStore((s) => s.engine)
  const group = useRef<Group>(null)

  useFrame(() => {
    group.current?.position.copy(engine.state.position)
  })

  return (
    <group ref={group}>
      <SpinAxis />
      <RotationRing />
      <ForceArrows />
    </group>
  )
}
