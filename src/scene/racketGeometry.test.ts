import { describe, expect, it } from 'vitest'
import {
  createBladeShape,
  createRubberShape,
  createHandleScaleShape,
  createOuterRimPath,
  createEdgeTapeGeometry,
  createRacketGeometries,
} from './racketGeometry'

describe('racketGeometry', () => {
  it('creates valid blade, rubber, and handle shapes', () => {
    const blade = createBladeShape()
    const rubber = createRubberShape()
    const handle = createHandleScaleShape()

    expect(blade.curves.length).toBeGreaterThan(4)
    expect(rubber.curves.length).toBeGreaterThan(4)
    expect(handle.curves.length).toBeGreaterThan(4)
  })

  it('creates continuous outer rim path', () => {
    const rim = createOuterRimPath()
    const points = rim.getPoints(40)
    expect(points.length).toBeGreaterThan(40)
    // Check symmetric endpoints
    expect(points[0]!.x).toBeCloseTo(-0.048, 2)
    expect(points[points.length - 1]!.x).toBeCloseTo(0.048, 2)
  })

  it('generates non-empty edge tape buffer geometry with valid attributes', () => {
    const tape = createEdgeTapeGeometry(0.006, 20)
    expect(tape.getAttribute('position')).toBeDefined()
    expect(tape.getAttribute('normal')).toBeDefined()
    expect(tape.getAttribute('uv')).toBeDefined()
    expect(tape.getIndex()?.count).toBeGreaterThan(0)
  })

  it('builds all racket component geometries successfully', () => {
    const { bladeGeo, spongeGeo, rubberGeo, handleGeo, edgeTapeGeo } = createRacketGeometries()
    expect(bladeGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(spongeGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(rubberGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(handleGeo.attributes.position?.count).toBeGreaterThan(0)
    expect(edgeTapeGeo.attributes.position?.count).toBeGreaterThan(0)
  })
})
