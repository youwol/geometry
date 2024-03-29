import { Node, Facet, Halfedge } from './combels'
import { Stack } from './Stack'
import { SurfaceBuilder } from './SurfaceBuilder'
import { BBox } from '../bbox'
import { Serie } from '@youwol/dataframe'

type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

/**
 * Usage:
 * ```ts
 * Surface.create(positionArray, cellsArray)
 * ```
 * where `positionArray` and cellsArray are either a `Serie`, a `TypedArray` or an `Array`
 * @category Halfedge
 */
export class Surface {
    private list_n_: Array<Node> = []
    private list_e_: Array<Halfedge> = []
    private list_f_: Array<Facet> = []
    private bbox_: BBox = undefined

    beginDescription() {
        this.list_n_ = []
        this.list_e_ = []
        this.list_f_ = []
    }

    endDescription() {
        /* nothing to do */
    }

    static create(
        positions: Serie | TypedArray | number[],
        cells: Serie | TypedArray | number[],
    ) {
        let pos = undefined
        if (Serie.isSerie(positions)) {
            pos = positions
        } else {
            pos = Serie.create({
                array: positions as TypedArray | number[],
                itemSize: 3,
            })
        }

        let idx = undefined
        if (Serie.isSerie(cells)) {
            idx = cells
        } else {
            idx = Serie.create({
                array: cells as TypedArray | number[],
                itemSize: 3,
            })
        }

        const m = new Surface()
        m.build(pos, idx)
        return m
    }

    get nodesAsSerie(): Serie {
        const pos = new Array(this.list_n_.length * 3).fill(0)
        for (let i = 0; i < this.list_n_.length; ++i) {
            const node = this.list_n_[i]
            const id = 3 * i
            pos[id] = node.pos[0]
            pos[id + 1] = node.pos[1]
            pos[id + 2] = node.pos[2]
        }
        return Serie.create({ array: pos, itemSize: 3 })
    }

    get trianglesAsSerie() {
        const index: Array<number> = new Array(this.list_f_.length * 3).fill(0)
        for (let i = 0; i < this.list_f_.length; ++i) {
            const ids = this.list_f_[i].nodeIds
            const id = 3 * i
            index[id] = ids[0]
            index[id + 1] = ids[1]
            index[id + 2] = ids[2]
        }
        return Serie.create({ array: index, itemSize: 3 })
    }

    private build(positions: Serie, cells: Serie) {
        const itemSize = cells.itemSize
        const builder = new SurfaceBuilder()
        builder.beginSurface(this)

        const b = new BBox()
        positions.forEach((p) => {
            builder.addNode(p)
            b.grow(p)
        })
        this.bbox_ = b

        cells.forEach((cell) => {
            builder.beginFacet()
            for (let j = 0; j < itemSize; ++j) {
                builder.addNodeToFacet(cell[j])
            }
            builder.endFacet()
        })

        builder.endSurface()
    }

    // ------------------------------------------

    get bbox() {
        return this.bbox_
    }

    // ------------------------------------------

    get nbNodes() {
        return this.list_n_.length
    }
    get nodes() {
        return this.list_n_
    }
    node(i: number) {
        return this.list_n_[i]
    }

    forEachNode(cb: (v: Node, i: number) => void) {
        const fs = this.list_n_
        for (let i = 0; i < fs.length; ++i) {
            cb(fs[i], i)
        }
    }

    // ------------------------------------------

    get halfedges() {
        return this.list_e_
    }
    get nbHalfedges() {
        return this.list_e_.length
    }
    halfedge(i: number) {
        return this.list_e_[i]
    }

    forEachHalfedge(cb: (v: Halfedge, i: number) => void) {
        const fs = this.list_e_
        for (let i = 0; i < fs.length; ++i) {
            cb(fs[i], i)
        }
    }

    // ------------------------------------------

    get facets() {
        return this.list_f_
    }
    get nbFacets() {
        return this.list_f_.length
    }
    facet(i: number) {
        return this.list_f_[i]
    }

    forEachFace(cb: (v: Facet, i: number) => void) {
        const fs = this.list_f_
        for (let i = 0; i < fs.length; ++i) {
            cb(fs[i], i)
        }
    }

