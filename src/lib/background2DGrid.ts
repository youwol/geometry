import { Serie } from '@youwol/dataframe'
import { minMax } from '@youwol/math'

type V2 = [number, number]

/**
 * Put all cells from a 2D unstructured mesh (not the points) into a background-brid
 * @returns 
 */
export function createBackgroundGrid2D(
	{position, indices, dims=[20, 20], eps=1e-2}:
	{position: Serie, indices: Serie, dims?: [number, number], eps?: number})
{
    const nbNodes    = position.count
    const nbElements = indices.count

    const minmax = minMax(position)

	const dx: number[] = []
    dx.push( (minmax[3] - minmax[0] + 2*eps)/dims[0] )
    dx.push( (minmax[4] - minmax[1] + 2*eps)/dims[1] )
	let pmin = [minmax[0]-eps, minmax[1]-eps] as V2

	const backgroundgrid = new BackgroundGrid2D()
	backgroundgrid.set(pmin, dx[0], dx[1], dims[0], dims[1])

    indices.forEach( (elt, i) => {
        const xs = []
        const ys = []
        elt.forEach ( j => {
            const p = position.itemAt(j)
            xs.push(p[0]); ys.push(p[1])
        })
        const err = backgroundgrid.insert( new CBox([Math.min(...xs), Math.max(...xs)], [Math.min(...ys), Math.max(...ys)], i) )
    })

	return backgroundgrid
}

// ---------------------------------------------------------------------

class BackgroundGrid2D {
    private origin_ = [0, 0]
	private dx_ = 0
	private dy_ = 0
	private nx_ = 0
	private ny_ = 0
    private cells_: Array<Cell<any>>
        
    set(o: V2, dx: number, dy: number, nx: number, ny: number) {
        this.origin_ = [...o]
		this.dx_ = dx
		this.dy_ = dy
		this.nx_ = nx
		this.ny_ = ny
		this.cells_ = Array(this.nx_ * this.ny_).fill(undefined).map( v => new Cell)
    }

    get nx() {return this.nx_}
    get ny() {return this.ny_}
    get dx() {return this.dx_}
    get dy() {return this.dy_}
    get origin() {return this.origin_}

    get bbox() {
        return {
            x: this.origin_[0],
            y: this.origin_[1],
            width:  this.dx_*this.nx_,
            height: this.dy_*this.ny_
        }
    }

    insert(box: CBox<any>): boolean {
        // console.assert(this.nx_ !== 0);
		// console.assert(this.ny_ !== 0);

		const o1 = this.getIJ(box.min)
		if (!o1.ok) return false
        const ij0 = o1.ij
        
		const o2 = this.getIJ(box.max)
		if (!o2.ok) return false
        const ij1 = o2.ij

		const IXmin = Math.min(ij0[0], ij1[0])
		const IXmax = Math.max(ij0[0], ij1[0])
		const IYmin = Math.min(ij0[1], ij1[1])
		const IYmax = Math.max(ij0[1], ij1[1])

		for (let i = IXmin; i <= IXmax; ++i) {
			for (let j = IYmin; j <= IYmax; ++j) {
                const flatindex = this.getFlatIndex(i, j)
                this.cells_[flatindex].objects.push(box)
			}
		}
        
		return true
    }

    candidates(p: V2): Array<CBox<any>> {
		const {ok, ij} = this.getIJ(p)
		if (!ok) {
			return []
		}

		const flatcellindex = this.getFlatIndex(ij[0], ij[1])
        const cell = this.cells_[flatcellindex]
        
        return cell.objects
    }

    getIJ(p: V2): any {
        // console.assert(this.nx_ != 0 && this.ny_ != 0)
		// console.assert(this.dx_ != 0 && this.dy_ != 0)

		const lx = p[0] - this.origin_[0]
		if (lx < 0) return FALSE

		const ly = p[1] - this.origin_[1]
		if (ly < 0) return FALSE
		
		const xg = lx / this.dx_
		if (xg > this.nx_) return FALSE

		const yg = ly / this.dy_
		if (yg > this.ny_) return FALSE

		const ix = Math.floor(xg)
		const iy = Math.floor(yg)
        //console.log(ix, iy)

        return {
            ok: true,
            ij: [ix, iy]
        } 
    }

    getCoordinates(i: number, j: number): V2 {
        return [
            this.origin_[0] + i*this.dx_,
            this.origin_[1] + j*this.dy_
        ]
    }

    getFlatIndex(Ix: number, Iy: number): number {
        return this.nx_ * Iy + Ix
    }

}

const FALSE = {ok: false}

class CBox<T> {
    public min: V2 = [0,0]
    public max: V2 = [0,0]
	public obj : T
	constructor(xbounds: V2, ybounds: V2, obj: T) {
		this.min = [xbounds[0], ybounds[0]]
		this.max = [xbounds[1], ybounds[1]]
		this.obj = obj
	}
    contains(x: number, y: number): boolean {
        return (x>= this.min[0] && x<=this.max[0]) && (y>= this.min[1] && y<=this.max[1])
    }
}

class Cell<T> {
    public objects: Array<CBox<any>> = []
}
