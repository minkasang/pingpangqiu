import { Grid, GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { FLOOR_Y } from '../physics/constants'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'
import { Ball } from './Ball'
import { BallOverlays } from './BallOverlays'
import { CameraRig } from './CameraRig'
import { Lighting } from './Lighting'
import { PhysicsDebug } from './PhysicsDebug'
import { Racket } from './Racket'
import { Table } from './Table'
import { TrajectoryTrail } from './TrajectoryTrail'

/** 按真实帧间隔推进物理；慢放只改变推进量，不改变定步长，保证可复现 */
function SimRunner() {
  const engine = useSimStore((s) => s.engine)

  useFrame((_, delta) => {
    const { playing, timeScale } = useSimStore.getState()
    if (!playing) return
    engine.advance(Math.min(delta, 0.05) * timeScale)
  })

  return null
}

export function Scene() {
  const trajectory = useSimStore((s) => s.display.trajectory)

  return (
    <>
      <color attach="background" args={[PALETTE.background]} />
      <fog attach="fog" args={[PALETTE.background, 9, 24]} />

      <Lighting />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={PALETTE.floor} roughness={0.95} />
      </mesh>

      <Grid
        position={[0, FLOOR_Y + 0.002, 0]}
        args={[20, 20]}
        cellSize={0.25}
        cellThickness={0.5}
        cellColor="#1b2430"
        sectionSize={1}
        sectionThickness={0.9}
        sectionColor="#26374d"
        fadeDistance={16}
        fadeStrength={1.4}
        infiniteGrid
      />

      <Table />
      <Racket />
      <Ball />
      <BallOverlays />
      {trajectory && <TrajectoryTrail />}
      <PhysicsDebug />

      <SimRunner />
      <CameraRig />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.35}
        maxDistance={14}
        target={[0, 0.12, 0]}
      />

      <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
        <GizmoViewport axisColors={['#f43f5e', '#34d399', '#38bdf8']} labelColor="#dbe4ee" />
      </GizmoHelper>
    </>
  )
}
