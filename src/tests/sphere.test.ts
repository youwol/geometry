import { sphere } from "../lib/sphere"

test('test sphere', () => {
    const {positions, indices} = sphere(1)
    // expect(positions.length/3).toEqual(60)
    // expect(indices.length/3).toEqual(60)

    console.log(positions)
    console.log(indices)
})
