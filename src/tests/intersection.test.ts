import { intersectTriangle } from '../lib'

test('angles to normal', () => {
    // ===================================================

    let i = intersectTriangle({
        ray: {
            origin: [0.1, 0, -10],
            direction: [0, 0, 1],
        },
        p1: [0, 0, -3],
        p2: [1, 0, -2],
        p3: [1, 1, 0],
    })
    expect(i[0]).toBeCloseTo(0.1)
    expect(i[1]).toBe(0)
    expect(i[2]).toBeCloseTo(-2.9)

    // ===================================================

    i = intersectTriangle({
        ray: {
            origin: [0.1, 0, 10], // <-------
            direction: [0, 0, 1],
        },
        p1: [0, 0, -3],
        p2: [1, 0, -2],
        p3: [1, 1, 0],
    })
    expect(i).toBeUndefined()

    // ===================================================

    i = intersectTriangle({
        ray: {
            origin: [0.1, 0, 10],
            direction: [0, 0, -1], // <-------
        },
        p1: [0, 0, -3],
        p2: [1, 0, -2],
        p3: [1, 1, 0],
    })
    expect(i[0]).toBeCloseTo(0.1)
    expect(i[1]).toBe(0)
    expect(i[2]).toBeCloseTo(-2.9)

    // ===================================================
})
