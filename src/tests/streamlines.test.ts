import { Serie }  from "@youwol/dataframe"
import { minMax } from "@youwol/math"
import { 
    generateRectangle, 
    InterpolateInGrid2D, 
    Normalizer, 
    pointInPolygon, 
    streamLinesExtractor, 
    Surface, 
    Vector
} from "../lib"

test('test streamlines', () => {
    /*
    const dataframe = generateRectangle({a:10, b:10, na:10, nb:10, center:[0,0,0]})

    const normalizer = new Normalizer( minMax(dataframe.series.positions), 1)
    dataframe.series.positions = normalizer.normalize( dataframe.series.positions ) as Serie

    dataframe.series['U'] = dataframe.series.positions.map( p => [p[0]**2, p[1]**2, 0] )
    const vectorAttribute = dataframe.series.U

    const surface   = Surface.create(dataframe.series.positions, dataframe.series.indices)
    const polylines = surface.bordersAsSerie

    const nx = 100
    const ny = 100
    const interpolator = new InterpolateInGrid2D({
        positions: dataframe.series.positions,
        indices  : dataframe.series.indices,
        attribute: vectorAttribute,
        nx,
        ny,
        flatten: true,
        scaling: 1
    })

    const lines = streamLinesExtractor({
        vectorField: (p: Vector) => {
            const v = interpolator.interpolate([p.y, p.x]) // WARNING: we inverted x and y
            return v === undefined ? undefined : new Vector(v[0], v[1])
        },
        isOutsideFct: (x, y) => {
            return pointInPolygon(x, y, polylines) === false
        },
        bounds: minMax(dataframe.series.positions),
        maximumPointsPerLine: 50,
    })

    console.log(lines)
    */
})
