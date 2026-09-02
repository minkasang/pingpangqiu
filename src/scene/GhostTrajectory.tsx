import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { predictTrajectory } from '../physics/engine'
import { buildRacketSurface } from '../physics/racket'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'

export function GhostTrajectory() {
  const engine = useSimStore((s) => s.engine)
  const racketControl = useSimStore((s) => s.racketControl)
  const enabled = useSimStore((s) => s.display.prediction)

  const points = useMemo(() => {
    const setup = engine.snapshotSetup()
    const racketSurface = buildRacketSurface(racketControl)
    return predictTrajectory(setup, [racketSurface])
  }, [engine, racketControl])

  if (!enabled || points.length < 2) return null

  return (
    <Line
      points={points}
      color={PALETTE.predicted}
      lineWidth={1.5}
      transparent
      opacity={0.7}
      dashed
      dashSize={0.04}
      gapSize={0.025}
    />
  )
}