import { useMemo } from 'react'
import { Quaternion, Vector3 } from 'three'
import { useSimStore } from '../state/useSimStore'
import { useLiveTick } from '../ui/useLiveTick'
import type { ContactEvent, SurfaceKind } from '../physics/types'

const UP = new Vector3(0, 1, 0)

const KIND_COLOR: Record<SurfaceKind, string> = {
  table: '#4ade80',
  racket: '#fb923c',
  floor: '#94a3b8',
  net: '#38bdf8',
}

const MAX_MARKERS = 12

function NormalArrow({ contact }: { contact: ContactEvent }) {
  const quaternion = useMemo(
    () => new Quaternion().setFromUnitVectors(UP, contact.normal.clone().normalize()),
    [contact],
  )

  return (
    <group quaternion={quaternion}>
      <mesh position={[0, 0.028, 0]}>
        <cylinderGeometry args={[0.0018, 0.0018, 0.056, 6]} />
        <meshBasicMaterial color={KIND_COLOR[contact.kind]} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** 最近几次接触的接触点 + 法线，用于核对碰撞求解方向 */
function ContactMarkers() {
  useLiveTick(10)
  const engine = useSimStore((s) => s.engine)
  const recent = engine.contacts.slice(-MAX_MARKERS)

  return (
    <>
      {recent.map((contact) => (
        <group key={contact.id} position={contact.point}>
          <mesh>
            <sphereGeometry args={[0.009, 12, 8]} />
            <meshBasicMaterial color={KIND_COLOR[contact.kind]} toneMapped={false} />
          </mesh>
          <NormalArrow contact={contact} />
        </group>
      ))}
    </>
  )
}

/** 把引擎实际用于求解的碰撞体画出来，避免「画面和物理不一致」 */
function SurfaceBoxes() {
  const engine = useSimStore((s) => s.engine)

  return (
    <>
      {engine.surfaces.map((surface, index) => (
        <mesh
          key={`${surface.kind}-${index}`}
          position={surface.center}
          quaternion={surface.rotation}
        >
          <boxGeometry
            args={[
              surface.halfExtents.x * 2,
              surface.halfExtents.y * 2,
              surface.halfExtents.z * 2,
            ]}
          />
          <meshBasicMaterial color="#2dd4bf" wireframe transparent opacity={0.3} />
        </mesh>
      ))}
    </>
  )
}

export function PhysicsDebug() {
  const colliderDebug = useSimStore((s) => s.display.colliderDebug)
  const contactDebug = useSimStore((s) => s.display.contactDebug)
  if (!colliderDebug && !contactDebug) return null

  return (
    <>
      {colliderDebug && <SurfaceBoxes />}
      {contactDebug && <ContactMarkers />}
    </>
  )
}
