import { describe, expect, it } from 'vitest'
import {
  createBladeShape,
  createRubberShape,
  createShakehandHandleShape,
  createPenholdHandleShape,
  createOuterRimPath,
  createEdgeTapeGeometry,
  createRacketGeometries,
} from './racketGeometry'

describe('racketGeometry', () => {
  it('creates valid blade, rubber, and handle shapes for both shakehand and penhold', () => {
    const bladeShake = createBladeShape('shakehand')
    const bladePen = createBladeShape('penhold')
    const rubberShake = createRubberShape('shakehand')
    const rubberPen = createRubberShape('penhold')
    const handleShake = createShakehandHandleShape()
    const handlePen = createPenholdHandleShape()

    expect(bladeShake.curves.length).toBeGreaterThan(4)
    expect(bladePen.curves.length).toBeGreaterThan(4)
    expect(rubberShake.curves.length).toBeGreaterThan(4)
    expect(rubberPen.curves.length).toBeGreaterThan(4)
    expect(handleShake.curves.length).toBeGreaterThanOrEqual(4)
    expect(handlePen.curves.length).toBeGreaterThanOrEqual(4)
  })

  it('creates continuous outer rim path', () => {
    const rim = createOuterRimPath('shakehand')
    const points = rim.getPoints(40)
    expect(points.length).toBeGreaterThan(40)
    expect(points[0]!.x).toBeCloseTo(-0.066, 2)
    expect(points[points.length - 1]!.x).toBeCloseTo(0.066, 2)
  })

  it('generates non-empty edge tape buffer geometry with valid attributes', () => {
    const tape = createEdgeTapeGeometry('shakehand', 0.006, 20)
    expect(tape.getAttribute('position')).toBeDefined()
    expect(tape.getAttribute('normal')).toBeDefined()
    expect(tape.getAttribute('uv')).toBeDefined()
    expect(tape.getIndex()?.count).toBeGreaterThan(0)
  })

  it('builds all racket component geometries successfully for shakehand and penhold', () => {
    const shake = createRacketGeometries('shakehand')
    expect(shake.bladeGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(shake.spongeGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(shake.rubberGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(shake.handleGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(shake.edgeTapeGeo.attributes.position?.count).toBeGreaterThan(0)

    const pen = createRacketGeometries('penhold')
    expect(pen.bladeGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(pen.spongeGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(pen.rubberGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(pen.handleGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(pen.edgeTapeGeo.attributes.position?.count).toBeGreaterThan(0)
  })
})
