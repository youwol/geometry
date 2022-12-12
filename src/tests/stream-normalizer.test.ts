import { Serie } from '@youwol/dataframe'
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

test('streamline normalizer Serie', () => {
    const min = [-1, -1, -1]
    const max = [3, 3, 3]

    const n = new Normalizer([...min, ...max])

    const p2 = Serie.create({
        array: [0, 0, -0.5, -0.5, 0.5, 0.5],
        itemSize: 1,
    })
    // console.log( n.normalize(p2) )

    const p3 = Serie.create({
        array: [0, 0, 0, -0.5, -0.5, 0, 0.5, 0.5, 0],
        itemSize: 3,
    })
    // console.log( n.normalize(p3) )
})
