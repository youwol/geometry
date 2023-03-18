import { AnglesToNormal } from '../lib'

test('angles to normal', () => {
    // TODO
    const a = new AnglesToNormal()
    a.setOrientation({ dipAngle: 0, dipAzimuth: 0 })
    expect(a.normal[0]).toBeCloseTo(0)
    expect(a.normal[1]).toBeCloseTo(0)
    expect(a.normal[2]).toBeCloseTo(1)

    a.setOrientation({ dipAngle: 0, dipAzimuth: 90 })
    expect(a.normal[0]).toBeCloseTo(0)
    expect(a.normal[1]).toBeCloseTo(0)
    expect(a.normal[2]).toBeCloseTo(1)

    a.setOrientation({ dipAngle: 90, dipAzimuth: 0 })
    expect(a.normal[0]).toBeCloseTo(0)
    expect(a.normal[1]).toBeCloseTo(1)
    expect(a.normal[2]).toBeCloseTo(0)

    a.setOrientation({ dipAngle: 90, dipAzimuth: 90 })
    expect(a.normal[0]).toBeCloseTo(1)
    expect(a.normal[1]).toBeCloseTo(0)
    expect(a.normal[2]).toBeCloseTo(0)

    const sqrt2 = Math.sqrt(2) / 2
    a.setOrientation({ dipAngle: 45, dipAzimuth: 0 })
    expect(a.normal[0]).toBeCloseTo(0)
    expect(a.normal[1]).toBeCloseTo(sqrt2)
    expect(a.normal[2]).toBeCloseTo(sqrt2)
})
