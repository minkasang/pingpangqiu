import {
  BufferAttribute,
  BufferGeometry,
  CurvePath,
  CubicBezierCurve,
  ExtrudeGeometry,
  Shape,
  Vector2,
} from 'three'

/**
 * 专业级乒乓球拍高精度几何生成器。
 * 严格按照红双喜 (DHS) / 蝴蝶 (Butterfly) 标准比赛拍实物比例建模：
 * 1. 经典饱满水滴卵形板面 (151mm 宽 × 157mm 高)；
 * 2. 真实平直水平裁胶线 (Straight Cut)，露出宽大纯木原色拍肩；
 * 3. 完美支持两种经典握把：
 *    - 横拍 / 长刀 (Shakehand FL - 100mm 长柄，收腰喇叭口)
 *    - 直拍 / 竖拍 (Penhold CS - 80mm 短柄，紧凑圆柱微锥)
 */

export type RacketGripType = 'shakehand' | 'penhold'

/**
 * 纯木五层底板外形：包含饱满水滴卵形板面与向下贯穿手柄的实木舌部。
 * @param grip 握把类型，长柄舌部延展至 -0.172m，短柄延展至 -0.152m
 */
export function createBladeShape(grip: RacketGripType = 'shakehand'): Shape {
  const shape = new Shape()
  const buttY = grip === 'shakehand' ? -0.172 : -0.152

  // 1. 从左拍喉顶端 (与握把上沿交接处 x = -0.0135, y = -0.072) 开始
  shape.moveTo(-0.0135, -0.072)

  // 2. 宽大圆润拍肩：由拍喉平滑向外向上舒展至板面下部腰部 (y = -0.052, x = -0.066)
  shape.bezierCurveTo(-0.026, -0.069, -0.048, -0.062, -0.066, -0.052)

  // 3. 板面最大肚位 (在 y = 0.012 处达到最大半宽 0.0755m，即整宽 151mm)
  shape.bezierCurveTo(-0.075, -0.025, -0.0765, 0.0, -0.0755, 0.018)

  // 4. 板面上部向内平缓收拢至拍顶
  shape.bezierCurveTo(-0.0735, 0.048, -0.054, 0.073, -0.026, 0.081)

  // 5. 拍顶饱满圆弧 (最高点 y = 0.0825m)
  shape.bezierCurveTo(-0.013, 0.083, 0.013, 0.083, 0.026, 0.081)

  // 6. 右侧对称弧线：向外展开至最大肚位
  shape.bezierCurveTo(0.054, 0.073, 0.0735, 0.048, 0.0755, 0.018)

  // 7. 右侧肚位向下收拢至下部腰部 (y = -0.052, x = 0.066)
  shape.bezierCurveTo(0.0765, 0.0, 0.075, -0.025, 0.066, -0.052)

  // 8. 右侧拍肩优雅向内收拢至右拍喉 (x = 0.0135, y = -0.072)
  shape.bezierCurveTo(0.048, -0.062, 0.026, -0.069, 0.0135, -0.072)

  // 9. 贯穿手柄底部的实木核心木舌 (保证侧面能看到清晰的纯木夹层)
  shape.lineTo(0.0135, buttY)
  shape.lineTo(-0.0135, buttY)
  shape.lineTo(-0.0135, -0.072)

  return shape
}

/**
 * 胶皮与海绵轮廓：
 * 严格按照真实乒乓球拍制造工艺，底部为标准的水平平切线 (Straight Cut)，
 * 彻底告别原先错误的内凹月牙，露出宽大的纯木拍肩。
 */
