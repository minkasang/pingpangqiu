import {
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Shape,
  Vector2,
} from 'three'

/**
 * 专业级乒乓球拍高精度几何生成器。
 * 100% 忠实提取自用户上传的红双喜实物照片 (DHS 4002 横拍 / 4006 直拍)：
 * 
 * 1. 真实板面与胶皮 (150mm 宽 × 155mm 高)：
 *    - 饱满圆润大椭圆水滴形拍头，最大肚位 150mm 位于中腰 (y ≈ -0.010m)；
 *    - 边缘全周由真实照片像素逐点采样的圆润曲线环绕；
 *    - 胶皮下沿在 y = -0.0769m 处带有微弧过渡，展现正规赛拍胶皮与纯木拍肩的比例；
 * 
 * 2. 真实马鞍凹弧拍肩 (Concave Wood Shoulder)：
 *    - 从胶皮两侧下沿 (x = ±0.0463m, y = -0.0769m) 优雅向内凹滑至握把颈部 (x = ±0.0135m, y = -0.0980m)；
 *    - 在横拍正面形成标志性的两侧对称纯木三角翼，直拍则呈现舒适的纯木虎口区；
 * 
 * 3. 真实手柄流线：
 *    - 横拍 FL：颈部 27mm，腰部 23.8mm，底部 32.6mm 饱满喇叭口，柄长约 98mm；
 *    - 直拍 CS：颈部 26mm，底部 29.6mm 紧凑圆柱微锥短柄，柄长约 72mm。
 */

export type RacketGripType = 'shakehand' | 'penhold'

/**
 * 照片逐点采样的胶皮/板面上半周流线坐标 [x, y] (单位：米，单侧半宽)
 */
export const PHOTO_RUBBER_POINTS: [number, number][] = [
  [0.0, 0.0775],
  [0.0176, 0.0753],
  [0.0254, 0.0731],
  [0.0309, 0.0709],
  [0.0353, 0.0687],
  [0.0392, 0.0665],
  [0.0425, 0.0642],
  [0.0452, 0.062],
  [0.048, 0.0598],
  [0.0502, 0.0576],
  [0.0524, 0.0554],
  [0.0546, 0.0532],
  [0.0563, 0.051],
  [0.0579, 0.0488],
  [0.0596, 0.0466],
  [0.0612, 0.0444],
  [0.0623, 0.0422],
  [0.0634, 0.04],
  [0.0645, 0.0378],
  [0.0656, 0.0356],
  [0.0662, 0.0334],
  [0.0673, 0.0312],
  [0.0678, 0.029],
  [0.0689, 0.0267],
  [0.0695, 0.0245],
  [0.07, 0.0223],
  [0.0706, 0.0201],
  [0.0711, 0.0179],
  [0.0717, 0.0157],
  [0.0722, 0.0135],
  [0.0728, 0.0113],
  [0.0733, 0.0091],
  [0.0733, 0.0069],
  [0.0739, 0.0047],
  [0.0739, 0.0025],
  [0.0744, 0.0003],
  [0.0744, -0.0019],
  [0.0744, -0.0041],
  [0.075, -0.0063],
  [0.075, -0.0085],
  [0.075, -0.0108],
  [0.075, -0.013],
  [0.0744, -0.0152],
  [0.0744, -0.0174],
  [0.0744, -0.0196],
  [0.0744, -0.0218],
  [0.0739, -0.024],
  [0.0739, -0.0262],
  [0.0733, -0.0284],
  [0.0728, -0.0306],
  [0.0722, -0.0328],
  [0.0722, -0.035],
  [0.0717, -0.0372],
  [0.0711, -0.0394],
  [0.0706, -0.0416],
  [0.07, -0.0438],
  [0.0689, -0.046],
  [0.0684, -0.0483],
  [0.0678, -0.0505],
  [0.0667, -0.0527],
  [0.0656, -0.0549],
  [0.0645, -0.0571],
  [0.0634, -0.0593],
  [0.0623, -0.0615],
  [0.0607, -0.0637],
  [0.059, -0.0659],
  [0.0568, -0.0681],
  [0.0546, -0.0703],
  [0.0524, -0.0725],
  [0.0496, -0.0747],
  [0.0463, -0.0769],
]

