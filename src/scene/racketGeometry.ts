import {
  BufferAttribute,
  BufferGeometry,
  ExtrudeGeometry,
  Shape,
  Vector2,
} from 'three'

/**
 * 专业级乒乓球拍高精度几何生成器。
 * 彻底解决“拍面上半部是圆的，下半部突然是直线/折线”的违和感：
 * 
 * 1. 浑然一体的 S-Curve 经典水滴卵形板面 (Unbroken Smooth S-Curve Head)：
 *    - 拍顶至肚位 (y: 0.080m -> 0.002m)：饱满圆润大椭圆，最大肚位宽度 150mm (x = ±0.075m)；
 *    - 肚位至拍喉 (y: 0.002m -> -0.068m)：采用三阶光滑 S 曲线 (Hermite Smoothstep) 优雅内敛收拢，
 *      从 150mm 自然、平滑、无任何折线与突兀直线地过渡到 27mm 手柄颈部 (x = ±0.0135m)；
 * 
 * 2. 胶皮全曲率环抱击球面：
 *    - 胶皮完全顺应板面流线顺滑包裹，直达拍柄上沿，下底仅留出贴合手柄的微内凹贴指弧，
 *      彻底告别中下部生硬截断的横切直线或斜切折角；
 * 
 * 3. 护边织带全周严密包覆：
 *    - 从手柄左颈出发，沿整个拍头外周 360° 完整包覆至手柄右颈，与真实比赛球拍一致。
 */

export type RacketGripType = 'shakehand' | 'penhold'

/**
 * 板面与胶皮半宽函数（全周平滑连续，无任何直线段折角）
 */
export function bladeHalfWidth(y: number): number {
  const topY = 0.08
  const bellyY = 0.002
  const neckY = -0.068
  const maxW = 0.075
  const neckW = 0.0135

  if (y > topY) return 0.0
  if (y >= bellyY) {
    // 上半部：优雅大椭圆弧线展开至最大肚位 (150mm)
    const t = (y - bellyY) / (topY - bellyY)
    return maxW * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.0)))
  } else if (y >= neckY) {
    // 下半部：三阶 Hermite 连续 S 曲线平顺收敛至拍喉 (27mm)
    const t = (bellyY - y) / (bellyY - neckY)
    const s = t * t * (3 - 2 * t)
    return maxW + (neckW - maxW) * s
  } else {
    return neckW
  }
}

/**
 * 握把外廓半宽函数
 */
export function handleHalfWidth(y: number, isShakehand: boolean): number {
  if (isShakehand) {
    // 横拍 FL：颈部 27mm，腰部 24mm，底部 33mm
    const topY = -0.067
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
    // 直拍 CS：紧凑微锥短柄
    const topY = -0.088
    const buttY = -0.168
    const topW = 0.0132
    const buttW = 0.0148
    const t = Math.max(0, Math.min(1, (topY - y) / (topY - buttY)))
    return topW + (buttW - topW) * t
  }
}

/**
 * 生成底板五层纯木几何体多边形 (顺滑一体，直到握把末端)
 */
export function generateBladePoints(grip: RacketGripType = 'shakehand'): Vector2[] {
  const pts: Vector2[] = []
  const isShakehand = grip === 'shakehand'
  const buttY = isShakehand ? -0.173 : -0.168
  const neckY = -0.068
  const topY = 0.08

  // 1. 实木舌部：穿过手柄延伸至尾部
  pts.push(new Vector2(0.0135, neckY))
  pts.push(new Vector2(0.0135, buttY))
  pts.push(new Vector2(-0.0135, buttY))
  pts.push(new Vector2(-0.0135, neckY))

  // 2. 左侧板面：从左颈 (-0.0135, neckY) 光滑流线一路经肚位向上至拍顶 crown
  const steps = 80
  for (let i = 1; i <= steps; i++) {
    const y = neckY + (topY - neckY) * (i / steps)
    pts.push(new Vector2(-bladeHalfWidth(y), y))
  }

  // 3. 右侧板面：对称从拍顶平滑向下收拢至右颈 (0.0135, neckY)
  for (let i = 1; i < steps; i++) {
    const y = topY - (topY - neckY) * (i / steps)
    pts.push(new Vector2(bladeHalfWidth(y), y))
  }

  return pts
}

