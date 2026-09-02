import { SCENARIOS } from '../physics/scenarios'
import { useSimStore } from '../state/useSimStore'
import type { ScenarioId } from '../physics/scenarios'

/** 教学场景面板：进入场景后会在 3D 中同时画出「错误」与「正确」两条预测虚线 */
export function ScenariosPanel() {
  const activeId = useSimStore((s) => s.activeScenarioId)
  const phase = useSimStore((s) => s.scenarioPhase)
  const applyScenario = useSimStore((s) => s.applyScenario)
  const applyCorrect = useSimStore((s) => s.applyScenarioCorrect)
  const revert = useSimStore((s) => s.revertScenarioToWrong)
  const clearScenario = useSimStore((s) => s.clearScenario)

  const active = activeId ? SCENARIOS.find((s) => s.id === activeId) : null

  return (
    <section className="scenarios-panel">
      <h2>教学场景</h2>
      <div className="scenario-list">
        {SCENARIOS.map((scenario) => (
          <button
            className={scenario.id === activeId ? 'active' : ''}
            key={scenario.id}
            onClick={() => applyScenario(scenario.id as ScenarioId)}
          >
            {scenario.label}
          </button>
        ))}
      </div>

      {active && (
        <div className="scenario-detail">
          <h3 className={`phase phase-${phase}`}>
            {phase === 'wrong' ? '错误示范' : phase === 'correct' ? '正确接法' : '预览'}
          </h3>
          <p className="reason">{phase === 'correct' ? active.teachReason : active.failReason}</p>
          <div className="scenario-actions">
            {phase === 'wrong' ? (
              <button className="primary" onClick={applyCorrect}>
                ▶ 应用正确接法
              </button>
            ) : (
              <button onClick={revert}>↩ 返回错误示范</button>
            )}
            <button onClick={clearScenario}>退出场景</button>
          </div>
        </div>
      )}
    </section>
  )
}