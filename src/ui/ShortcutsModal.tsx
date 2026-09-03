import { useSimStore } from '../state/useSimStore'

interface ShortcutItem {
  keys: string[]
  label: string
}

const SHORTCUT_GROUPS: { title: string; items: ShortcutItem[] }[] = [
  {
    title: '播放与控制',
    items: [
      { keys: ['Space'], label: '播放 / 暂停模拟' },
      { keys: ['R'], label: '重新发球 / 重置模拟' },
      { keys: ['.', '→'], label: '单帧前进 (1/600s 步进)' },
    ],
  },
  {
    title: '机位视角',
    items: [
      { keys: ['1'], label: '接球者视角 (Player)' },
      { keys: ['2'], label: '侧面视角 (Side)' },
      { keys: ['3'], label: '俯视视角 (Top)' },
      { keys: ['4'], label: '跟随球视角 (Follow Ball)' },
      { keys: ['5'], label: '球拍特写视角 (Contact)' },
    ],
  },
  {
    title: '系统与交互',
    items: [
      { keys: ['M'], label: '击球音效 开 / 关' },
      { keys: ['?', 'H'], label: '查看快捷键指南' },
      { keys: ['Esc'], label: '关闭弹窗 / 取消接触高亮 / 退出教学场景' },
    ],
  },
  {
    title: '3D 鼠标与手势',
    items: [
      { keys: ['拖拽球拍'], label: '按住拍面直接在空间中拖动 X/Y 击球位置' },
      { keys: ['鼠标左键'], label: '旋转观察机位 (释放相机后自由观察)' },
      { keys: ['鼠标右键'], label: '平移机位中心' },
      { keys: ['滚轮'], label: '拉近 / 推远镜头' },
    ],
  },
]

export function ShortcutsModal() {
  const open = useSimStore((s) => s.shortcutsOpen)
  const setOpen = useSimStore((s) => s.setShortcutsOpen)

  if (!open) return null

  return (
    <div className="shortcuts-overlay" onClick={() => setOpen(false)}>
      <div
        className="shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-header">
          <h2 id="shortcuts-title">⌨️ 快捷键指南与操作手册</h2>
          <button className="close-btn" onClick={() => setOpen(false)} aria-label="关闭">
            ✕
          </button>
        </div>

        <div className="shortcuts-body">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} className="shortcuts-group">
              <h3>{group.title}</h3>
              <div className="shortcuts-list">
                {group.items.map((item) => (
                  <div key={item.label} className="shortcuts-row">
                    <span className="shortcut-desc">{item.label}</span>
                    <div className="shortcut-keys">
                      {item.keys.map((k) => (
                        <kbd key={k}>{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="shortcuts-footer">
          <span>提示：随时按 <kbd>?</kbd> 或点击控制栏的键盘图标均可唤出本指南。</span>
        </div>
      </div>
    </div>
  )
}