/**
 * 生成胶皮/海绵层多边形 (全周圆润流线，下沿轻柔吻合握把，彻底消灭下部直线)
 */
export function generateRubberPoints(grip: RacketGripType = 'shakehand'): Vector2[] {
  const pts: Vector2[] = []
  const isShakehand = grip === 'shakehand'
  const neckY = isShakehand ? -0.068 : -0.076
  const topY = 0.08
  const neckW = bladeHalfWidth(neckY)

  // 1. 下部微贴指弧：从左拍喉向右自然微拱过渡，绝无死板平直截面
  const archSteps = 20
  for (let i = 0; i <= archSteps; i++) {
    const t = -1 + 2 * (i / archSteps) // -1 到 +1
    const x = t * neckW
    const y = neckY + 0.0025 * (1 - t * t)
    pts.push(new Vector2(x, y))
  }

  // 2. 右侧板面外弧顺畅上行至拍顶
  const steps = 80
  for (let i = 1; i <= steps; i++) {
    const y = neckY + (topY - neckY) * (i / steps)
    pts.push(new Vector2(bladeHalfWidth(y), y))
  }

  // 3. 左侧板面外弧对称下行至左拍喉
  for (let i = 1; i < steps; i++) {
    const y = topY - (topY - neckY) * (i / steps)
    pts.push(new Vector2(-bladeHalfWidth(y), y))
  }

  return pts
}

/**
 * 生成符合人体工学握持手感的手柄贴片截面多边形
 */
export function generateHandlePoints(grip: RacketGripType = 'shakehand'): Vector2[] {
  const pts: Vector2[] = []
  const isShakehand = grip === 'shakehand'
  const topY = isShakehand ? -0.067 : -0.088
  const buttY = isShakehand ? -0.173 : -0.168
  const topW = handleHalfWidth(topY, isShakehand)
  const buttW = handleHalfWidth(buttY, isShakehand)
  const rButt = 0.0025

  // 1. 顶部贴指弧：贴合拍面喉部自然弧度
  const topSteps = 16
  for (let i = 0; i <= topSteps; i++) {
    const s = -1 + 2 * (i / topSteps)
    const x = s * topW
    const y = topY + (isShakehand ? 0.0015 : 0.003) * (1 - s * s)
    pts.push(new Vector2(x, y))
  }

  // 2. 右侧流线边缘
  const sideSteps = 24
  for (let i = 1; i <= sideSteps; i++) {
    const y = topY + (buttY + rButt - topY) * (i / sideSteps)
    pts.push(new Vector2(handleHalfWidth(y, isShakehand), y))
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
    pts.push(new Vector2(-handleHalfWidth(y, isShakehand), y))
  }

  return pts
}

export function createBladeShape(grip: RacketGripType = 'shakehand'): Shape {
  return new Shape(generateBladePoints(grip))
}

export function createRubberShape(grip: RacketGripType = 'shakehand'): Shape {
  return new Shape(generateRubberPoints(grip))
}

export function createHandleShape(grip: RacketGripType = 'shakehand'): Shape {
  return new Shape(generateHandlePoints(grip))
}

/**
 * 沿板面外周全包覆生成 3D 护边织物织带 Mesh
 */
export function createEdgeTapeGeometry(
  grip: RacketGripType = 'shakehand',
  tapeHalfWidth = 0.0062,
): BufferGeometry {
  const pts = generateRubberPoints(grip)
  // 提取从左颈到右颈的外周弧线 (忽略底部仅两端之间的贴指段)
  const isShakehand = grip === 'shakehand'
  const neckY = isShakehand ? -0.068 : -0.076
  const rimPts = pts.filter((p) => p.y >= neckY + 0.0005)
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
  const rubberShape = createRubberShape(grip)
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
  const edgeTapeGeo = createEdgeTapeGeometry(grip, 0.0062)

  return { bladeGeo, spongeGeo, rubberGeo, handleGeo, edgeTapeGeo }
}
