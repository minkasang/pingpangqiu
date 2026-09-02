import { TABLE } from '../physics/constants'
import { PALETTE } from '../theme'

const NET_WIDTH = 1.83
const LINE = 0.02

const LEG_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
]

export function Table() {
  const halfWidth = TABLE.width / 2
  const halfLength = TABLE.length / 2
  const lineY = 0.0015

  return (
    <group>
      {/* 台面 */}
      <mesh position={[0, -TABLE.thickness / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[TABLE.width, TABLE.thickness, TABLE.length]} />
        <meshStandardMaterial color={PALETTE.table} roughness={0.32} metalness={0.06} />
      </mesh>

      {/* 端线 */}
      {[1, -1].map((side) => (
        <mesh key={`end-${side}`} position={[0, lineY, side * (halfLength - LINE / 2)]}>
          <boxGeometry args={[TABLE.width, 0.002, LINE]} />
          <meshStandardMaterial color={PALETTE.tableLine} roughness={0.5} />
        </mesh>
      ))}

      {/* 边线 */}
      {[1, -1].map((side) => (
        <mesh key={`edge-${side}`} position={[side * (halfWidth - LINE / 2), lineY, 0]}>
          <boxGeometry args={[LINE, 0.002, TABLE.length]} />
          <meshStandardMaterial color={PALETTE.tableLine} roughness={0.5} />
        </mesh>
      ))}

      {/* 中线 */}
      <mesh position={[0, lineY, 0]}>
        <boxGeometry args={[0.003, 0.002, TABLE.length]} />
        <meshStandardMaterial color={PALETTE.tableLine} roughness={0.5} />
      </mesh>

      {/* 球网 */}
      <mesh position={[0, TABLE.netHeight / 2, 0]}>
        <boxGeometry args={[NET_WIDTH, TABLE.netHeight, 0.006]} />
        <meshStandardMaterial color={PALETTE.net} transparent opacity={0.4} roughness={0.9} />
      </mesh>
      <mesh position={[0, TABLE.netHeight, 0]}>
        <boxGeometry args={[NET_WIDTH, 0.014, 0.012]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>

      {/* 网柱 */}
      {[1, -1].map((side) => (
        <mesh key={`post-${side}`} position={[(side * NET_WIDTH) / 2, TABLE.netHeight / 2, 0]}>
          <boxGeometry args={[0.016, TABLE.netHeight, 0.016]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.35} />
        </mesh>
      ))}

      {/* 桌腿 */}
      {LEG_OFFSETS.map(([sx, sz]) => (
        <mesh
          key={`leg-${sx}-${sz}`}
          position={[sx * (halfWidth - 0.12), -TABLE.thickness - 0.355, sz * (halfLength - 0.15)]}
          castShadow
        >
          <boxGeometry args={[0.05, 0.71, 0.05]} />
          <meshStandardMaterial color="#1f2937" roughness={0.6} metalness={0.25} />
        </mesh>
      ))}
    </group>
  )
}