    // ------------------------------------------

    get borderEdges(): Array<Halfedge> {
        const edges: Array<Halfedge> = []
        this.halfedges.forEach((e) => {
            if (e.facet === undefined) {
                edges.push(e)
            }
        })
        return edges
    }

    get bordersAsSerie(): Serie {
        const nodes: number[] = []
        this.halfedges.forEach((e) => {
            if (e.facet === undefined) {
                const n1 = e.node
                const n2 = e.opposite.node
                nodes.push(n1.pos[0], n1.pos[1], n1.pos[2])
                nodes.push(n2.pos[0], n2.pos[1], n2.pos[2])
            }
        })
        return Serie.create({ array: nodes, itemSize: 3 })
    }

    get borderIdsAsSerie(): Serie {
        const nodes: number[] = []
        this.halfedges.forEach((e) => {
            if (e.facet === undefined) {
                const n1 = e.node
                const n2 = e.opposite.node
                nodes.push(n1.id, n2.id)
            }
        })
        return Serie.create({ array: nodes, itemSize: 1 })
    }

    get borderNodes(): Array<Node> {
        const nodes: Array<Node> = []

        this.halfedges.forEach((e) => {
            if (e.facet === undefined) {
                nodes.push(e.node, e.opposite.node)
            }
        })

        /*
        const visited = Array(this.halfedges.length).fill(false)
        this.halfedges.forEach( (e, i) => {
            if (visited[i] === false) {
                if (e.facet === undefined) {
                    // found a starting border
                    const start = e
                    do {
                        visited[i] = true
                        console.log(e.node.id)
                        nodes.push(e.node)
                        e = e.next
                    } while (e !== start )
                }
            }
        })
        */

        return nodes
    }

    // -------------------------------- PRIVATE -------------------------------

    deleteEdge(h: Halfedge) {
        this.deleteHalfedge(h.opposite)
        this.deleteHalfedge(h)
    }
    deleteHalfedge(e: Halfedge) {
        this.list_e_ = this.list_e_.filter((value) => value === e)
    }
    deleteFacet(f: Facet) {
        this.list_f_ = this.list_f_.filter((value) => value === f)
    }
    newHalfedge(_rhs?: Halfedge): Halfedge {
        const result = new Halfedge()
        this.addNewHalfedge(result)
        return result
    }
    newNode(rhs?: Node): Node {
        const result = new Node()
        if (rhs !== undefined) {
            result.setPos(rhs.pos[0], rhs.pos[1], rhs.pos[2])
        }
        this.addNewNode(result)
        return result
    }
    deleteNode(v: Node) {
        this.list_n_ = this.list_n_.filter((value) => value === v)
    }
    addNewNode(n: Node) {
        this.list_n_.push(n)
    }
    newFacet(_rhs?: Facet): Facet {
        const result = new Facet()
        this.addNewFacet(result)
        return result
    }
    newEdge(): Halfedge {
        const h1 = this.newHalfedge()
        const h2 = this.newHalfedge()
        h1.setOpposite(h2)
        h2.setOpposite(h1)
        h1.setNext(h2)
        h2.setNext(h1)
        h1.setPrev(h2)
        h2.setPrev(h1)
        return h1
    }
    getConnectedComponent(h: Node, l: Array<Node>): void {
        const visited = new Map<Node, boolean>()
        this.nodes.forEach((node) => visited.set(node, false))
        const stack = new Stack<Node>()
        stack.push(h)

        while (!stack.isEmpty) {
            const top = stack.top
            stack.pop()
            if (!visited.get(top)) {
                visited.set(top, true)
                l.push(top)
                let cir = top.halfedge
                do {
                    const cur = cir.opposite.node
                    if (!visited.get(cur)) {
                        stack.push(cur)
                    }
                    cir = cir.nextAroundNode
                } while (cir !== top.halfedge)
            }
        }
    }
    addNewHalfedge(h: Halfedge): void {
        this.list_e_.push(h)
    }
    addNewFacet(f: Facet): void {
        this.list_f_.push(f)
    }
}
