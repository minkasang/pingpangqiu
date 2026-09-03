import { computeRacketVelocity } from '../physics/racket'
import { RACKET_ACTION_LABEL, RACKET_ACTION_ORDER } from '../physics/racket'
import type { RacketAction } from '../physics/racket'
import { useSimStore } from '../state/useSimStore'
import { fmtVec } from './format'

const PITCH_MIN = -40
const PITCH_MAX = 40
const YAW_MIN = -45
const YAW_MAX = 45
const ROLL_MIN = -45
const ROLL_MAX = 45

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
}

function SliderRow({ label, value, min, max, step, onChange, format }: SliderRowProps) {
  return (
    <label className="racket-slider">
      <span className="racket-slider-label">
        <span>{label}</span>
        <span className="racket-slider-value">{format ? format(value) : value.toFixed(0)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function describePitch(deg: number): string {
  if (deg > 5) return '后仰（接下旋）'
  if (deg < -5) return '前倾（接上旋）'
  return '竖直'
}

function exportVelocity(action: RacketAction, speed: number) {
  const v = computeRacketVelocity(action, speed)
  return fmtVec(v)
}

/** 球拍控制：位置 X/Y/Z、拍面姿态、动作预设、挥拍速度倍率 */
export function RacketControlPanel() {
  const control = useSimStore((s) => s.racketControl)
  const setRacketControl = useSimStore((s) => s.setRacketControl)
  const grip = useSimStore((s) => s.racketGrip)
  const setGrip = useSimStore((s) => s.setRacketGrip)

  return (
    <aside className="panel panel-racket">
      <h2>球拍</h2>

      <div className="racket-section">
        <h3>拍型 / 握把</h3>
        <div className="action-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '8px' }}>
          <button
            className={grip === 'shakehand' ? 'active' : ''}
            onClick={() => setGrip('shakehand')}
            title="横拍 / 长刀 (Shakehand FL 100mm 长柄)"
          >
            长柄 · 横拍 (长刀)
          </button>
          <button
            className={grip === 'penhold' ? 'active' : ''}
            onClick={() => setGrip('penhold')}
            title="直拍 / 竖拍 (Penhold CS 80mm 短柄)"
          >
            短柄 · 直拍 (竖拍)
          </button>
        </div>
      </div>

      <div className="racket-section">
        <h3>位置</h3>
        <SliderRow
          label="X  左右"
          value={control.x}
          min={-0.6}
          max={0.6}
          step={0.005}
          onChange={(x) => setRacketControl({ x })}
          format={(v) => `${v.toFixed(2)} m`}
        />
        <SliderRow
          label="Y  上下"
          value={control.y}
          min={0.05}
          max={0.9}
          step={0.005}
          onChange={(y) => setRacketControl({ y })}
          format={(v) => `${v.toFixed(2)} m`}
        />
        <SliderRow
          label="Z  前后"
          value={control.z}
          min={0.9}
          max={1.6}
          step={0.005}
          onChange={(z) => setRacketControl({ z })}
          format={(v) => `${v.toFixed(2)} m`}
        />
        <p className="hint">可直接在 3D 中拖拽拍面改变 X / Y</p>
      </div>

      <div className="racket-section">
        <h3>拍面姿态</h3>
        <SliderRow
          label="前倾/后仰"
          value={control.pitchDeg}
          min={PITCH_MIN}
          max={PITCH_MAX}
          step={1}
          onChange={(pitchDeg) => setRacketControl({ pitchDeg })}
          format={(v) => `${v.toFixed(0)}° · ${describePitch(v)}`}
        />
        <SliderRow
          label="偏转"
          value={control.yawDeg}
          min={YAW_MIN}
          max={YAW_MAX}
          step={1}
          onChange={(yawDeg) => setRacketControl({ yawDeg })}
          format={(v) => `${v.toFixed(0)}°`}
        />
        <SliderRow
          label="翻转"
          value={control.rollDeg}
          min={ROLL_MIN}
          max={ROLL_MAX}
          step={1}
          onChange={(rollDeg) => setRacketControl({ rollDeg })}
          format={(v) => `${v.toFixed(0)}°`}
        />
      </div>

      <div className="racket-section">
        <h3>触拍动作</h3>
        <div className="action-row">
          {RACKET_ACTION_ORDER.map((action) => (
            <button
              key={action}
              className={control.action === action ? 'active' : ''}
              onClick={() => setRacketControl({ action })}
            >
              {RACKET_ACTION_LABEL[action]}
            </button>
          ))}
        </div>
        <SliderRow
          label="挥拍速度倍率"
          value={control.speed}
          min={0}
          max={2}
          step={0.05}
          onChange={(speed) => setRacketControl({ speed })}
          format={(v) => `${v.toFixed(2)}×`}
        />
        <p className="hint">触拍速度 {exportVelocity(control.action, control.speed)}</p>
      </div>
    </aside>
  )
}