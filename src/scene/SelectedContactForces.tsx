import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { Vector3 } from 'three'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'
import { VectorArrow } from './VectorArrow'

/** 把「选中接触点」的法向 / 摩擦冲量换成可视长度，再交给通用 VectorArrow */
const NORMAL_SCALE = 0.03
const IMPULSE_SCALE = 0.03
const MAX_LENGTH = 0.12

/**
 * 选中接触点时，在接触位置显示法向冲量 N（绿）+ 摩擦冲量（橙）矢量。
 * 长度按冲量大小等比缩放，方向由 solveContact 算出。
 */
export function SelectedContactForces() {
  const engine = useSimStore((s) => s.engine)
  const selectedId = useSimStore((s) => s.selectedContactId)
  const group = useRef<Group>(null)
  const tmpNormal = useMemo(() => new Vector3(), [])
  const tmpFriction = useMemo(() => new Vector3(), [])

  useFrame(() => {
    const node = group.current
    if (!node) return
    const contact = engine.contacts.find((event) => event.id === selectedId)
    if (!contact) {
      node.visible = false
      return
    }
    node.visible = true
    node.position.copy(contact.point)
  })

  return (
    <group ref={group}>
      <VectorArrow
        get={(engine) => {
          const contact = engine.contacts.find((event) => event.id === selectedId)
          if (!contact) return null
          tmpNormal.copy(contact.normal).normalize().multiplyScalar(
            Math.min(contact.normalImpulse * NORMAL_SCALE, MAX_LENGTH),
          )
          return tmpNormal
        }}
        scale={1}
        color={PALETTE.contactNormal}
        thickness={1.2}
      />
      <VectorArrow
        get={(engine) => {
          const contact = engine.contacts.find((event) => event.id === selectedId)
          if (!contact) return null
          tmpFriction.copy(contact.frictionImpulse)
          const len = tmpFriction.length()
          if (len < 1e-6) return null
          tmpFriction.normalize().multiplyScalar(Math.min(len * IMPULSE_SCALE, MAX_LENGTH))
          return tmpFriction
        }}
        scale={1}
        color={PALETTE.friction}
        thickness={1.1}
      />
    </group>
  )
}