import {
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Shape,
  Vector2,
} from 'three'

/**
 * 专业级乒乓球拍高精度几何生成器。
 * 针对用户反馈“不要纯圆，要有真正优美的流线与精妙的结构衔接”，
 * 严格按照用户实物图（红双喜 4002 横拍长刀 / 4006 直拍竖拍）进行像素级逆向拟合建模：
 * 
 * 1. 真实水滴卵形板面 (Egg/Waterdrop)：
 *    - 弧顶微展平圆，最大肚位在腰部略偏下 (y = -0.010m，宽 150mm)；
 *    - 肚位向下一路优雅内敛收拢至平切裁胶线 (y = -0.076m，裁切半宽 47.5mm)；
 * 
 * 2. 经典马鞍弧拍肩过渡 (Graceful Concave Shoulder)：
 *    - 胶皮裁切线下沿，底板纯木以马鞍凹弧 (Concave Sweep) 优雅向内滑入手柄颈部 (y = -0.093m，半宽 13.5mm)；
 *    - 在横拍正面形成标志性的两侧对称裸木三角翼 (Wing)，直拍则留出拇指食指全裸木握持区；
 * 
 * 3. 两种真实握把结构衔接：
 *    - 横拍 / 长刀 (Shakehand FL)：手柄上沿直抵裁胶底线 (y = -0.076m)，中段收腰至 24mm，尾端喇叭口外扩至 33mm，总长约 100mm；
 *    - 直拍 / 竖拍 (Penhold CS)：手柄上沿下移至 y = -0.095m，与胶皮留出 19mm 宽阔原木虎口握把区，柄长 75mm，平直微锥。
 */

export type RacketGripType = 'shakehand' | 'penhold'

/**
 * 板面与胶皮外轮廓半径函数（基于实物照片像素拟合的连续平滑优雅曲线）
 */
export function rubberRadius(y: number): number {
  const topY = 0.077
  const bellyY = -0.01
  const cutY = -0.076
  const maxW = 0.075
  const cutW = 0.0475

  if (y > topY) return 0.0
  if (y >= bellyY) {
    // 拍头上部：微扁圆拱顶平缓向两侧展开至最大肚位
    const t = (y - bellyY) / (topY - bellyY)
    return maxW * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.1)))
  } else if (y >= cutY) {
    // 肚位向下：流线向内收拢至胶皮平切线
    const t = (bellyY - y) / (bellyY - cutY)
    return maxW - (maxW - cutW) * Math.pow(t, 1.35)
  }
  return 0.0
}

/**
 * 拍肩凹弧半径函数（连接裁胶角与握把颈部的优美马鞍弧）
 */
export function shoulderRadius(y: number): number {
  const cutY = -0.076
  const neckY = -0.093
  const cutW = 0.0475
  const neckW = 0.0135

  const t = Math.max(0, Math.min(1, (cutY - y) / (cutY - neckY)))
  // 优雅内凹曲线：开始急速内收，随后平缓贴合拍柄
  return cutW * Math.pow(1 - t, 1.8) + neckW * (1 - Math.pow(1 - t, 1.8))
}

/**
 * 握把外廓半径函数（严格对标 FL 喇叭柄与 CS 短柄）
 */
export function handleRadius(y: number, isShakehand: boolean): number {
  if (isShakehand) {
    const topY = -0.076
    const waistY = -0.125
    const buttY = -0.173
    const topW = 0.0138
    const waistW = 0.012
    const buttW = 0.0165

    if (y >= waistY) {
      const t = (topY - y) / (topY - waistY)
      return topW + (waistW - topW) * Math.pow(t, 1.2)
    } else {
      const t = (waistY - y) / (waistY - buttY)
      return waistW + (buttW - waistW) * Math.pow(t, 1.5)
    }
  } else {
    const topY = -0.095
    const buttY = -0.17
    const topW = 0.013
    const buttW = 0.0145
    const t = Math.max(0, Math.min(1, (topY - y) / (topY - buttY)))
    return topW + (buttW - topW) * t
  }
}

/**
 * 生成底板五层纯木几何体多边形
 */
