import { DataFrame, Serie } from "@youwol/dataframe"
import { minMax } from "@youwol/math"
import { Grid2DHelper } from "../grid2DHelper"
import { streamlines } from "./streamlines"
import { Vector } from "./Vector"


/**
 * @param seed Defines the first point where integration should start. If this is
 * not specified a random point inside boundingBox is selected
 * You can pass array of seed points, they are going to be used one by one
 * if they satisfy the rules
 * @param seedArray Same as seed but using an array of seed points
 * @param stepsPerIteration
 * @param timeStep Integration time step (passed to RK4 method)
 * @param dSep Separation distance between new streamlines
 * @param dTest Distance between streamlines when integration should stop
 * @param forwardOnly If set to true, lines are going to be drawn from the seed points
 * only in the direction of the vector field     
 */
export function streamLinesExtractor(
    {
        vectorField, 
        positions, 
        seed=undefined, 
        seedArray=undefined,
        maximumPointsPerLine=undefined,
        stepsPerIteration=50, 
        timeStep=0.05, 
        dSep=0.2, 
        dTest=0.08, 
        forwardOnly=false
    }:
    {
        vectorField: Serie, 
        positions: Serie, 
        seed?: Vector,
        seedArray?: Vector[],
        maximumPointsPerLine?: number,
        stepsPerIteration?:number,
        max
        timeStep?:number, 
        dSep?:number, 
        dTest?:number, 
        forwardOnly?:boolean
    }): DataFrame[]
{
    let polylines: Polylines = []
    let polyline : Polyline  = []

    function addPoint(a: Point, b: Point): boolean {
        const newPolyLine = () => {
            if (polyline.length > 1) polylines.push([...polyline])
            polyline = []
        }
    
        if (a === undefined) {
            newPolyLine()
            return false
        }
        else {
            polyline.push(a.x, a.y, 0, b.x, b.y, 0)
        }
        return true
    }

    function vectorFieldFunction(p: Vector): Vector {
        const v = gridHelper.interpolate([p.y, p.x], vectorField) // WARNING: WE INVERTED  the x and y !
        if (v === undefined) return undefined
        return new Vector(v[0], v[1])
    }

    // vectorField instead of attribute
    const {nx, ny}   = getDims(positions)
    const b          = new Bounds( minMax(positions), 0.1 )
    const bounds     = b.normalized()

    const gridHelper = new Grid2DHelper([bounds[0],bounds[1]], [bounds[3],bounds[4]], nx, ny, 1e-7)

    const bbox = {
        width : bounds[3]-bounds[0],
        height: bounds[4]-bounds[1],
        left  : bounds[0],
        top   : bounds[1],
    }

    const computer = streamlines({
        vectorField: vectorFieldFunction,
        onPointAdded: addPoint,
        onStreamlineAdded: undefined,
        maxTimePerIteration: 1,
        maximumPointsPerLine,
        seed,
        boundingBox: bbox,
        stepsPerIteration,
        timeStep,
        dSep,
        dTest,
        forwardOnly,
        seedArray
    })

    computer.run()

    if (polyline.length !== 0) {
        polylines.push([...polyline])
    }

    polylines = b.denormalize(polylines)

    return polylines.map( polyline => {
        const indices = []
        for (let i=0; i<polyline.length; i+=2) {
            indices.push(i, i+1)
        }
        return DataFrame.create({
            series: {
                positions: Serie.create({array: polyline, itemSize: 3}),
                indices  : Serie.create({array: indices , itemSize: 2})
            }
        })
    })
}

// ----------------------------------------------

type Polyline  = number[]
type Polylines = Polyline[]
type Point     = {x: number, y: number}

class Bounds {
    private width: number
    private height: number
    private center: [number, number]

    constructor(private bounds: number[], scaling = 1) {
        this.width  = (bounds[3] - bounds[0])*scaling
        this.height = (bounds[4] - bounds[1])*scaling
        this.center = [(bounds[3]+bounds[0])/2, (bounds[4]+bounds[1])/2]
    }

    normalized() {
        return [
            (this.bounds[0]-this.center[0])/this.width,
            (this.bounds[1]-this.center[1])/this.height,
            this.bounds[2],
            (this.bounds[3]-this.center[0])/this.width,
            (this.bounds[4]-this.center[1])/this.height,
            this.bounds[5]
        ]
    }

    denormalize(polylines: Polylines) {
        return polylines.map( (polyline: Polyline) => {
            const p = [...polyline]
            for (let i=0; i<polyline.length; i+=3) { // assume 3D
                p[i  ] = polyline[i  ]*this.width  + this.center[0]
                p[i+1] = polyline[i+1]*this.height + this.center[1]
            }
            return p
        })
    }
}

// Detect the size of the 2D-grid
const getDims = (s: Serie, eps = 1e-7) => {
    const start = s.itemAt(0)[0]
    let nx = 0
    s.forEach( p => {
        if (Math.abs(p[0]-start)<eps) nx++
    })
    if (nx<2) {
        throw new Error('Seems that the grid is not regular')
    }

    const ny = s.count/nx
    if (Number.isInteger(ny) === false) {
        throw new Error('Seems that the grid is not regular')
    }

    return {nx, ny}
}