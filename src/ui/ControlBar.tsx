import { TIME_SCALES, useSimStore } from '../state/useSimStore'
import { CAMERA_LABELS, CAMERA_ORDER } from '../theme'

export function ControlBar() {
  const playing = useSimStore((s) => s.playing)
  const togglePlaying = useSimStore((s) => s.togglePlaying)
  const restart = useSimStore((s) => s.restart)
  const stepFrame = useSimStore((s) => s.stepFrame)
  const timeScale = useSimStore((s) => s.timeScale)
  const setTimeScale = useSimStore((s) => s.setTimeScale)
  const camera = useSimStore((s) => s.camera)
  const setCamera = useSimStore((s) => s.setCamera)
  const autoMacro = useSimStore((s) => s.display.autoMacro)
  const toggleDisplay = useSimStore((s) => s.toggleDisplay)

  return (
    <div className="control-bar">
      <div className="group">
        <button onClick={togglePlaying}>{playing ? '⏸ 暂停' : '▶ 播放'}</button>
        <button onClick={restart} title="重置并回到初始状态">
          ↺ 重置
        </button>
        <button onClick={stepFrame} title="前进一个物理步长（1/600 秒）">
          ⏭ 逐帧
        </button>
      </div>

      <div className="group">
        {TIME_SCALES.map((scale) => (
          <button
            key={scale}
            className={scale === timeScale ? 'active' : ''}
            onClick={() => setTimeScale(scale)}
          >
            {scale}×
          </button>
        ))}
      </div>

      <div className="group">
        {CAMERA_ORDER.map((preset) => (
          <button
            key={preset}
            className={preset === camera ? 'active' : ''}
            onClick={() => setCamera(preset)}
          >
            {CAMERA_LABELS[preset]}
          </button>
        ))}
      </div>

      <div className="group">
        <button className={autoMacro ? 'active' : ''} onClick={() => toggleDisplay('autoMacro')}>
          自动慢放
        </button>
      </div>
    </div>
  )
}
