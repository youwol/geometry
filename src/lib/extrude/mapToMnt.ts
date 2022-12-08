// import BBox3D from '@youwol/core/geom/BBox3D.js'
// import Vec3   from '@youwol/core/math/Vec3.js'

import { Serie } from '@youwol/dataframe'
import { TraceInfo, SurfaceType } from './types'
import { BBox } from '../bbox'

/**
 * Map 2D or 3D segments onto a mnt
 * @param mnt The mnt given by the [[Serie]] positions and indices
 * @param traces An array of [[TraceInfo]]
 * @returns An array of [[Serie]]
 * @category Extrude
 */
export function mapToMnt(mnt: SurfaceType, traces: TraceInfo[]) {
    const t = new MapToMnt()
    t.setMnt(mnt)
    t.setTraces(traces)
    return t.run()
}

// -------------------------------------------------------

class MapToMnt {
    private mnt: SurfaceType = undefined
    private traces: TraceInfo[]
    public active = true

    constructor() {
        this.mnt = undefined
        this.traces = undefined
    }

    setMnt(mnt: SurfaceType) {
        this.mnt = mnt
    }

    setTraces(traces: TraceInfo[]) {
        this.traces = traces
    }

    run(): Serie[] {
        if (!this.mnt || this.traces.length === 0) {
            return undefined
        }

        const bbox = new BBox()
        this.mnt.positions.forEach((p) => {
            bbox.grow(p)
        })
        const zmin = bbox.min[2]
        const zmax = bbox.max[2]
        const z = (zmin + zmax) / 2
        const z1 = z - (zmax - zmin) * 100
        const z2 = z + (zmax - zmin) * 100

        const series: Serie[] = []

        this.traces.forEach((trace) => {
            const n = trace.points.length / 2
            //trace["newPoints"] = [] // extend the class
            const newPoints = []

            trace.points.forEach((p) => {
                if (this.active) {
                    let found = false
                    for (let j = 0; j < this.mnt.indices.length; j += 3) {
                        const i1 = this.mnt.indices.array[j]
                        const i2 = this.mnt.indices.array[j + 1]
                        const i3 = this.mnt.indices.array[j + 2]
                        const p1 = this.mnt.positions.itemAt(i1) as number[]
                        const p2 = this.mnt.positions.itemAt(i2) as number[]
                        const p3 = this.mnt.positions.itemAt(i3) as number[]
                        const z = (p1[2] + p2[2] + p3[2]) / 3
                        if (this.pointInTriangle(p, p1, p2, p3)) {
                            // Bon, j'ai la cagne...on va approximer le z en supposant que
                            // la densité du maillage est assez bonne par rapport aux traces des failles...
                            newPoints.push(p[0], p[1], z)
                            found = true
                            break
                        }
                    }
                    console.assert(found)
                } else {
                    newPoints.push(p[0], p[1], 0)
                }
            }) // end points of current trace

            series.push(Serie.create({ array: newPoints, itemSize: 3 }))
        }) // end all traces

        return series
    }

    private pointInTriangle(
        pt: number[],
        v1: number[],
        v2: number[],
        v3: number[],
    ) {
        function sign(p1: number[], p2: number[], p3: number[]) {
            return (
                (p1[0] - p3[0]) * (p2[1] - p3[1]) -
                (p2[0] - p3[0]) * (p1[1] - p3[1])
            )
        }
        const d1 = sign(pt, v1, v2)
        const d2 = sign(pt, v2, v3)
        const d3 = sign(pt, v3, v1)
        const has_neg = d1 < 0 || d2 < 0 || d3 < 0
        const has_pos = d1 > 0 || d2 > 0 || d3 > 0
        return !(has_neg && has_pos)
    }
}