/**
 * 照片逐点采样的纯木拍肩马鞍凹弧 [x, y]
 */
export const PHOTO_SHOULDER_POINTS: [number, number][] = [
  [0.0463, -0.0769],
  [0.0441, -0.0797],
  [0.0436, -0.0813],
  [0.041, -0.083],
  [0.0325, -0.0847],
  [0.0281, -0.0863],
  [0.0248, -0.088],
  [0.0226, -0.0896],
  [0.02, -0.0913],
  [0.0175, -0.0929],
  [0.0155, -0.0946],
  [0.0142, -0.0962],
  [0.0135, -0.098],
]

/**
 * 照片逐点采样的横拍 FL 手柄侧缘流线 [x, y]
 */
export const PHOTO_HANDLE_FL_POINTS: [number, number][] = [
  [0.0135, -0.0775],
  [0.0128, -0.085],
  [0.0124, -0.095],
  [0.0121, -0.105],
  [0.0119, -0.115],
  [0.0119, -0.125],
  [0.0122, -0.135],
  [0.013, -0.145],
  [0.014, -0.155],
  [0.0152, -0.165],
  [0.0163, -0.174],
]

/**
 * 生成底板五层纯木几何体多边形
 */
export function generateBladePoints(grip: RacketGripType = 'shakehand'): Vector2[] {
  const pts: Vector2[] = []
  const isShakehand = grip === 'shakehand'
  const buttY = isShakehand ? -0.174 : -0.17
  const neckX = 0.0135
  const neckY = -0.098

  // 1. 实木舌部：穿过手柄延伸至尾部 (右颈 -> 右底 -> 左底 -> 左颈)
  pts.push(new Vector2(neckX, neckY))
  pts.push(new Vector2(neckX, buttY))
  pts.push(new Vector2(-neckX, buttY))
  pts.push(new Vector2(-neckX, neckY))

  // 2. 左侧拍肩：沿实物采样点向上展开至左裁胶点
  for (let i = PHOTO_SHOULDER_POINTS.length - 1; i >= 0; i--) {
    const pt = PHOTO_SHOULDER_POINTS[i]!
    pts.push(new Vector2(-pt[0], pt[1]))
  }

  // 3. 左侧板面外弧：沿实物采样点向上至拍顶 crown
  for (let i = PHOTO_RUBBER_POINTS.length - 1; i >= 0; i--) {
    const pt = PHOTO_RUBBER_POINTS[i]!
    pts.push(new Vector2(-pt[0], pt[1]))
  }

  // 4. 右侧板面外弧：对称下行至右裁胶角
  for (let i = 1; i < PHOTO_RUBBER_POINTS.length; i++) {
    const pt = PHOTO_RUBBER_POINTS[i]!
    pts.push(new Vector2(pt[0], pt[1]))
  }

  // 5. 右侧拍肩：对称下行至右拍喉
  for (let i = 1; i < PHOTO_SHOULDER_POINTS.length; i++) {
    const pt = PHOTO_SHOULDER_POINTS[i]!
    pts.push(new Vector2(pt[0], pt[1]))
  }

  return pts
}

/**
 * 生成胶皮/海绵层多边形 (100% 吻合实物照片红胶皮)
 */
export function generateRubberPoints(): Vector2[] {
  const pts: Vector2[] = []
  const cutY = -0.0769
  const cutW = 0.0463

  // 1. 底部下沿：微内凹 2mm 贴指柔和微弧，彻底消灭生硬直线刀切感
  const N = 24
  for (let i = 0; i <= N; i++) {
    const t = -1 + 2 * (i / N) // -1 到 +1
    const x = t * cutW
    const y = cutY + 0.002 * (1 - t * t)
    pts.push(new Vector2(x, y))
  }

  // 2. 右侧板面流线逆时针上行至拍顶
  for (let i = PHOTO_RUBBER_POINTS.length - 1; i >= 0; i--) {
    const pt = PHOTO_RUBBER_POINTS[i]!
    pts.push(new Vector2(pt[0], pt[1]))
  }

  // 3. 左侧板面流线对称下行至左下角
  for (let i = 1; i < PHOTO_RUBBER_POINTS.length; i++) {
    const pt = PHOTO_RUBBER_POINTS[i]!
    pts.push(new Vector2(-pt[0], pt[1]))
  }

  return pts
}

