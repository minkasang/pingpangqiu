import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { Group } from 'three'
import { useSimStore } from '../state/useSimStore'
import { dragForce, gravityForce, magnusForce } from '../physics/forces'
import { PALETTE } from '../theme'
import { RotationRing } from './RotationRing'
import { SpinAxis } from './SpinAxis'
import { VectorArrow } from './VectorArrow'

/**
 * 力与速度矢量。比例系数统一放在这里：
 *   速度 0.03 m/(m/s)，力 4 m/N（同尺度才能直观比较大小）。
 * 合速度与三个分量共用速度比例，长度可直接互相比较。
 */
function VelocityAndForces() {
  const display = useSimStore((s) => s.display)
  const componentX = useMemo(() => new Vector3(), [])
  const componentY = useMemo(() => new Vector3(), [])
  const componentZ = useMemo(() => new Vector3(), [])

  return (
    <>
      {display.velocity && (
        <VectorArrow
          get={(engine) => engine.state.velocity}
          scale={0.03}
          color={PALETTE.velocity}
          thickness={1.25}
        />
      )}
      {display.velocityZ && (
        <VectorArrow
          get={(engine) => componentZ.set(0, 0, engine.state.velocity.z)}
          scale={0.03}
          color={PALETTE.velocityZ}
        />
      )}
      {display.velocityY && (
        <VectorArrow
          get={(engine) => componentY.set(0, engine.state.velocity.y, 0)}
          scale={0.03}
          color={PALETTE.velocityY}
        />
      )}
      {display.velocityX && (
        <VectorArrow
          get={(engine) => componentX.set(engine.state.velocity.x, 0, 0)}
          scale={0.03}
          color={PALETTE.velocityX}
        />
      )}

      {display.magnus && (
        <VectorArrow
          get={(engine) => magnusForce(engine.state.angularVelocity, engine.state.velocity)}
          scale={4}
          color={PALETTE.forceMagnus}
        />
      )}
      {display.drag && (
        <VectorArrow
          get={(engine) => dragForce(engine.state.velocity)}
          scale={4}
          color={PALETTE.forceDrag}
        />
      )}
      {display.gravity && (
        <VectorArrow get={() => gravityForce()} scale={4} color={PALETTE.forceGravity} />
      )}
    </>
  )
}

/** 跟随球心但不随球自转的可视化层：旋转轴、旋转环、速度与力矢量 */
export function BallOverlays() {
  const engine = useSimStore((s) => s.engine)
  const display = useSimStore((s) => s.display)
  const group = useRef<Group>(null)

  useFrame(() => {
    group.current?.position.copy(engine.state.position)
  })

  return (
    <group ref={group}>
      {display.spinAxis && <SpinAxis />}
      {display.spinRing && <RotationRing />}
      <VelocityAndForces />
    </group>
  )
}
