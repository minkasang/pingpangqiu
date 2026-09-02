import { SPIN_LABEL, SPIN_LIBRARY } from '../physics/spin'
import { useSimStore } from '../state/useSimStore'

/**
 * 旋转库：点击只切换预览并暂停（spec 第八节要求不立即播放），
 * 由「运行模拟」按钮启动。
 */
export function SpinLibrary() {
  const spin = useSimStore((s) => s.spin)
  const rpm = useSimStore((s) => s.rpm)
  const setSpin = useSimStore((s) => s.setSpin)
  const setRpm = useSimStore((s) => s.setRpm)
  const setPlaying = useSimStore((s) => s.setPlaying)

  return (
    <aside className="panel panel-left">
      <h2>旋转库</h2>
      <div className="spin-list">
        {SPIN_LIBRARY.map((type) => (
          <button
            key={type}
            className={type === spin ? 'active' : ''}
            onClick={() => setSpin(type)}
          >
            {SPIN_LABEL[type]}
          </button>
        ))}
      </div>

      <label className="rpm-row">
        <span>转速 {rpm} RPM</span>
        <input
          type="range"
          min={0}
          max={6000}
          step={100}
          value={rpm}
          onChange={(event) => setRpm(Number(event.target.value))}
        />
      </label>

      <button className="run-button" onClick={() => setPlaying(true)}>
        ▶ 运行模拟
      </button>

      <p className="hint">
        提示：球沿 +Z 方向飞向接球者。切换旋转后按「运行模拟」查看完整飞行、
        落台反弹与旋转衰减。
      </p>
    </aside>
  )
}
