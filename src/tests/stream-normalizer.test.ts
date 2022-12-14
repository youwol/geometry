import { Normalizer } from '../lib'

test('streamline normalizer points', () => {
    const min = [-1, -1, -1]
    const max = [3, 3, 3]
    const n = new Normalizer([...min, ...max])

    expect(n.normalize([-1, 0])[0]).toEqual(-0.5)
    expect(n.normalize([-1, 0])[1]).toEqual(-0.25)

    expect(n.normalize([-1, 0, -100])[0]).toEqual(-0.5)
    expect(n.normalize([-1, 0, -100])[1]).toEqual(-0.25)
})
