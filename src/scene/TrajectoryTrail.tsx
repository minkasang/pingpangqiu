import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial } from 'three'
import { useSimStore } from '../state/useSimStore'

const MAX_POINTS = 900

/**
 * 轨迹拖尾：固定大小的缓冲区每帧回写，越接近当前点越亮（在暗背景上
 * 表现为渐隐）。反映真实弧线、马格努斯弯曲与反弹折点。
 */
export function TrajectoryTrail() {
  const engine = useSimStore((s) => s.engine)
  const line = useRef<Line>(null)

  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(new Float32Array(MAX_POINTS * 3), 3))
    geo.setAttribute('color', new BufferAttribute(new Float32Array(MAX_POINTS * 3), 3))
    geo.setDrawRange(0, 0)
    return geo
  }, [])

  const object = useMemo(() => {
    const material = new LineBasicMaterial({ vertexColors: true, toneMapped: false })
    return new Line(geometry, material)
  }, [geometry])

  useFrame(() => {
    const samples = engine.trajectory
    const count = Math.min(samples.length, MAX_POINTS)
    const start = samples.length - count
    if (count < 2) {
      geometry.setDrawRange(0, 0)
      return
    }

    const position = geometry.getAttribute('position') as BufferAttribute
    const color = geometry.getAttribute('color') as BufferAttribute

    for (let index = 0; index < count; index += 1) {
      const sample = samples[start + index]
      if (!sample) continue
      position.setXYZ(index, sample.position.x, sample.position.y, sample.position.z)
      // 旧样本趋近黑色 → 暗背景上呈渐隐；新样本为拖尾色
      const fade = ((index + 1) / count) ** 1.6
      color.setXYZ(index, 0.36 * fade, 0.42 * fade, 0.5 * fade)
    }

    position.needsUpdate = true
    color.needsUpdate = true
    geometry.setDrawRange(0, count)
    line.current = object
  })

  return <primitive object={object} />
}