export function createRubberShape(grip: RacketGripType = 'shakehand'): Shape {
  const shape = new Shape()
  // 直拍手指需环抱拍柄，胶皮平切线上提约 3mm，露出更大木肩
  const cutY = grip === 'shakehand' ? -0.052 : -0.048
  // 平切线与板面外沿的交点半宽
  const cutX = grip === 'shakehand' ? 0.066 : 0.068

  // 从左侧胶皮裁切角 (-cutX, cutY) 开始
  shape.moveTo(-cutX, cutY)

  // 沿板面左侧展开至最大肚位
  shape.bezierCurveTo(-0.075, -0.025, -0.0765, 0.0, -0.0755, 0.018)

  // 板面上部弧线
  shape.bezierCurveTo(-0.0735, 0.048, -0.054, 0.073, -0.026, 0.081)

  // 拍顶圆弧
  shape.bezierCurveTo(-0.013, 0.083, 0.013, 0.083, 0.026, 0.081)

  // 右侧对称外弧
  shape.bezierCurveTo(0.054, 0.073, 0.0735, 0.048, 0.0755, 0.018)

  // 右侧至右侧切角 (+cutX, cutY)
  shape.bezierCurveTo(0.0765, 0.0, 0.075, -0.025, cutX, cutY)

  // 关键特征：水平平直平截线 (Straight Horizontal Line)
  shape.lineTo(-cutX, cutY)

  return shape
}

/**
 * 横拍 / 长刀 (Shakehand FL - Flared) 手柄贴片截面：
 * 100mm 长柄，中腰收窄至约 23.5mm，尾部喇叭形饱满外扩至约 34.5mm。
 */
export function createShakehandHandleShape(): Shape {
  const shape = new Shape()

  // 顶部 (y = -0.070, x = -0.01325，宽 26.5mm)
  shape.moveTo(-0.01325, -0.07)

  // 左侧优雅收腰与喇叭口：中间 y = -0.125 处内收至 11.75mm，底端 y = -0.172 处外扩至 17.25mm
  shape.bezierCurveTo(-0.0135, -0.09, -0.0118, -0.115, -0.01175, -0.125)
  shape.bezierCurveTo(-0.0117, -0.138, -0.0142, -0.158, -0.01725, -0.172)

  // 底部平齐切面 (宽 34.5mm)
  shape.lineTo(0.01725, -0.172)

  // 右侧对称向上收拢
  shape.bezierCurveTo(0.0142, -0.158, 0.0117, -0.138, 0.01175, -0.125)
  shape.bezierCurveTo(0.0118, -0.115, 0.0135, -0.09, 0.01325, -0.07)

  // 顶部微拱弧
  shape.bezierCurveTo(0.008, -0.069, -0.008, -0.069, -0.01325, -0.07)

  return shape
}

/**
 * 直拍 / 竖拍 (Penhold CS - Chinese Short) 手柄贴片截面：
 * 80mm 短柄，紧凑圆柱微锥形，方便拇指和食指紧密钳握。
 */
export function createPenholdHandleShape(): Shape {
  const shape = new Shape()

  // 顶部 (y = -0.070, x = -0.0125，宽 25mm)
  shape.moveTo(-0.0125, -0.07)

  // 侧边平缓微锥收拢至底部 (y = -0.152，宽 29mm)
  shape.bezierCurveTo(-0.0125, -0.095, -0.0128, -0.125, -0.0145, -0.152)

  // 底部平切
  shape.lineTo(0.0145, -0.152)

  // 右侧对称向上
  shape.bezierCurveTo(0.0128, -0.125, 0.0125, -0.095, 0.0125, -0.07)

  // 顶部微拱弧
  shape.bezierCurveTo(0.008, -0.069, -0.008, -0.069, -0.0125, -0.07)

  return shape
}

/**
 * 生成外周护边带 (Edge Tape) 曲线路径 (从左下胶皮水平切点绕顶一周至右下切点)
 */
