import { useEffect, useState } from 'react'

/**
 * 低频心跳：实时数据面板不需要 60fps 重渲染，
 * 用 15Hz 的 setState 拉取物理引擎当前值即可。
 */
export function useLiveTick(hz = 15): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let frame = 0
    let last = 0
    const interval = 1000 / hz

    const loop = (now: number) => {
      if (now - last >= interval) {
        last = now
        setTick((value) => value + 1)
      }
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [hz])

  return tick
}
