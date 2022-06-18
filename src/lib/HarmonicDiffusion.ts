import { Serie } from '@youwol/dataframe'
import { Node, nodesAroundNode, Surface } from './he'

type Point = [number,number,number]
type Data  = Array<number>

/**
 * Use Laplace equation to diffuse an attribute (number or Array<number>) given
 * some constraints at nodes on triangulated surface.
 * 
 * @example
 * Diffuse a scalar field
 * ```js
 * const diff = new geom.HarmonicDiffusion(positions, indices)
 * laplace.constrainsBorders(-1)
 * laplace.addConstrainedNode([-800,-300,-800], 1)
 * laplace.addConstrainedNode([0,-300,800], 1)
 * dataframe.series['P'] = diff.solve() // Serie.itemSize = 1
 * ```
 * 
 * @example
 * Diffuse a vector field of size 3
 * ```js
 * const diff = new geom.HarmonicDiffusion(positions, indices, [0,0,0])
 * laplace.constrainsBorders([-1, -2, -3])
 * laplace.addConstrainedNode([-800,-300,-800], [3,2,1])
 * laplace.addConstrainedNode([0,-300,800], [1,3,5])
 * dataframe.series['P'] = diff.solve() // Serie.itemSize = 3
 * ```
 */
export class HarmonicDiffusion {
    surface_: Surface = undefined
    map: Map<Node, Data> = new Map()
    constrainedNodes: Array<Node> = []
    maxIter_ = 500
    eps_     = 1e-5
    epsilon_ = 0.5
    dataSize = 1

    /**
     * 
     * @param positions The node positions
     * @param indices The indices of the triangles
     * @param initValue The init value tells what kind of data we are going to diffuse. This can be 
     * either a scalar or an array of any size. The size of the array will be the `itemSize` of the
     * returned Serie after calling `solve()`
     * The `itemSize` of the returned Serie (after calling `solve()`) will be the length of this array,
     * or 1 if a number is passed.
     */
    constructor(positions: Serie, indices: Serie, initValue: Data | number = 0) {
        this.surface_ = Surface.create(positions, indices)
        if (Array.isArray(initValue)) {
            this.surface_.forEachNode( n => this.map.set(n, [...initValue]) )
            this.dataSize = initValue.length
        }
        else {
            this.surface_.forEachNode( n => this.map.set(n, new Array(1).fill(initValue)) )
            this.dataSize = 1
        }
    }

    get surface() {
        return this.surface_
    }

    set maxIter(n: number) {
        this.maxIter_ = n
    }

    set eps(n: number) { // convergence
        this.eps_ = n
    }

    set epsilon(n: number) { // smoothing
        this.epsilon_ = n
    }

    /**
     * Convenient method to constrain all the borders
     */
    constrainsBorders(value: Data | number): void {
        this.surface_.borderNodes.forEach( n => this.addConstraint(n, value) )
    }

    addConstraint(n: Node | Point, value: Data | number): void {
        // Checking...
        if (Array.isArray(value)) {
            if (value.length !== this.dataSize) {
                throw new Error(`array length problem. Should be ${this.dataSize}`)
            }
        }
        else {
            if (this.dataSize !== 1) {
                throw new Error(`value problem. Should be an array of size ${this.dataSize}`)
            }
        }

        if (Array.isArray(n)) {
            let node = this.findNode(n)
            if (node && this.constrainedNodes.includes(node)===false) {
                this.pushNode(node, value)
            }
        }
        else {
            if (this.constrainedNodes.includes(n)===false) {
                this.pushNode(n, value)
            }
        }
    }

    /**
     * Solve the discrete laplace equation using relaxation
     * @returns A serie of itemSize=1 and for which count = number of surface nodes
     */
    solve(): Serie {
        // TODO: optimize by removing the map and creating array
        //       of active nodes and array of values
        let conv = 1
        let i    = 0

        while (conv > this.eps_) {
            conv = 0
            this.surface_.forEachNode( n => {
                if (this.constrainedNodes.includes(n) === false) {
                    let val = new Array(this.dataSize).fill(0)
                    let nb  = 0
                    nodesAroundNode(n, m => {
                        nb++
                        this.add(this.map.get(m), val)
                    })
                    this.scale(val, 1/nb)

                    let tmp = this.map.get(n)
                    this.scale(val, this.epsilon_)
                    this.add( this.scale(tmp, (1-this.epsilon_)), val)
                    this.map.set(n, val)

                    // console.log(this.norm2(val, tmp))

                    conv += this.norm2(val, this.scale(tmp, 1/(1-this.epsilon_)))
                }
            })

            conv = Math.sqrt(conv)
            // console.log(i,conv)

            i++
            if (i > this.maxIter_) {
                break
            }
        }

        console.log('HarmonicDiffusion nb iter:', i)
        console.log('HarmonicDiffusion conv   :', conv)

        const array = new Array(this.map.size * this.dataSize).fill(0)
        i = 0
        this.map.forEach( value => value.forEach( v => array[i++] = v ) )

        return Serie.create({
            array,
            itemSize: this.dataSize
        })
    }

    // -------------------------------------------------------------

    private add(from: Data, to: Data): Data {
        from.forEach( (v,i) => to[i] += v )
        return to
    }

    private norm2(a: Data, b: Data): number {
        return a.reduce( (cur, v, i) => cur + (v-b[i])**2, 0 )
    }

    private scale(data: Data, sc: number): Data {
        for (let i=0; i<data.length; ++i) {
            data[i] *= sc
        }
        return data
    }

    private pushNode(node: Node, value: Data | number) {
        if (Array.isArray(value)) {
            this.map.set(node, value)
        }
        else {
            this.map.set(node, [value])
        }
        this.constrainedNodes.push(node)
    }

    private findNode(p: Point): Node {
        let node = undefined
        let d = Number.POSITIVE_INFINITY
        this.surface_.forEachNode( n => {
            const dd = (n.pos[0]-p[0])**2 + (n.pos[1]-p[1])**2 + (n.pos[2]-p[2])**2
            if (dd<d) {
                d = dd
                node = n
            }
        })
        return node
    }
}
