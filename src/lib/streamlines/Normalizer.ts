import { Serie } from '@youwol/dataframe'

type V = number[]

export class Normalizer {
    bounds: V = [0, 0, 0, 0, 0, 0]
    width = 0
    height = 0
    length = 0
    center = [0, 0]
    constructor(bounds: V, scaling = 1) {
        if (bounds.length !== 6)
            throw new Error(
                'bounds is an array of length 6 ([xmin,ymin,zmin, xmax,ymax,zmax])',
            )
        this.bounds = bounds
        this.width = (bounds[3] - bounds[0]) * scaling
        this.height = (bounds[4] - bounds[1]) * scaling
        this.length = Math.max(this.width, this.height)
        this.center = [(bounds[3] + bounds[0]) / 2, (bounds[4] + bounds[1]) / 2]
    }

    normalize(p: V | Serie) {
        if (Serie.isSerie(p)) {
            const s = (p as Serie).map((q) => this.normalize(q))
            return s
        }
        const X = (p[0] - this.center[0]) / this.length
        const Y = (p[1] - this.center[1]) / this.length
        if (p.length === 2) {
            return [X, Y]
        } else {
            return [X, Y, p[2]]
        }
    }
    denormalize(p: V | Serie) {
        if (p instanceof Serie) {
            return p.map((q) => this.denormalize(q))
        }
        const X = p[0] * this.length + this.center[0]
        const Y = p[1] * this.length + this.center[1]

        if (p.length === 2) {
            return [X, Y]
        } else {
            return [X, Y, p[2]]
        }
    }
}
