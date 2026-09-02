import { PALETTE, RACKET_POSITION } from '../theme'

/**
 * 程序化球拍：第一版不追求精细模型，重点是姿态清晰可读
 * （拍面朝向决定回球方向，这一点必须一眼看出来）。
 */
export function Racket() {
  return (
    <group position={RACKET_POSITION} rotation={[0, -0.35, 0.42]}>
      {/* 胶皮 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 0.008, 48]} />
        <meshStandardMaterial color={PALETTE.racket} roughness={0.85} />
      </mesh>
      {/* 底板 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.008]} castShadow>
        <cylinderGeometry args={[0.078, 0.078, 0.006, 48]} />
        <meshStandardMaterial color={PALETTE.racketBlade} roughness={0.55} metalness={0.15} />
      </mesh>
      {/* 拍柄 */}
      <mesh position={[0, -0.125, 0.009]} castShadow>
        <boxGeometry args={[0.028, 0.11, 0.022]} />
        <meshStandardMaterial color="#5b3a1c" roughness={0.7} />
      </mesh>
    </group>
  )
}