export function generateBladePoints(grip: RacketGripType = 'shakehand'): Vector2[] {
  const pts: Vector2[] = []
  const isShakehand = grip === 'shakehand'
  const buttY = isShakehand ? -0.173 : -0.17
  const topY = 0.077
  const cutY = -0.076
  const neckY = -0.093

  // 1. 实木舌部：从右拍喉顺直延伸至底板末端
  pts.push(new Vector2(0.0135, neckY))
  pts.push(new Vector2(0.0135, buttY))
  pts.push(new Vector2(-0.0135, buttY))
  pts.push(new Vector2(-0.0135, neckY))

  // 2. 左侧拍肩：优美马鞍内凹弧向上展开至左裁胶角
  const shoulderSteps = 24
  for (let i = 1; i <= shoulderSteps; i++) {
    const y = neckY + (cutY - neckY) * (i / shoulderSteps)
    pts.push(new Vector2(-shoulderRadius(y), y))
  }

  // 3. 左侧板面：流线向上经最大肚位至拍顶 crown
  const rimSteps = 60
  for (let i = 1; i <= rimSteps; i++) {
    const y = cutY + (topY - cutY) * (i / rimSteps)
    pts.push(new Vector2(-rubberRadius(y), y))
  }

  // 4. 右侧板面：对称从拍顶向下收拢至右裁胶角
  for (let i = 1; i <= rimSteps; i++) {
    const y = topY - (topY - cutY) * (i / rimSteps)
    pts.push(new Vector2(rubberRadius(y), y))
  }

  // 5. 右侧拍肩：对称向内收拢回右拍喉
  for (let i = 1; i < shoulderSteps; i++) {
    const y = cutY - (cutY - neckY) * (i / shoulderSteps)
    pts.push(new Vector2(shoulderRadius(y), y))
  }

  return pts
}

/**
 * 生成胶皮/海绵层多边形（上周完美流线 + 底部平直线 + 微圆角过渡）
 */
export function generateRubberPoints(): Vector2[] {
  const pts: Vector2[] = []
  const topY = 0.077
  const cutY = -0.076
  const cutW = 0.0475
  const rFillet = 0.003

  // 1. 底部水平直线段（从左圆角至右圆角）
  pts.push(new Vector2(-cutW + rFillet, cutY))
  pts.push(new Vector2(cutW - rFillet, cutY))

  // 2. 右侧切角倒角微圆弧
  const fSteps = 6
  for (let i = 1; i <= fSteps; i++) {
    const a = -Math.PI / 2 + (i / fSteps) * (Math.PI / 2)
    pts.push(
      new Vector2(cutW - rFillet + rFillet * Math.cos(a), cutY + rFillet + rFillet * Math.sin(a)),
    )
  }

  // 3. 右侧流线外弧由切线上行至拍顶
  const rimSteps = 60
  for (let i = 1; i <= rimSteps; i++) {
    const y = cutY + rFillet + (topY - (cutY + rFillet)) * (i / rimSteps)
    pts.push(new Vector2(rubberRadius(y), y))
  }

  // 4. 左侧流线外弧由拍顶下行至左切角
  for (let i = 1; i <= rimSteps; i++) {
    const y = topY - (topY - (cutY + rFillet)) * (i / rimSteps)
    pts.push(new Vector2(-rubberRadius(y), y))
  }

  // 5. 左侧切角倒角微圆弧
  for (let i = 1; i <= fSteps; i++) {
    const a = Math.PI - (i / fSteps) * (Math.PI / 2)
    pts.push(
      new Vector2(-cutW + rFillet + rFillet * Math.cos(a), cutY + rFillet + rFillet * Math.sin(a)),
    )
  }

  return pts
}

/**
 * 生成符合人体工学握持手感的手柄贴片截面多边形
 */
export function generateHandlePoints(grip: RacketGripType = 'shakehand'): Vector2[] {
  const pts: Vector2[] = []
  const isShakehand = grip === 'shakehand'
  const topY = isShakehand ? -0.076 : -0.095
  const buttY = isShakehand ? -0.173 : -0.17
  const topW = handleRadius(topY, isShakehand)
  const buttW = handleRadius(buttY, isShakehand)
  const rButt = 0.0025

  // 1. 顶部贴指微拱弧 (横拍贴合裁胶线，直拍虎口指托)
  const topSteps = 12
  for (let i = 0; i <= topSteps; i++) {
    const s = -1 + 2 * (i / topSteps)
    const x = s * topW
    const y = topY + (isShakehand ? 0.001 : 0.0025) * (1 - s * s)
    pts.push(new Vector2(x, y))
  }

  // 2. 右侧流线边缘（FL 收腰喇叭口 / CS 紧凑直微锥）
  const sideSteps = 24
  for (let i = 1; i <= sideSteps; i++) {
    const y = topY + (buttY + rButt - topY) * (i / sideSteps)
    pts.push(new Vector2(handleRadius(y, isShakehand), y))
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
  for (let i = sideSteps - 1; i >= 1; i--) {
    const y = topY + (buttY + rButt - topY) * (i / sideSteps)
    pts.push(new Vector2(-handleRadius(y, isShakehand), y))
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
 * 沿真实板面外周精确生成全贴合 3D 护边织物织带 Mesh
 */
export function createEdgeTapeGeometry(
  tapeHalfWidth = 0.0062,
): BufferGeometry {
  const pts = generateRubberPoints()
  // 提取上周边缘 (忽略底部直线)
  const rimPts = pts.filter((p) => p.y >= -0.076 + 0.0005)
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
