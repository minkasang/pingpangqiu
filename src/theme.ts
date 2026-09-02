/**
 * 颜色只表达物理含义，不随页面变化：
 *   速度类 = 蓝/青系（合速度与三个分量同族不同色，面板色块一一对应）
 *   旋转   = 琥珀
 *   力     = 紫红系（按力的种类换色相，统一箭头样式）
 *   接触   = 绿 / 橙
 *   预测   = 亮青
 */
export const PALETTE = {
  velocity: '#38bdf8',
  velocityZ: '#818cf8',
  velocityY: '#2dd4bf',
  velocityX: '#a3e635',
  angularVelocity: '#fbbf24',
  forceGravity: '#94a3b8',
  forceDrag: '#c084fc',
  forceMagnus: '#f43f5e',
  contactNormal: '#4ade80',
  friction: '#fb923c',
  predicted: '#67e8f9',
  /** 对比模式：场景激活时的「正确拍位」预测轨迹 */
  compareCorrect: '#fde047',
  trail: '#5c6773',
  table: '#12496b',
  tableLine: '#dbe4ee',
  net: '#8fa3b8',
  floor: '#0e1116',
  ball: '#f7f5f0',
  ballMark: '#fbbf24',
  racket: '#7f1d1d',
  racketBlade: '#c9a227',
  background: '#0b0d10',
} as const

export type CameraPreset = 'free' | 'player' | 'side' | 'top' | 'ball' | 'contact'

export const CAMERA_LABELS: Record<CameraPreset, string> = {
  free: '自由观察',
  player: '接球者视角',
  side: '侧面视角',
  top: '俯视视角',
  ball: '跟随球',
  contact: '球拍特写',
}

/** 除自由观察外，全部按预设机位；顺序与界面按钮一致 */
export const CAMERA_ORDER: CameraPreset[] = ['player', 'side', 'top', 'ball', 'contact', 'free']

export type InspectorMode = 'beginner' | 'physics'
