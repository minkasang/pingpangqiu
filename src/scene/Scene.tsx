import { ContactShadows, Grid, GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Quaternion } from 'three'
import { sound } from '../audio/sound'
import { BALL, FLOOR_Y } from '../physics/constants'
import { useMacroView } from '../physics/macroView'
import { computeRacketQuaternion, computeRacketVelocity } from '../physics/racket'
import { rpmOf } from '../physics/spin'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'
import { Ball } from './Ball'
import { BallOverlays } from './BallOverlays'
import { CameraRig } from './CameraRig'
import { GhostTrajectory } from './GhostTrajectory'
import { Lighting } from './Lighting'
import { PhysicsDebug } from './PhysicsDebug'
import { Racket } from './Racket'
import { SelectedContactForces } from './SelectedContactForces'
import { Table } from './Table'
import { TrajectoryTrail } from './TrajectoryTrail'

const _center = new Vector3()
const _quat = new Quaternion()
const _velocity = new Vector3()

/** 每帧先把 store 里的球拍姿态/速度同步到引擎；球接近时启用 Macro 自动慢放；触发碰撞物理音效 */
function SimRunner() {
  const lastContactCount = useRef(0)

  useFrame((_, delta) => {
    const state = useSimStore.getState()
    const { engine, playing, timeScale, racketControl, autoMacro, userTimeScale } = state
    _quat.copy(computeRacketQuaternion(racketControl.pitchDeg, racketControl.yawDeg, racketControl.rollDeg, _quat))
    computeRacketVelocity(racketControl.action, racketControl.speed, _velocity)
    _center.set(racketControl.x, racketControl.y, racketControl.z)
    engine.setRacket(_center, _quat, _velocity)

    if (!playing) {
      if (engine.contacts.length < lastContactCount.current) {
        lastContactCount.current = engine.contacts.length
      }
      return
    }

    // 碰撞音效触发
    if (engine.contacts.length > lastContactCount.current) {
      for (let i = lastContactCount.current; i < engine.contacts.length; i++) {
        const c = engine.contacts[i]
        if (!c) continue
        const relSpeed = c.before.velocity.length()
        if (c.kind === 'table') {
          sound.playTableBounce(Math.abs(c.before.velocity.y) || relSpeed)
        } else if (c.kind === 'racket') {
          sound.playRacketHit(relSpeed, rpmOf(c.before.angularVelocity))
        } else if (c.kind === 'net') {
          sound.playNetTick(relSpeed)
        }
      }
      lastContactCount.current = engine.contacts.length
    } else if (engine.contacts.length < lastContactCount.current) {
      lastContactCount.current = engine.contacts.length
    }

    // Macro 自动慢放：球接近球拍时降到 0.1×；离开时恢复用户设定的时间速度
    if (autoMacro) {
      const mode = useMacroView(engine.state.position, racketControl, BALL.radius)
      if (mode !== 'far' && timeScale > 0.1) {
        useSimStore.setState({ timeScale: 0.1 })
      } else if (mode === 'far' && timeScale === 0.1 && userTimeScale > 0.1) {
        useSimStore.setState({ timeScale: userTimeScale })
      }
    }

    engine.advance(Math.min(delta, 0.05) * (useSimStore.getState().timeScale))
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

      {/* 柔和接触阴影：消除悬浮感，增强桌腿与地面接触质感 */}
      <ContactShadows
        position={[0, FLOOR_Y + 0.004, 0]}
        opacity={0.65}
        scale={8}
        blur={1.5}
        far={2.5}
        color="#000000"
      />

      <Table />
      <Racket />
      <Ball />
      <BallOverlays />
      {trajectory && <TrajectoryTrail />}
      <GhostTrajectory />
      <PhysicsDebug />
      <SelectedContactForces />

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
