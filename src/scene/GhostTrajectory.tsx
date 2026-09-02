import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { predictTrajectory } from '../physics/engine'
import { buildRacketSurface } from '../physics/racket'
import { getScenario } from '../physics/scenarios'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'

/**
 * Ghost 预测轨迹：
 * - 自由模式：显示一条青色虚线（按当前拍位预测全程）
 * - 教学场景模式：同时显示两条虚线——
  当前（错误或正确）拍位的预测用青色，「正确接法」对应的预测用对比色
  */
export function GhostTrajectory() {
  const engine = useSimStore((s) => s.engine)
  const racketControl = useSimStore((s) => s.racketControl)
  const activeScenarioId = useSimStore((s) => s.activeScenarioId)
  const enabled = useSimStore((s) => s.display.prediction)

  const currentPoints = useMemo(() => {
    const setup = engine.snapshotSetup()
    const racketSurface = buildRacketSurface(racketControl)
    return predictTrajectory(setup, [racketSurface])
  }, [engine, racketControl])

  const correctPoints = useMemo(() => {
    if (!activeScenarioId) return []
    const scenario = getScenario(activeScenarioId)
    const setup = engine.snapshotSetup()
    const correctSurface = buildRacketSurface(scenario.correct)
    return predictTrajectory(setup, [correctSurface])
  }, [engine, activeScenarioId])

  if (!enabled) return null

  return (
    <>
      {currentPoints.length >= 2 && (
        <Line
          points={currentPoints}
          color={PALETTE.predicted}
          lineWidth={1.5}
          transparent
          opacity={0.75}
          dashed
          dashSize={0.04}
          gapSize={0.025}
        />
      )}
      {correctPoints.length >= 2 && (
        <Line
          points={correctPoints}
          color={PALETTE.compareCorrect}
          lineWidth={1.8}
          transparent
          opacity={0.85}
          dashed
          dashSize={0.04}
          gapSize={0.025}
        />
      )}
    </>
  )
}