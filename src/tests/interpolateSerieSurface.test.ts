import { Serie } from '@youwol/dataframe'
import { InterpolateSerieOnSurface, Surface } from '../lib'


test('test interpolate serie on surface', () => {
    const positions = [0,0,0, 1,0,0, 1,1,0, 0,1,0]
    const indices   = [0,1,2, 0,2,3]
    const u         = Serie.create({array: [1,3,7, 11,17,19], itemSize: 3})

    const i = new InterpolateSerieOnSurface(positions, indices)
    console.log( i.interpolate({serie: u, atTriangles: true, localCsys: true}) )

    // Test to be done...
    expect(false).toBeFalsy()
})
