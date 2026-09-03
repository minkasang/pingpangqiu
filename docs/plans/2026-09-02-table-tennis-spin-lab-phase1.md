# 乒乓球旋转实验室 Phase 1 — 物理沙盒 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans 逐任务实现本计划。

**Goal:** 搭出一个可运行、可暂停/慢放、方向完全正确的 3D 乒乓球物理沙盒：统一旋转向量驱动 Magnus 弯曲、球台反弹与旋转衰减，并用单元测试锁死所有物理方向。

**Architecture:** 物理真相由纯 TS 的 `TableTennisPhysicsEngine` 拥有（定步长积分、力、接触求解、事件记录），React 层只做可视化；Rapier 只提供碰撞检测（接触点/法线/事件），碰撞响应一律由自研 solver 算完写回。物理层不 import React/Three 组件，只用 `three` 的 Vector3，保证可在 vitest 中裸跑。

**Tech Stack:** React 19 + TypeScript + Vite + Three.js + @react-three/fiber + @react-three/drei + @react-three/rapier + Zustand + Vitest

---

## 0. 已确认的关键决策

| 决策 | 选择 |
|---|---|
| Rapier 分工 | Rapier 管刚体/几何/**碰撞检测**；自研 solver 管反弹、摩擦冲量、旋转传递 |
| UI 文案 | 全中文（含「马格努斯力」「旋转轴」等） |
| 本次范围 | Phase 1 物理沙盒，跑通并验证方向后再进 Phase 2 |

## 1. 坐标系约定（全局唯一，任何文件不得另立）

```
+X  接球者右手方向（球台宽度方向）
+Y  竖直向上
+Z  接球者一侧（来球从 -Z 飞向 +Z）
```

- 单位：米 / 秒 / 千克 / 弧度每秒
- 原点：球台台面中心；台面 `y = 0`，地面 `y = -0.76`
- 球台：长 `2.74`（Z）× 宽 `1.525`（X），球网高 `0.1525`
- 球：半径 `R = 0.02`，质量 `m = 0.0027`，转动惯量 `I = 2/3·m·R²`（空心薄壳）

## 2. 统一旋转向量 —— 7 种旋转只是不同的 ω 向量

球沿 `+Z` 飞行（`v = (0,0,+v)`）时：

| 旋转 | ω 向量 | 物理含义 |
|---|---|---|
| 无旋 | `(0,0,0)` | — |
| 上旋 | `(+ω,0,0)` | 球顶朝 +Z 走 |
| 下旋 | `(−ω,0,0)` | 球顶朝 −Z 走 |
| 左侧旋 | `(0,−ω,0)` | 轨迹向接球者左侧（−X）弯 |
| 右侧旋 | `(0,+ω,0)` | 轨迹向接球者右侧（+X）弯 |
| 侧上旋 | `normalize(+a,+b,0)·ω` | 上旋 + 右旋组合 |
| 侧下旋 | `normalize(−a,+b,0)·ω` | 下旋 + 右旋组合 |

**方向自检（F_magnus ∝ ω × v）：**

- 上旋 `ω=(ωx,0,0)`：`ω×v = (0·v−0, 0−ωx·v, 0) = (0,−ωx·v,0)` → **−Y 向下**，上旋下沉 ✓
- 右侧旋 `ω=(0,ωy,0)`：`ω×v = (ωy·v, 0, 0)` → **+X**，向接球者右手边弯 ✓

## 3. 力模型

- 重力：`F_g = m·g`，`g = (0,−9.81,0)`
- 空气阻力：`F_d = −½·ρ·C_d·A·|v|·v`，`ρ=1.225`，`C_d=0.5`，`A=πR²`
- 马格努斯力：`F_m = K·(ω × v)`，`K = ½·ρ·C_L′·A·R ≈ 1.5e-5`（单一可调系数，集中放常量表）

量级标定：`ω = 3000 rpm (314 rad/s)`、`v = 10 m/s` →
`|F_m| = 1.5e-5 × 314 × 10 ≈ 0.047 N`，对比 `m·g = 0.0265 N` ≈ **1.8 倍重力**。
乒乓球弯折确实强于重力，量级合理；`v = 10` 时阻力 `≈ 0.039 N ≈ 1.5 倍重力`，同样合理。

## 4. 接触求解（球台与球拍共用同一套公式）

```
r_c = −R·n                      球心 → 接触点
法向：  v_n′ = −e·v_n            e_table ≈ 0.80，e_racket ≈ 0.55
切向滑移： u = (v − v_拍) 的切向分量 + ω × r_c
止滑所需冲量： J_stop = |u| / (1/m + R²/I) = 0.4·m·|u|   （因 I = ⅔mR²）
摩擦冲量： J_t = min(μ·J_n, J_stop)，方向 = −û
写回： v += (J_t/m)·(−û) + 法向分量
       ω += (r_c × J) / I
```

**上旋落台「往前窜」自检**（`ω=(+ωx,0,0)`、`v=(0,0,+v)`、`n=+Y`、`r_c=(0,−R,0)`）：

- `ω × r_c = (0,0,−ωx·R)`
- `u = (0, 0, v − ωx·R)`；强上旋时 `ωx·R > v` → `u` 指向 −Z
- 摩擦冲量沿 +Z → **水平速度增大**（前窜）✓
- `r_c × J = (−R·J_t, 0, 0)` → `ωx` 减小 → **转速衰减** ✓

**禁止**出现 `if (topspin) ball.y += x` 这类写死效果。

## 5. 文件布局

```
src/
  physics/
    constants.ts     坐标系、尺寸、物理系数（唯一真源）
    types.ts         BallState / SpinType / ContactInfo / ContactEvent
    spin.ts          SpinType <-> angularVelocity（统一旋转向量）
    forces.ts        重力 / 阻力 / Magnus
    contact.ts       法向 + 切向摩擦冲量求解（台 / 拍通用）
    engine.ts        TableTennisPhysicsEngine：定步长积分、事件、轨迹采样
    *.test.ts        方向正确性测试（vitest）
  scene/
    Scene.tsx  Table.tsx  Ball.tsx  Racket.tsx
    SpinAxis.tsx  RotationRing.tsx  VectorArrow.tsx  TrajectoryTrail.tsx
    Lighting.tsx  PhysicsDebug.tsx
  state/useSimStore.ts   Zustand
  ui/
    SpinLibrary.tsx  PhysicsInspector.tsx  Timeline.tsx  TopBar.tsx
```

## 6. 任务

### Task 1 — 脚手架与依赖
- Create: `package.json` `tsconfig.json` `vite.config.ts` `index.html` `src/main.tsx` `src/App.tsx`
- 安装：react 19 / three 0.185 / @react-three/fiber 9 / drei 10 / rapier 2 / zustand 5 / vite 7 / typescript 5.9 / vitest 3 / @vitejs/plugin-react 5
- `git init` + 首次提交
- Verify: `pnpm build` exit 0；`pnpm vitest run` 能跑

### Task 2 — 物理地基（constants + types + spin）
- Create: `src/physics/constants.ts` `src/physics/types.ts` `src/physics/spin.ts` `src/physics/spin.test.ts`
- Verify: `pnpm vitest run src/physics/spin.test.ts` — 7 种旋转的 ω 方向、RPM 换算、上旋 Magnus 向下、右旋 Magnus 向 +X

### Task 3 — 力模型（forces）
- Create: `src/physics/forces.ts` `src/physics/forces.test.ts`
- Verify: 阻力与速度反向；Magnus 与 v、ω 垂直；3000rpm/10ms⁻¹ 量级落在 0.03–0.07 N

### Task 4 — 接触求解（contact）
- Create: `src/physics/contact.ts` `src/physics/contact.test.ts`
- Verify: 上旋落台水平加速 + 转速下降；下旋落台水平减速；右旋落台产生 +X 横向速度；法向反弹 e 正确

### Task 5 — 引擎（engine）
- Create: `src/physics/engine.ts` `src/physics/engine.test.ts`
- 定步长 `dt = 1/600`，子步进；轨迹采样；接触事件记录（before/after 状态）
- Verify: 上旋弹跳距离 < 下旋弹跳距离（同入射角）；无旋球对称；能量单调不增

### Task 6 — 最小 R3F 场景
- Create: `src/scene/Scene.tsx` `Table.tsx` `Ball.tsx` `Lighting.tsx` `src/state/useSimStore.ts`
- Verify: `pnpm dev` 打开可见球台与飞行中的球，OrbitControls 可 360° 转

### Task 7 — Rapier 接触检测接入
- 先读 `node_modules/@react-three/rapier` 源码确认手动 step 与 collision event payload 形状
- Verify: 球落台时控制台打印接触点/法线，且法线 ≈ +Y

### Task 8 — 旋转可视化
- Create: `SpinAxis.tsx` `RotationRing.tsx`，球表面色环 + 标记点
- Verify: 切换旋转类型，轴与环方向实时变化；上旋轴指向 +X

### Task 9 — 力矢量与轨迹
- Create: `VectorArrow.tsx` `TrajectoryTrail.tsx`
- Verify: 打开力显示后 v / Fm / Fd / Fg 箭头方向符合第 2 节表

### Task 10 — 播放控制与 Timeline
- Create: `Timeline.tsx`（0.05x–1x、逐帧、拖动、Restart）
- Verify: 暂停后逐帧前进一帧 = 1/600 s；慢放下轨迹不变

### Task 11 — Spin Library + Physics Inspector
- Create: `SpinLibrary.tsx` `PhysicsInspector.tsx`（Beginner / Physics 双模式）
- Verify: 点击 7 种旋转之一 → 预览 → Run Simulation 出球

### Task 12 — Physics Debug + 方向总复核
- Create: `PhysicsDebug.tsx`（collider / 接触点 / 法线 / 各矢量 / 轨迹采样点）
- Verify: 逐条核对第 2、3、4 节的方向自检，全部与画面一致；`pnpm build` + 全量测试通过

---

# Phase 2 — Racket Interaction（2026-09-02 追加）

Phase 1 已完成并经用户确认。Phase 2 目标：球拍成为可交互物理对象。

## 已确认事实
- 解析接触求解已支持移动表面（surfaceVelocity）与任意朝向（有向包围盒），
  Phase 2 无需新的物理公式，只做接入与参数化
- 合法发球已实现（先落发球方，过网，再落接球方）

## 任务

### Task 13 — 球拍状态与引擎接入
- Create: `src/physics/racket.ts`（RacketControl 状态、5 种动作预设速度、
  pitch/yaw/roll → 四元数、默认拍位）
- Modify: `engine.ts` 增加球拍表面与 `setRacket()`；`predictTrajectory()` 纯函数
- Verify: 移动球拍接触测试（顶拍更快、托拍向上、拍面角度改变出球方向）

### Task 14 — 球拍控制面板
- Create: `ui/RacketControlPanel.tsx`：位置 X/Y/Z、角度 前倾±40°/偏转±45°/翻转±45°、
  动作预设（挡/搓/攻/拉/削）+ 速度倍率
- 挂载在右侧检查器下方

### Task 15 — 3D 球拍拖拽与姿态
- Modify: `Racket.tsx` 由 store 驱动姿态；刀面直接拖拽改 X/Y（拖拽时禁用 OrbitControls）
- 球拍速度箭头（白色）挂球拍中心

### Task 16 — Ghost 预测轨迹
- Create: `scene/GhostTrajectory.tsx`：drei Line 虚线，颜色 predicted
- 从初始状态按当前球拍参数预测全程（含球拍反弹），球拍参数变化即重算

### Task 17 — 检查器与显示选项
- PhysicsInspector 增加球拍区块；DisplayOptions 增加 预测轨迹 / 球拍速度 两项

### Task 18 — Phase 2 行为测试
- 顶/托/角度/预测确定性；默认拍位下上旋发球可被挡回

---

# Phase 3 — Teaching Scenarios（2026-09-02 完成）

## 目标
按 spec §22 Phase 3：接收上旋 / 下旋 / 左侧旋 / 右侧旋 + 错误动作 vs 正确动作。

## 设计
- `physics/scenarios.ts` 定义 4 个场景，每个含 spin / wrong / correct 拍位 / 失败原因 / 教学原因
- `applyScenario(id)`：锁定旋转 + 转速、应用「错误拍位」、暂停
- `applyScenarioCorrect()` / `revertScenarioToWrong()`：在场景内切换
- GhostTrajectory 场景激活时同时画两条预测虚线（青色=当前 / 黄绿=正确接法）
- PhysicsInspector Beginner 模式显示「教学要点」区块
- 测试：6 项，覆盖 4 种场景的错误 vs 正确方向差异

## 完成
- ✓ 64/64 测试
- ✓ tsc --noEmit 通过
- ✓ commit a809ad6 已推 origin/master

---

# Phase 4 — Visualization（2026-09-02 进行中）

## 目标
按 spec §22 Phase 4：Macro Contact View / 力矢量 / 碰撞检查器 / before / after / 轨迹对比。

## 任务（已创建，状态见任务列表）
- Task 23 — 接触点编号 ①②③ + PhysicsInspector 增加「接触」区域（点击展开 before/after：速度/转速/旋转轴/法向冲量/摩擦冲量/滑移速度）
- Task 24 — 选中接触点时，在接触位置显示 N（绿）+ 摩擦冲量（橙）矢量
- Task 25 — Macro Contact View：球距球拍 <10cm 时 timeScale 0.1×；<3cm 推近镜头、球放大、显示接触点切向速度、轻微视觉夸张（球压缩）
- Task 26 — 微观状态测试：useMacroView 纯函数 + 接触点编号稳定

## 设计要点
- Macro 触发距离阈值从 useSimStore 读取（常量写源码顶部）
- 选中接触点用 store 中 `selectedContactId: number | null` 维护
- 接触点编号按 engine.contacts 顺序稳定：① ② ③…
- 力矢量在 BallOverlays 外单独组件，避免双重变换

---

# Phase 5 — Polish（未开始）
按 spec §22 Phase 5：灯光 / 材质 / UI / 镜头动画 / 响应式 / 性能 / 可访问性。

## 已做（散落各阶段）
- 灯光、相机预设、OrbitControls 阻尼
- 颜色/动效克制（spec §19, §20）
- 教学文案、因果链表述
- 自动化测试覆盖所有物理方向

## 剩余可考虑
- 球体材质（程序化磨砂 / 渐变高光）
- 桌面抗反射（contactShadows）
- 球拍/桌面 PBR 材质、胶皮程序纹理
- 移动端响应式（面板折叠、触屏拖动）
- 可访问性（键盘快捷键、ARIA、reduce-motion）
- 性能：DRACO 压缩、代码分割（drei 太大）

---

# 总体文件结构（持续更新）

```
src/
  physics/
    constants.ts    坐标系 / 球台 / 球 / 空气 / Magnus / 接触
    types.ts        BallState / SpinType / ContactInfo / ContactEvent / TrajectorySample
    spin.ts         7 种旋转 → ω 向量
    forces.ts       gravity / drag / magnus
    contact.ts      球台/球拍共用接触求解
    surface.ts      BoxSurface + 解析检测
    engine.ts       TableTennisPhysicsEngine + predictTrajectory
    launch.ts       每种旋转对应合法发球（先落发球方台面，过网，再落接球方台面）
    racket.ts       RacketControl + 5 动作 + pitch/yaw/roll → 四元数 + buildRacketSurface
    scenarios.ts    4 教学场景：错误 vs 正确接法
    *.test.ts       单元测试（64 项）
  scene/
    Scene.tsx       Canvas 内容装配
    Table.tsx       程序化球台 + 白线 + 球网 + 桌腿
    Ball.tsx        球 + 表面色环/极点标记（姿态由 store 驱动）
    BallOverlays.tsx 跟随球心：旋转轴、旋转环、速度三分量、力
    Racket.tsx      store 驱动姿态 + 直接拖拽 + 球拍速度箭头
    RotationRing.tsx 随 ω 方向、箭头按右手定则
    SpinAxis.tsx    旋转轴 + ω 标签
    VectorArrow.tsx 通用箭头（原点在父级）
    TrajectoryTrail.tsx 实际轨迹拖尾
    GhostTrajectory.tsx 预测轨迹（场景激活时双虚线）
    PhysicsDebug.tsx 碰撞体线框 + 接触点/法线
    CameraRig.tsx   预设机位 + 拖拽时释放控制权
    Lighting.tsx    半球光 + 主光 + 补光
  state/useSimStore.ts zustand：spin/rpm/engine/playing/display/camera/racketControl/scenario
  ui/
    SpinLibrary.tsx         7 选 + 转速 + 运行
    ScenariosPanel.tsx      4 教学场景 + 错误/正确切换
    DisplayOptionsPanel.tsx 14 个独立开关
    PhysicsInspector.tsx    Beginner/Physics 双模式
    RacketControlPanel.tsx  位置/角度/动作/速度
    ControlBar.tsx          播放/速率/机位
    Timeline.tsx            时间轴（确定性拖动）
  theme.ts           调色板 + 机位枚举
  App.tsx            布局：左 aside (旋转库/场景/显示) + 3D + 右 aside (检查器/球拍) + 底部控制
```

---

# 工作流约定（续作时请沿用）

1. **superpowers 工作流**（已写入 memory）：brainstorming → writing-plans → subagent-driven-development / executing-plans → TDD → verification-before-completion
2. **物理方向正确性是底线**：所有视觉/UI 改完都必须 `pnpm vitest run` 全绿
3. **每阶段 commit + 推送**：用户已说明从其环境直接 git push，本沙箱 TLS 不可达
4. **新 AI 接续**先 `pnpm typecheck && pnpm vitest run` 确认状态，再读本计划文档与 src/physics/scenarios.ts 续作

