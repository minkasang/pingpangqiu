import { describe, expect, it } from 'vitest'
import {
  createBladeShape,
  createRubberShape,
  createHandleShape,
  createEdgeTapeGeometry,
  createRacketGeometries,
} from './racketGeometry'

describe('racketGeometry', () => {
  it('creates valid blade, rubber, and handle shapes for both shakehand and penhold', () => {
    const bladeShake = createBladeShape('shakehand')
    const bladePen = createBladeShape('penhold')
    const rubber = createRubberShape()
    const handleShake = createHandleShape('shakehand')
    const handlePen = createHandleShape('penhold')

    expect(bladeShake.curves.length).toBeGreaterThan(10)
    expect(bladePen.curves.length).toBeGreaterThan(10)
    expect(rubber.curves.length).toBeGreaterThan(10)
    expect(handleShake.curves.length).toBeGreaterThan(10)
    expect(handlePen.curves.length).toBeGreaterThan(10)
  })

  it('generates non-empty edge tape buffer geometry with valid attributes', () => {
    const tape = createEdgeTapeGeometry(0.006)
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
