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
 * 比赛级专业乒乓球拍外形轮廓生成器。
 * 彻底告别原先粗糙的“圆柱体+方块”，还原具有真实水滴卵形板面 (150mm × 157mm)、
 * 拍肩裸木握把区、月牙形弧度胶皮切口、收腰 FL 手柄、圆弧倒角与全贴合专业护边带。
 */

/**
 * 纯木五层底板外形：包含板面水滴卵形轮廓与向下延伸贯穿手柄的实木舌部 (Tongue)。
 */
export function createBladeShape(): Shape {
  const shape = new Shape()

  // 从左侧拍喉/拍肩交界处开始 (y = -0.070, x = -0.015)
  shape.moveTo(-0.015, -0.07)

  // 拍肩展开弧线 (从拍喉向左下平滑展开到板面下侧腰线)
  shape.bezierCurveTo(-0.024, -0.055, -0.045, -0.032, -0.065, -0.012)

  // 板面最大宽度肚位 (约在 y = 0.02，宽度达 ±0.0755m，标准横板 150mm 宽)
  shape.bezierCurveTo(-0.0755, 0.005, -0.0765, 0.02, -0.075, 0.038)

  // 板面上部向内平缓收拢至拍顶
  shape.bezierCurveTo(-0.071, 0.058, -0.054, 0.074, -0.028, 0.08)

  // 拍顶弧顶平缓弧过渡 (高度约 0.082m)
  shape.bezierCurveTo(-0.014, 0.0825, 0.014, 0.0825, 0.028, 0.08)

  // 右侧对称弧线：上部向外展开到肚位
  shape.bezierCurveTo(0.054, 0.074, 0.071, 0.058, 0.075, 0.038)

  // 右侧最大肚位
  shape.bezierCurveTo(0.0765, 0.02, 0.0755, 0.005, 0.065, -0.012)

  // 右侧下部收拢至右拍喉
  shape.bezierCurveTo(0.045, -0.032, 0.024, -0.055, 0.015, -0.07)

  // 向下贯穿手柄的实木舌部 (延伸至手柄底端 y = -0.165，宽 30mm)
  shape.lineTo(0.015, -0.165)
  shape.lineTo(-0.015, -0.165)
  shape.lineTo(-0.015, -0.07)

  return shape
}

/**
 * 胶皮与海绵轮廓：覆盖除拍肩裸木握把区以外的击球面。
 * 底部为专业选手的内收月牙弧形切口，露出底板纯木拍肩方便食指和拇指握拍贴合。
 */
export function createRubberShape(): Shape {
  const shape = new Shape()

  // 左下侧月牙切口起点 (y = -0.046, x = -0.048)
  shape.moveTo(-0.048, -0.046)

  // 沿板面左侧展开
  shape.bezierCurveTo(-0.066, -0.025, -0.0755, 0.005, -0.075, 0.038)
  shape.bezierCurveTo(-0.071, 0.058, -0.054, 0.074, -0.028, 0.08)

  // 拍顶
  shape.bezierCurveTo(-0.014, 0.0825, 0.014, 0.0825, 0.028, 0.08)

  // 右侧沿板面收拢
  shape.bezierCurveTo(0.054, 0.074, 0.071, 0.058, 0.075, 0.038)
  shape.bezierCurveTo(0.0755, 0.005, 0.066, -0.025, 0.048, -0.046)

  // 底部经典防卡手内收弧切线 (月牙形内凹)
  shape.bezierCurveTo(0.025, -0.036, -0.025, -0.036, -0.048, -0.046)

  return shape
}

/**
 * FL (Flared 收腰型) 手柄贴片截面：
 * 拍柄上口带弧度斜面倒角，中段内收，尾部喇叭形外扩。
 */
export function createHandleScaleShape(): Shape {
  const shape = new Shape()

  // 顶部与拍肩衔接的倒角平缓弧 (y = -0.062)
  shape.moveTo(-0.0135, -0.062)

  // 左侧拍柄外形：中腰微收 (y = -0.115 处宽度约 25mm)，尾部外扩 (y = -0.165 处宽度约 34mm)
  shape.bezierCurveTo(-0.0145, -0.075, -0.0125, -0.105, -0.0125, -0.12)
  shape.bezierCurveTo(-0.0125, -0.138, -0.0148, -0.155, -0.0175, -0.165)

  // 拍柄底部平切线
  shape.lineTo(0.0175, -0.165)

  // 右侧对称喇叭口向上收拢
  shape.bezierCurveTo(0.0148, -0.155, 0.0125, -0.138, 0.0125, -0.12)
  shape.bezierCurveTo(0.0125, -0.105, 0.0145, -0.075, 0.0135, -0.062)

  // 顶端贴指弧
  shape.bezierCurveTo(0.008, -0.06, -0.008, -0.06, -0.0135, -0.062)

  return shape
}

/**
 * 获取外周包边带 (Edge Tape) 曲线路径 (从左下胶皮角沿拍顶到右下胶皮角)
 */
