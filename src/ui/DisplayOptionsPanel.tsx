import { useSimStore } from '../state/useSimStore'
import type { DisplayOptions } from '../state/useSimStore'
import { PALETTE } from '../theme'

interface DisplayItem {
  key: keyof DisplayOptions
  label: string
  color?: string
}

interface DisplayGroup {
  title: string
  items: DisplayItem[]
}

const GROUPS: DisplayGroup[] = [
  {
    title: '速度分解',
    items: [
      { key: 'velocity', label: '合速度 v', color: PALETTE.velocity },
      { key: 'velocityZ', label: '前后分量 vz', color: PALETTE.velocityZ },
      { key: 'velocityY', label: '垂直分量 vy', color: PALETTE.velocityY },
      { key: 'velocityX', label: '左右分量 vx', color: PALETTE.velocityX },
    ],
  },
  {
    title: '力',
    items: [
      { key: 'magnus', label: '马格努斯力 Fm', color: PALETTE.forceMagnus },
      { key: 'drag', label: '空气阻力 Fd', color: PALETTE.forceDrag },
      { key: 'gravity', label: '重力 Fg', color: PALETTE.forceGravity },
    ],
  },
  {
    title: '旋转与轨迹',
    items: [
      { key: 'spinAxis', label: '旋转轴 ω', color: PALETTE.angularVelocity },
      { key: 'spinRing', label: '旋转环', color: PALETTE.angularVelocity },
      { key: 'trajectory', label: '轨迹拖尾', color: '#8fa3b8' },
    ],
  },
  {
    title: '调试',
    items: [
      { key: 'colliderDebug', label: '碰撞体线框', color: '#2dd4bf' },
      { key: 'contactDebug', label: '接触点与法线', color: PALETTE.contactNormal },
    ],
  },
]

/** 左侧显示选项：每个可视化元素独立开关，色块与 3D 箭头颜色一致 */
export function DisplayOptionsPanel() {
  const display = useSimStore((s) => s.display)
  const toggleDisplay = useSimStore((s) => s.toggleDisplay)

  return (
    <section className="display-panel">
      <h2>显示选项</h2>
      {GROUPS.map((group) => (
        <div key={group.title} className="display-group">
          <h3>{group.title}</h3>
          {group.items.map((item) => (
            <label key={item.key} className="display-item">
              <input
                type="checkbox"
                checked={display[item.key]}
                onChange={() => toggleDisplay(item.key)}
              />
              {item.color && (
                <span className="display-dot" style={{ background: item.color }} />
              )}
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      ))}
    </section>
  )
}