export function createOuterRimPath(grip: RacketGripType = 'shakehand'): CurvePath<Vector2> {
  const path = new CurvePath<Vector2>()
  const cutY = grip === 'shakehand' ? -0.052 : -0.048
  const cutX = grip === 'shakehand' ? 0.066 : 0.068

  path.add(
    new CubicBezierCurve(
      new Vector2(-cutX, cutY),
      new Vector2(-0.075, -0.025),
      new Vector2(-0.0765, 0.0),
      new Vector2(-0.0755, 0.018),
    ),
  )
  path.add(
    new CubicBezierCurve(
      new Vector2(-0.0755, 0.018),
      new Vector2(-0.0735, 0.048),
      new Vector2(-0.054, 0.073),
      new Vector2(-0.026, 0.081),
    ),
  )
  path.add(
    new CubicBezierCurve(
      new Vector2(-0.026, 0.081),
      new Vector2(-0.013, 0.083),
      new Vector2(0.013, 0.083),
      new Vector2(0.026, 0.081),
    ),
  )
  path.add(
    new CubicBezierCurve(
      new Vector2(0.026, 0.081),
      new Vector2(0.054, 0.073),
      new Vector2(0.0735, 0.048),
      new Vector2(0.0755, 0.018),
    ),
  )
  path.add(
    new CubicBezierCurve(
      new Vector2(0.0755, 0.018),
      new Vector2(0.0765, 0.0),
      new Vector2(0.075, -0.025),
      new Vector2(cutX, cutY),
    ),
  )

  return path
}

/**
 * 沿拍头外周生成 3D 护边织物织带 Mesh
 */
export function createEdgeTapeGeometry(
  grip: RacketGripType = 'shakehand',
  tapeHalfWidth = 0.0062,
  segments = 80,
): BufferGeometry {
  const path = createOuterRimPath(grip)
  const pts = path.getPoints(segments)
  const count = pts.length

  const positions = new Float32Array(count * 2 * 3)
  const normals = new Float32Array(count * 2 * 3)
  const uvs = new Float32Array(count * 2 * 2)
  const indices: number[] = []

  for (let i = 0; i < count; i++) {
    const pt = pts[i]
    if (!pt) continue

    let tangent: Vector2
    if (i === 0) {
      tangent = pts[1]!.clone().sub(pt).normalize()
    } else if (i === count - 1) {
      tangent = pt.clone().sub(pts[i - 1]!).normalize()
    } else {
      tangent = pts[i + 1]!.clone().sub(pts[i - 1]!).normalize()
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
 * 集中创建指定握把类型（长柄横拍 vs 短柄直拍）的所有高质量几何体
 */
export function createRacketGeometries(grip: RacketGripType = 'shakehand'): RacketGeometriesResult {
  const bladeShape = createBladeShape(grip)
  const rubberShape = createRubberShape(grip)
  const handleShape = grip === 'shakehand' ? createShakehandHandleShape() : createPenholdHandleShape()

  // 1. 五层纯木底板核 (厚度 5.6mm，微倒角，z 轴中心对齐)
  const bladeGeo = new ExtrudeGeometry(bladeShape, {
    depth: 0.0056,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0006,
    bevelSegments: 3,
  })
  bladeGeo.translate(0, 0, -0.0028)

  // 2. 高弹蛋糕海绵层 (厚度 2.0mm)
  const spongeGeo = new ExtrudeGeometry(rubberShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelThickness: 0.0002,
    bevelSize: 0.0002,
    bevelSegments: 2,
  })
  spongeGeo.translate(0, 0, -0.001)

  // 3. 顶级反胶胶皮 (厚度 1.8mm，微倒角)
  const rubberGeo = new ExtrudeGeometry(rubberShape, {
    depth: 0.0018,
    bevelEnabled: true,
    bevelThickness: 0.0004,
    bevelSize: 0.0004,
    bevelSegments: 3,
  })
  rubberGeo.translate(0, 0, -0.0009)

  // 4. 手柄贴片 (横拍饱满收腰，直拍紧凑圆润)
  const handleDepth = grip === 'shakehand' ? 0.0078 : 0.0072
  const handleGeo = new ExtrudeGeometry(handleShape, {
    depth: handleDepth,
    bevelEnabled: true,
    bevelThickness: 0.0024,
    bevelSize: 0.0024,
    bevelSegments: 4,
  })
  handleGeo.translate(0, 0, -handleDepth / 2)

  // 5. 护边带织带几何体
  const edgeTapeGeo = createEdgeTapeGeometry(grip, 0.0062, 80)

  return { bladeGeo, spongeGeo, rubberGeo, handleGeo, edgeTapeGeo }
}
