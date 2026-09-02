/**
 * 全局坐标系（唯一真源，任何文件不得另立）：
 *
 *   +X  接球者右手方向（球台宽度方向）
 *   +Y  竖直向上
 *   +Z  接球者一侧（来球从 -Z 飞向 +Z）
 *
 * 单位：米 / 秒 / 千克 / 弧度每秒。
 * 原点位于球台台面中心，因此台面 y = 0，地面 y = -0.76。
 */

/** 重力加速度（Y 分量） */
export const GRAVITY = -9.81

export const TABLE = {
  /** Z 方向长度 */
  length: 2.74,
  /** X 方向宽度 */
  width: 1.525,
  /** 台面高度（坐标原点） */
  surfaceY: 0,
  thickness: 0.05,
  netHeight: 0.1525,
  /** 台面距地面高度 */
  legHeight: 0.76,
} as const

export const FLOOR_Y = -TABLE.legHeight

export const BALL = {
  radius: 0.02,
  mass: 0.0027,
} as const

/** 空心薄球壳转动惯量 I = 2/3 · m · R² */
export const BALL_INERTIA = (2 / 3) * BALL.mass * BALL.radius ** 2

export const AIR = {
  density: 1.225,
  dragCoefficient: 0.5,
} as const

/**
 * Magnus 系数 K，F_m = K · (ω × v)，等价于一阶升力模型 C_L = C_L'·S
 * （S = ωR/v 为旋转参数）。
 *
 * 标定依据：乒乓球实测 C_L 在 S ≈ 0.6~0.9 时约为 0.15~0.22。
 * 由 K = ½·ρ·A·C_L'·R 且 C_L' = C_L/S ≈ 0.24 得
 *   K = 0.5 × 1.225 × 1.257e-3 × 0.24 × 0.02 ≈ 3.7e-6
 * 取 4.0e-6。校验：6000 rpm / 15 m·s⁻¹ 时 F_m ≈ 0.038 N，约 1.4 倍重力，
 * 与强上旋弧圈球明显下扎的实际观感一致。
 *
 * 注意：这是唯一需要标定的系数，改这里即可整体调整弯曲强度。
 */
export const MAGNUS_COEFFICIENT = 4.0e-6

export const SURFACE = {
  table: { restitution: 0.8, friction: 0.25 },
  racket: { restitution: 0.55, friction: 0.6 },
  floor: { restitution: 0.6, friction: 0.3 },
} as const

export const RPM_TO_RAD = (2 * Math.PI) / 60
export const RAD_TO_RPM = 60 / (2 * Math.PI)

/** 物理定步长：1/600 s，保证 10 m/s 的球单步位移约 1.7 cm */
export const PHYSICS_DT = 1 / 600
