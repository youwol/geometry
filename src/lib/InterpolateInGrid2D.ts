import { Serie } from "@youwol/dataframe"
import { barycentric2, triangleLerp2D } from "@youwol/math"
import { BackgroundGrid2D, createBackgroundGrid2D } from "./background2DGrid"

/**
 * Usage:
 * ```js
 * const dataframe = io.decodeGocadTS( fs.readFileSync(filename, 'utf8') )[0]
 * 
 * const inter = new InterpolateInGrid2D({
 *     positions: dataframe.series.positions,
 *     indices  : dataframe.series.indices,
 *     attribute: dataframe.series.fric,
 *     nx: 100,
 *     ny: 100,
 *     flatten: true
 * })
 * 
 * const value = inter.interpolate([0,1])
 * ```
 */
export class InterpolateInGrid2D {
    private positions: Serie = undefined
    private indices  : Serie = undefined
    private attribute: Serie = undefined
    private bg: BackgroundGrid2D = undefined
    private eps = 1e-7

    get backgroundGrid() {
        return this.bg
    }
    
    constructor(
        {positions, indices, attribute, nx, ny, flatten = true, scaling = 1}:
        {positions: Serie, indices: Serie, attribute: Serie, nx: number, ny: number, flatten?: boolean, scaling?: number}
    ) {
        this.indices   = indices
        this.attribute = attribute
        this.positions = positions.map( p => [p[0]*scaling, p[1]*scaling, flatten ? 0 : p[2]] )

        this.bg = createBackgroundGrid2D({
            positions: this.positions,
            indices: this.indices,
            dims: [nx, ny]
        })

        this.eps = Math.max(this.bg.bbox.width, this.bg.bbox.height) * 1e-4
    }

    interpolate(p: [number,number]) {
        const inTriangle = (p, p1, p2, p3) => {
            const unity = coord => coord >= -this.eps && coord <= 1+this.eps
            const w = barycentric2(p, p1, p2, p3)
            return unity(w[0]) && unity(w[1]) && unity(w[2])
        }
        
        const sol = this.bg.candidates(p)
        if (sol && sol.length) {
            for (let k=0; k<sol.length; ++k) {
                const s = sol[k]
                const index = s.obj
                const cell = this.indices.itemAt(index)
                const p1   = this.positions.itemAt(cell[0])
                const p2   = this.positions.itemAt(cell[1])
                const p3   = this.positions.itemAt(cell[2])
                if (inTriangle(p, p1, p2, p3)) {
                    const q1 = this.attribute.itemAt(cell[0])
                    const q2 = this.attribute.itemAt(cell[1])
                    const q3 = this.attribute.itemAt(cell[2])
                    const v = triangleLerp2D(
                        [p[0],p[1]], 
                        [p1[0],p1[1]], [p2[0],p2[1]], [p3[0],p3[1]],
                        q1, q2, q3
                    )
                    return v as number | number[]
                }
            }
        }
        return undefined
    }
}