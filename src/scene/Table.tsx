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
  const skirtDepth = 0.045
  const skirtThickness = 0.02

  return (
    <group>
      {/* 比赛级微磨砂台面 */}
      <mesh position={[0, -TABLE.thickness / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[TABLE.width, TABLE.thickness, TABLE.length]} />
        <meshPhysicalMaterial
          color={PALETTE.table}
          roughness={0.38}
          metalness={0.04}
          clearcoat={0.08}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* 台底加固围板框架 (Apron / Skirt) */}
      {[1, -1].map((side) => (
        <mesh
          key={`skirt-x-${side}`}
          position={[0, -TABLE.thickness - skirtDepth / 2, side * (halfLength - 0.03)]}
          castShadow
        >
          <boxGeometry args={[TABLE.width - 0.06, skirtDepth, skirtThickness]} />
          <meshStandardMaterial color="#0b2c44" roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
      {[1, -1].map((side) => (
        <mesh
          key={`skirt-z-${side}`}
          position={[side * (halfWidth - 0.03), -TABLE.thickness - skirtDepth / 2, 0]}
          castShadow
        >
          <boxGeometry args={[skirtThickness, skirtDepth, TABLE.length - 0.06]} />
          <meshStandardMaterial color="#0b2c44" roughness={0.6} metalness={0.15} />
        </mesh>
      ))}

      {/* 端线 */}
      {[1, -1].map((side) => (
        <mesh key={`end-${side}`} position={[0, lineY, side * (halfLength - LINE / 2)]}>
          <boxGeometry args={[TABLE.width, 0.002, LINE]} />
          <meshStandardMaterial color={PALETTE.tableLine} roughness={0.4} />
        </mesh>
      ))}

      {/* 边线 */}
      {[1, -1].map((side) => (
        <mesh key={`edge-${side}`} position={[side * (halfWidth - LINE / 2), lineY, 0]}>
          <boxGeometry args={[LINE, 0.002, TABLE.length]} />
          <meshStandardMaterial color={PALETTE.tableLine} roughness={0.4} />
        </mesh>
      ))}

      {/* 中线 */}
      <mesh position={[0, lineY, 0]}>
        <boxGeometry args={[0.003, 0.002, TABLE.length]} />
        <meshStandardMaterial color={PALETTE.tableLine} roughness={0.4} />
      </mesh>

      {/* 球网网面 (网眼质感) */}
      <mesh position={[0, TABLE.netHeight / 2, 0]}>
        <boxGeometry args={[NET_WIDTH, TABLE.netHeight, 0.004]} />
        <meshStandardMaterial
          color={PALETTE.net}
          transparent
          opacity={0.5}
          roughness={0.85}
          wireframe={false}
        />
      </mesh>

      {/* 球网上沿白色标准帆布包边 (15mm) */}
      <mesh position={[0, TABLE.netHeight - 0.0075, 0]}>
        <boxGeometry args={[NET_WIDTH + 0.004, 0.015, 0.008]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.45} />
      </mesh>

      {/* 球网下部张紧绳与底边 */}
      <mesh position={[0, 0.003, 0]}>
        <boxGeometry args={[NET_WIDTH, 0.006, 0.006]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* 网柱与夹具 */}
      {[1, -1].map((side) => (
        <group key={`post-assembly-${side}`} position={[(side * NET_WIDTH) / 2, 0, 0]}>
          {/* 垂直网柱 */}
          <mesh position={[0, TABLE.netHeight / 2, 0]}>
            <cylinderGeometry args={[0.009, 0.009, TABLE.netHeight, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.65} />
          </mesh>
          {/* 台面固定夹扣 */}
          <mesh position={[-side * 0.02, -TABLE.thickness / 2, 0]}>
            <boxGeometry args={[0.04, TABLE.thickness + 0.02, 0.028]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
          </mesh>
        </group>
      ))}

      {/* 桌腿与加固钢架 */}
      {LEG_OFFSETS.map(([sx, sz]) => (
        <group key={`leg-assembly-${sx}-${sz}`} position={[sx * (halfWidth - 0.12), 0, sz * (halfLength - 0.15)]}>
          {/* 主立柱 */}
          <mesh position={[0, -TABLE.thickness - 0.355, 0]} castShadow>
            <boxGeometry args={[0.048, 0.71, 0.048]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.45} />
          </mesh>
          {/* 橡胶防滑调节脚垫 */}
          <mesh position={[0, -TABLE.thickness - 0.715, 0]}>
            <cylinderGeometry args={[0.035, 0.04, 0.02, 16]} />
            <meshStandardMaterial color="#0b0f14" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 桌腿间横向与纵向加强连杆 */}
      {[-1, 1].map((sz) => (
        <mesh
          key={`brace-x-${sz}`}
          position={[0, -TABLE.thickness - 0.5, sz * (halfLength - 0.15)]}
          castShadow
        >
          <boxGeometry args={[TABLE.width - 0.24, 0.03, 0.03]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.45} />
        </mesh>
      ))}
      {[-1, 1].map((sx) => (
        <mesh
          key={`brace-z-${sx}`}
          position={[sx * (halfWidth - 0.12), -TABLE.thickness - 0.55, 0]}
          castShadow
        >
          <boxGeometry args={[0.03, 0.03, TABLE.length - 0.3]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.45} />
        </mesh>
      ))}
    </group>
  )
}
