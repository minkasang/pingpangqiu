import { useRef } from 'react'
import { useSimStore } from '../state/useSimStore'
import { fmtTime } from './format'
import { useLiveTick } from './useLiveTick'

/**
 * 时间轴：物理引擎是定步长且确定性的，所以拖动时间轴可以直接
 * reset 后重放到目标时刻，保证任意位置的画面一致。
 */
export function Timeline() {
  useLiveTick(20)
  const engine = useSimStore((s) => s.engine)
  const maxRef = useRef(3)
  if (engine.time > maxRef.current) maxRef.current = engine.time

  const scrub = (seconds: number) => {
    engine.reset()
    if (seconds > 0) engine.advance(seconds)
  }

  return (
    <div className="timeline">
      <span className="time-label">{fmtTime(engine.time)}</span>
      <input
        type="range"
        min={0}
        max={maxRef.current}
        step={1 / 600}
        value={Math.min(engine.time, maxRef.current)}
        onChange={(event) => scrub(Number(event.target.value))}
      />
      <span className="time-label">{fmtTime(maxRef.current)}</span>
    </div>
  )
}
