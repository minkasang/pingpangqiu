import { Vector3 } from 'three'
import { AIR, BALL, SURFACE } from '../physics/constants'
import { dragForce, magnusForce } from '../physics/forces'
import { computeRacketVelocity, RACKET_ACTION_LABEL } from '../physics/racket'
import { getScenario } from '../physics/scenarios'
import { rpmOf, SPIN_LABEL } from '../physics/spin'
import { useSimStore } from '../state/useSimStore'
import { PALETTE } from '../theme'
import { fmt, fmtVec } from './format'
import { useLiveTick } from './useLiveTick'

const ZERO = new Vector3()

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="inspector-row">
      <span className="label">{label}</span>
      <span className="value" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="inspector-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function describeSpin(rpm: number): string {
  if (rpm >= 2500) return '强旋转'
  if (rpm >= 1000) return '中等旋转'
  if (rpm >= 200) return '弱旋转'
  return '接近不转'
}

function describeSpeed(speed: number): string {
  if (speed >= 9) return '很快'
  if (speed >= 5) return '中等'
  return '较慢'
}

function describePitch(deg: number): string {
  if (deg > 5) return '后仰'
  if (deg < -5) return '前倾'
  return '竖直'
}

/** 右侧实时数据面板。Beginner 模式只给结论，Physics 模式给完整数字 */
export function PhysicsInspector() {
  useLiveTick(15)
  const engine = useSimStore((s) => s.engine)
  const inspectorMode = useSimStore((s) => s.inspectorMode)
  const setInspectorMode = useSimStore((s) => s.setInspectorMode)

  const { velocity, angularVelocity, position } = engine.state
  const speed = velocity.length()
  const rpm = rpmOf(angularVelocity)
  const magnus = magnusForce(angularVelocity, velocity)
  const drag = dragForce(velocity)
  const gravity = BALL.mass * 9.81
  const axis = angularVelocity.lengthSq() > 1e-12 ? angularVelocity.clone().normalize() : ZERO

  return (
    <aside className="panel panel-racket">
      <div className="mode-switch">
        {(['beginner', 'physics'] as const).map((mode) => (
          <button
            key={mode}
            className={mode === inspectorMode ? 'active' : ''}
            onClick={() => setInspectorMode(mode)}
          >
            {mode === 'beginner' ? '入门' : '物理'}
          </button>
        ))}
      </div>

      {inspectorMode === 'beginner' ? (
        <>
          <Section title="来球">
            <Row label="旋转" value={`${SPIN_LABEL[useSimStore.getState().spin]} · ${describeSpin(rpm)}`} />
            <Row label="速度" value={describeSpeed(speed)} />
            <Row label="高度" value={`${fmt(Math.max(position.y, 0))} m`} />
          </Section>
          <ScenarioHint />
          <Section title="读懂画面">
            <Row label="青色箭头" value="球的飞行方向" color={PALETTE.velocity} />
            <Row label="琥珀环" value="球在转的方向" color={PALETTE.angularVelocity} />
            <Row label="红色箭头" value="让它拐弯的力" color={PALETTE.forceMagnus} />
            <Row label="黄虚线" value="正确接法的预测" color={PALETTE.compareCorrect} />
          </Section>
        </>
      ) : (
        <>
          <Section title="球">
            <Row label="速度" value={`${fmt(speed)} m/s`} color={PALETTE.velocity} />
            <Row label="转速" value={`${fmt(rpm, 0)} RPM`} color={PALETTE.angularVelocity} />
            <Row label="旋转轴" value={fmtVec(axis, 2)} />
            <Row label="速度向量" value={fmtVec(velocity)} color={PALETTE.velocity} />
            <Row label="角速度" value={fmtVec(angularVelocity, 1)} color={PALETTE.angularVelocity} />
          </Section>
          <Section title="力">
            <Row label="马格努斯" value={`${fmt(magnus.length() * 1000, 1)} mN`} color={PALETTE.forceMagnus} />
            <Row label="空气阻力" value={`${fmt(drag.length() * 1000, 1)} mN`} color={PALETTE.forceDrag} />
            <Row label="重力" value={`${fmt(gravity * 1000, 1)} mN`} color={PALETTE.forceGravity} />
            <Row label="马格努斯/重力" value={`${fmt(magnus.length() / gravity, 2)} ×`} />
          </Section>
          <Section title="球拍">
            <RacketInfo />
            <Row label="胶皮摩擦" value={fmt(SURFACE.racket.friction, 2)} color={PALETTE.friction} />
            <Row label="胶皮恢复" value={fmt(SURFACE.racket.restitution, 2)} />
          </Section>
          <Section title="环境">
            <Row label="空气密度" value={`${AIR.density} kg/m³`} />
            <Row label="模拟时间" value={`${fmt(engine.time)} s`} />
          </Section>
        </>
      )}
    </aside>
  )
}

function RacketInfo() {
  const control = useSimStore((s) => s.racketControl)
  const velocity = computeRacketVelocity(control.action, control.speed)
  return (
    <>
      <Row label="动作" value={RACKET_ACTION_LABEL[control.action]} />
      <Row label="拍面" value={`${control.pitchDeg.toFixed(0)}° · ${describePitch(control.pitchDeg)}`} />
      <Row label="偏转" value={`${control.yawDeg.toFixed(0)}°`} />
      <Row label="位置" value={`[${control.x.toFixed(2)}, ${control.y.toFixed(2)}, ${control.z.toFixed(2)}] m`} />
      <Row label="触拍速度" value={fmtVec(velocity)} color="#e2e8f0" />
    </>
  )
}

function ScenarioHint() {
  const id = useSimStore((s) => s.activeScenarioId)
  const phase = useSimStore((s) => s.scenarioPhase)
  if (!id) return null
  const scenario = getScenario(id)
  const tip = phase === 'correct' ? scenario.teachReason : scenario.failReason
  return (
    <Section title={phase === 'correct' ? '教学要点 · 正确' : '教学要点 · 错误示范'}>
      <p className="scenario-hint">{tip}</p>
    </Section>
  )
}