/**
 * 生成符合人体工学握持手感的手柄贴片截面多边形
 */
export function generateHandlePoints(grip: RacketGripType = 'shakehand'): Vector2[] {
  const pts: Vector2[] = []
  const isShakehand = grip === 'shakehand'
  const topY = isShakehand ? -0.0775 : -0.098
  const buttY = isShakehand ? -0.174 : -0.17
  const topW = isShakehand ? 0.0135 : 0.013
  const buttW = isShakehand ? 0.0163 : 0.0148
  const rButt = 0.0025

  // 1. 顶部贴指弧：贴合喉部天然弧度
  const topSteps = 12
  for (let i = 0; i <= topSteps; i++) {
    const s = -1 + 2 * (i / topSteps)
    const x = s * topW
    const y = topY + 0.001 * (1 - s * s)
    pts.push(new Vector2(x, y))
  }

  // 2. 右侧流线边缘
  if (isShakehand) {
    for (let i = 1; i < PHOTO_HANDLE_FL_POINTS.length - 1; i++) {
      const pt = PHOTO_HANDLE_FL_POINTS[i]!
      pts.push(new Vector2(pt[0], pt[1]))
    }
  } else {
    for (let i = 1; i <= 10; i++) {
      const t = i / 10
      const y = topY + (buttY - topY) * t
      const x = topW + (buttW - topW) * t
      pts.push(new Vector2(x, y))
    }
  }

  // 3. 右底角圆弧过渡
  const cR = new Vector2(buttW - rButt, buttY + rButt)
  for (let i = 1; i <= 6; i++) {
    const a = (i / 6) * (-Math.PI / 2)
    pts.push(new Vector2(cR.x + rButt * Math.cos(a), cR.y + rButt * Math.sin(a)))
  }

  // 4. 底部水平底面至左底角
  const cL = new Vector2(-buttW + rButt, buttY + rButt)
  pts.push(new Vector2(cL.x, buttY))
  for (let i = 1; i <= 6; i++) {
    const a = -Math.PI / 2 - (i / 6) * (Math.PI / 2)
    pts.push(new Vector2(cL.x + rButt * Math.cos(a), cL.y + rButt * Math.sin(a)))
  }

  // 5. 左侧对称流线返回顶部
  if (isShakehand) {
    for (let i = PHOTO_HANDLE_FL_POINTS.length - 2; i >= 1; i--) {
      const pt = PHOTO_HANDLE_FL_POINTS[i]!
      pts.push(new Vector2(-pt[0], pt[1]))
    }
  } else {
    for (let i = 9; i >= 1; i--) {
      const t = i / 10
      const y = topY + (buttY - topY) * t
      const x = topW + (buttW - topW) * t
      pts.push(new Vector2(-x, y))
    }
  }

  return pts
}

export function createBladeShape(grip: RacketGripType = 'shakehand'): Shape {
  return new Shape(generateBladePoints(grip))
}

export function createRubberShape(): Shape {
  return new Shape(generateRubberPoints())
}

export function createHandleShape(grip: RacketGripType = 'shakehand'): Shape {
  return new Shape(generateHandlePoints(grip))
}

/**
 * 沿板面外周全包覆生成 3D 护边织物织带 Mesh
 */