export function createOuterRimPath(): CurvePath<Vector2> {
  const path = new CurvePath<Vector2>()

  // 4 段三次贝塞尔曲线严丝合缝拼合整个拍头外轮廓
  path.add(
    new CubicBezierCurve(
      new Vector2(-0.048, -0.046),
      new Vector2(-0.066, -0.025),
      new Vector2(-0.0755, 0.005),
      new Vector2(-0.075, 0.038),
    ),
  )
  path.add(
    new CubicBezierCurve(
      new Vector2(-0.075, 0.038),
      new Vector2(-0.071, 0.058),
      new Vector2(-0.054, 0.074),
      new Vector2(-0.028, 0.08),
    ),
  )
  path.add(
    new CubicBezierCurve(
      new Vector2(-0.028, 0.08),
      new Vector2(-0.014, 0.0825),
      new Vector2(0.014, 0.0825),
      new Vector2(0.028, 0.08),
    ),
  )
  path.add(
    new CubicBezierCurve(
      new Vector2(0.028, 0.08),
      new Vector2(0.054, 0.074),
      new Vector2(0.071, 0.058),
      new Vector2(0.075, 0.038),
    ),
  )
  path.add(
    new CubicBezierCurve(
      new Vector2(0.075, 0.038),
      new Vector2(0.0755, 0.005),
      new Vector2(0.066, -0.025),
      new Vector2(0.048, -0.046),
    ),
  )

  return path
}

/**
 * 沿拍头外周生成 3D 护边织物织带 Mesh
 * @param tapeHalfWidth 护边带半宽 (约 6.2mm，总宽 12.4mm 覆盖底板+双面海绵+胶皮)
 */
export function createEdgeTapeGeometry(tapeHalfWidth = 0.0062, segments = 80): BufferGeometry {
  const path = createOuterRimPath()
  const pts = path.getPoints(segments)
  const count = pts.length

  const positions = new Float32Array(count * 2 * 3)
  const normals = new Float32Array(count * 2 * 3)
  const uvs = new Float32Array(count * 2 * 2)
  const indices: number[] = []

  for (let i = 0; i < count; i++) {
    const pt = pts[i]
    if (!pt) continue

    // 计算外向切线法向量 (稍微向外垫 0.0003m 避免与胶皮/底板 z-fighting)
    let tangent: Vector2
    if (i === 0) {
      tangent = pts[1]!.clone().sub(pt).normalize()
    } else if (i === count - 1) {
      tangent = pt.clone().sub(pts[i - 1]!).normalize()
    } else {
      tangent = pts[i + 1]!.clone().sub(pts[i - 1]!).normalize()
    }
    // 逆时针路径的外法线：(tangent.y, -tangent.x)
    const normal2D = new Vector2(tangent.y, -tangent.x).normalize()
    const px = pt.x + normal2D.x * 0.0003
    const py = pt.y + normal2D.y * 0.0003

    const vIdx = i * 2

    // 前端顶点 (-Z)
    positions[vIdx * 3] = px
    positions[vIdx * 3 + 1] = py
    positions[vIdx * 3 + 2] = -tapeHalfWidth

    normals[vIdx * 3] = normal2D.x
    normals[vIdx * 3 + 1] = normal2D.y
    normals[vIdx * 3 + 2] = 0

    uvs[vIdx * 2] = i / (count - 1)
    uvs[vIdx * 2 + 1] = 0

    // 后端顶点 (+Z)
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
      // 两个三角形拼成一个网格面
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

/**
 * 集中创建专业乒乓球拍的所有高质量几何体
 */
export function createRacketGeometries() {
  const bladeShape = createBladeShape()
  const rubberShape = createRubberShape()
  const handleShape = createHandleScaleShape()

  // 1. 底板五层纯木核：厚度 5.6mm (z: -0.0028 到 +0.0028)
  const bladeGeo = new ExtrudeGeometry(bladeShape, {
    depth: 0.0056,
    bevelEnabled: true,
    bevelThickness: 0.0006,
    bevelSize: 0.0006,
    bevelSegments: 3,
  })
  bladeGeo.translate(0, 0, -0.0028)

  // 2. 高弹海绵层：厚度 2.0mm
  const spongeGeo = new ExtrudeGeometry(rubberShape, {
    depth: 0.002,
    bevelEnabled: true,
    bevelThickness: 0.0002,
    bevelSize: 0.0002,
    bevelSegments: 2,
  })
  spongeGeo.translate(0, 0, -0.001)

  // 3. 顶级专业反胶胶皮：表面平整，边缘带细腻斜角
  const rubberGeo = new ExtrudeGeometry(rubberShape, {
    depth: 0.0018,
    bevelEnabled: true,
    bevelThickness: 0.0004,
    bevelSize: 0.0004,
    bevelSegments: 3,
  })
  rubberGeo.translate(0, 0, -0.0009)

  // 4. FL 人体工学弧形手柄贴片：饱满倒角，弧形截面，贴合手掌
  const handleGeo = new ExtrudeGeometry(handleShape, {
    depth: 0.0076,
    bevelEnabled: true,
    bevelThickness: 0.0024,
    bevelSize: 0.0024,
    bevelSegments: 4,
  })
  handleGeo.translate(0, 0, -0.0038)

  // 5. 护边带织带几何体
  const edgeTapeGeo = createEdgeTapeGeometry(0.0062, 80)

  return { bladeGeo, spongeGeo, rubberGeo, handleGeo, edgeTapeGeo }
}
