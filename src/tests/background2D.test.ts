import { DataFrame, Serie } from '@youwol/dataframe'
import { createBackgroundGrid2D, triangulate } from '..'

function generateMesh(n: number): DataFrame {
    const serie = Serie.create({
        array: new Array(3 * n).fill(0).map((_) => Math.random() - 0.5),
        itemSize: 3,
    })
    return triangulate(serie)
}

test('sphere', () => {
    const dataframe = generateMesh(100)

    const bg = createBackgroundGrid2D({
        positions: dataframe.series.positions,
        indices: dataframe.series.indices,
        dims: [50, 50],
    })

    const sol = bg.candidates([0, 0])
    // console.log(sol)

    // Test to be done...
    expect(false).toBeFalsy()
})