export function createEdgeTapeGeometry(
  tapeHalfWidth = 0.0062,
): BufferGeometry {
  // 提取从左下角绕顶至右下角的外周弧线
  const rimPts: Vector2[] = []

  // 左侧上行
  for (let i = PHOTO_RUBBER_POINTS.length - 1; i >= 0; i--) {
    const pt = PHOTO_RUBBER_POINTS[i]!
    rimPts.push(new Vector2(-pt[0], pt[1]))
  }
  // 右侧下行
  for (let i = 1; i < PHOTO_RUBBER_POINTS.length; i++) {
    const pt = PHOTO_RUBBER_POINTS[i]!
    rimPts.push(new Vector2(pt[0], pt[1]))
  }

  const count = rimPts.length
  const positions = new Float32Array(count * 2 * 3)
  const normals = new Float32Array(count * 2 * 3)
  const uvs = new Float32Array(count * 2 * 2)
  const indices: number[] = []

  for (let i = 0; i < count; i++) {
    const pt = rimPts[i]
    if (!pt) continue

    let tangent: Vector2
    if (i === 0) {
      tangent = rimPts[1]!.clone().sub(pt).normalize()
    } else if (i === count - 1) {
      tangent = pt.clone().sub(rimPts[i - 1]!).normalize()
    } else {
      tangent = rimPts[i + 1]!.clone().sub(rimPts[i - 1]!).normalize()
    }

    const normal2D = new Vector2(tangent.y, -tangent.x).normalize()
    const px = pt.x + normal2D.x * 0.0003
    const py = pt.y + normal2D.y * 0.0003

    const vIdx = i * 2

    positions[vIdx * 3] = px
    positions[vIdx * 3 + 1] = py
    positions[vIdx * 3 + 2] = -tapeHalfWidth

    normals[vIdx * 3] = normal2D.x
    normals[vIdx * 3 + 1] = normal2D.y
    normals[vIdx * 3 + 2] = 0

    uvs[vIdx * 2] = i / (count - 1)
    uvs[vIdx * 2 + 1] = 0

    positions[(vIdx + 1) * 3] = px
    positions[(vIdx + 1) * 3 + 1] = py
    positions[(vIdx + 1) * 3 + 2] = tapeHalfWidth

    normals[(vIdx + 1) * 3] = normal2D.x
    normals[(vIdx + 1) * 3 + 1] = normal2D.y
    normals[(vIdx + 1) * 3 + 2] = 0

    uvs[(vIdx + 1) * 2] = i / (count - 1)
    uvs[(vIdx + 1) * 2 + 1] = 1

    if (i < count - 1) {
      const a = vIdx
      const b = vIdx + 1
      const c = vIdx + 2
      const d = vIdx + 3
      indices.push(a, b, c)
      indices.push(b, d, c)
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setAttribute('normal', new BufferAttribute(normals, 3))
  geo.setAttribute('uv', new BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  return geo
}

export interface RacketGeometriesResult {
  bladeGeo: ExtrudeGeometry
  spongeGeo: ExtrudeGeometry
  rubberGeo: ExtrudeGeometry
  handleGeo: ExtrudeGeometry
  edgeTapeGeo: BufferGeometry
}

/**
 * 集中创建专业乒乓球拍的高质量圆润几何体
 */
export function createRacketGeometries(grip: RacketGripType = 'shakehand'): RacketGeometriesResult {
  const bladeShape = createBladeShape(grip)
  const rubberShape = createRubberShape()
  const handleShape = createHandleShape(grip)

  // 1. 五层纯木底板：5.6mm 厚，带手工打磨倒圆角 (1.2mm)
  const bladeGeo = new ExtrudeGeometry(bladeShape, {
    depth: 0.0056,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0012,
    bevelSegments: 4,
  })
  bladeGeo.translate(0, 0, -0.0028)

  // 2. 高弹蛋糕海绵层：厚度 1.8mm
  const spongeGeo = new ExtrudeGeometry(rubberShape, {
    depth: 0.0018,
    bevelEnabled: true,
    bevelThickness: 0.0002,
    bevelSize: 0.0002,
    bevelSegments: 2,
  })
  spongeGeo.translate(0, 0, -0.0009)

  // 3. 顶级粘性反胶胶皮：饱满微倒角 (0.6mm)
  const rubberGeo = new ExtrudeGeometry(rubberShape, {
    depth: 0.0016,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0006,
    bevelSegments: 3,
  })
  rubberGeo.translate(0, 0, -0.0008)

  // 4. 手柄贴片：饱满弧形拱面 (单侧 8.4mm 厚，带 2.0mm 柔和倒角)
  const handleDepth = grip === 'shakehand' ? 0.0044 : 0.004
  const handleBevel = 0.002
  const handleGeo = new ExtrudeGeometry(handleShape, {
    depth: handleDepth,
    bevelEnabled: true,
    bevelThickness: handleBevel,
    bevelSize: handleBevel,
    bevelSegments: 6,
  })
  handleGeo.translate(0, 0, -handleDepth / 2)

  // 5. 护边带织带几何体
  const edgeTapeGeo = createEdgeTapeGeometry(0.0062)

  return { bladeGeo, spongeGeo, rubberGeo, handleGeo, edgeTapeGeo }
}
