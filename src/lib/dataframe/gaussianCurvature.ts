import { Serie, Decomposer, DataFrame } from '@youwol/dataframe'

// Excerpt from https://github.com/GeometryCollective/geometry-processing-js/tree/master/node/core
// MIT license

/**
 * Get the gaussian curvatures named `k1`, `k2`, `H` and `K` (in this order!)
 */
export class CurvatureDecomposer implements Decomposer {
    geo: Geometry
    private names_ = ['k1', 'k2', 'H', 'K']

    constructor({
        positions,
        indices,
        names = undefined,
    }: {
        positions: Serie
        indices: Serie
        names?: string[]
    }) {
        if (positions && indices) {
            this.geo = new Geometry(positions, indices, true)
        }
        if (names !== undefined) {
            if (names.length !== 4)
                throw new Error(
                    'curvature names length must be 4 (principal 1, principal 2, mean, gaussian)',
                )
            this.names_ = names
        }
    }

    /**
     * @hidden
     */
    names(df: DataFrame, itemSize: number, serie: Serie, name: string) {
        if (itemSize !== 1) return []
        if (this.geo === undefined) return []
        return this.names_
    }

    /**
     * @hidden
     */
    serie(df: DataFrame, itemSize: number, name: string): Serie {
        if (!this.names_.includes(name)) return undefined
        switch (name) {
            case this.names_[0]:
                return this.geo.k1() as Serie
            case this.names_[1]:
                return this.geo.k2() as Serie
            case this.names_[2]:
                return this.geo.H() as Serie
            case this.names_[3]:
                return this.geo.K() as Serie
            default:
                return undefined
        }
    }
}

// ================================================================

class Halfedge {
    vertex: Vertex = undefined
    edge: Edge = undefined
    face: Face = undefined
    corner: Corner = undefined
    next: Halfedge = undefined
    prev: Halfedge = undefined
    twin: Halfedge = undefined
    onBoundary = false
    index = -1 // an ID between 0 and |H| - 1, where |H| is the number of halfedges in a mesh

    toString() {
        return this.index
    }
}

// ================================================================

class Edge {
    halfedge: Halfedge
    index: number

    constructor() {
        this.halfedge = undefined
        this.index = -1 // an ID between 0 and |E| - 1, where |E| is the number of edges in a mesh
    }

    onBoundary() {
        return this.halfedge.onBoundary || this.halfedge.twin.onBoundary
    }

    toString() {
        return this.index
    }
}

// ================================================================

class Face {
    halfedge: Halfedge
    index: number

    constructor() {
        this.halfedge = undefined
        this.index = -1 // an ID between 0 and |F| - 1 if this face is not a boundary loop
        // or an ID between 0 and |B| - 1 if this face is a boundary loop, where |F| is the
        // number of faces in the mesh and |B| is the number of boundary loops in the mesh
    }

    isBoundaryLoop() {
        return this.halfedge.onBoundary
    }

    adjacentVertices(ccw = true) {
        return new FaceVertexIterator(this.halfedge, ccw)
    }

    adjacentEdges(ccw = true) {
        return new FaceEdgeIterator(this.halfedge, ccw)
    }

    adjacentFaces(ccw = true) {
        return new FaceFaceIterator(this.halfedge, ccw)
    }

    adjacentHalfedges(ccw = true) {
        return new FaceHalfedgeIterator(this.halfedge, ccw)
    }

    adjacentCorners(ccw = true) {
        return new FaceCornerIterator(this.halfedge, ccw)
    }

    toString() {
        return this.index
    }
}

class FaceVertexIterator {
    _halfedge: Halfedge
    _ccw: boolean
    current: Halfedge
    end: Halfedge
    justStarted: boolean

    // constructor
    constructor(halfedge: Halfedge, ccw) {
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let vertex = this.current.vertex
                    this.current = this.ccw
                        ? this.current.next
                        : this.current.prev
                    return {
                        done: false,
                        value: vertex,
                    }
                }
            },
        }
    }
}

class FaceEdgeIterator {
    _halfedge: Halfedge
    _ccw: boolean
    current: Halfedge
    end: Halfedge
    justStarted: boolean

    // constructor
    constructor(halfedge, ccw) {
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let edge = this.current.edge
                    this.current = this.ccw
                        ? this.current.next
                        : this.current.prev
                    return {
                        done: false,
                        value: edge,
                    }
                }
            },
        }
    }
}

class FaceFaceIterator {
    _halfedge: Halfedge
    _ccw: boolean
    current: Halfedge
    end: Halfedge
    justStarted: boolean

    // constructor
    constructor(halfedge, ccw) {
        while (halfedge.twin.onBoundary) {
            halfedge = halfedge.next
        } // twin halfedge must not be on the boundary
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                while (this.current.twin.onBoundary) {
                    this.current = this.ccw
                        ? this.current.next
                        : this.current.prev
                } // twin halfedge must not be on the boundary
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let face = this.current.twin.face
                    this.current = this.ccw
                        ? this.current.next
                        : this.current.prev
                    return {
                        done: false,
                        value: face,
                    }
                }
            },
        }
    }
}

class FaceHalfedgeIterator {
    _halfedge: Halfedge
    _ccw: boolean
    current: Halfedge
    end: Halfedge
    justStarted: boolean

    // constructor
    constructor(halfedge, ccw) {
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let halfedge = this.current
                    this.current = this.ccw
                        ? this.current.next
                        : this.current.prev
                    return {
                        done: false,
                        value: halfedge,
                    }
                }
            },
        }
    }
}

class FaceCornerIterator {
    _halfedge: Halfedge
    _ccw: boolean
    current: Halfedge
    end: Halfedge
    justStarted: boolean

    // constructor
    constructor(halfedge, ccw) {
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    this.current = this.ccw
                        ? this.current.next
                        : this.current.prev
                    let corner = this.current.corner // corner will be undefined if this face is a boundary loop
                    return {
                        done: false,
                        value: corner,
                    }
                }
            },
        }
    }
}

// ================================================================

class Vertex {
    halfedge: Halfedge
    index: number

    constructor() {
        this.halfedge = undefined
        this.index = -1 // an ID between 0 and |V| - 1, where |V| is the number of vertices in a mesh
    }

    degree() {
        let k = 0
        for (let e of this.adjacentEdges()) {
            k++
        }

        return k
    }

    isIsolated() {
        return this.halfedge === undefined
    }

    onBoundary() {
        for (let h of this.adjacentHalfedges()) {
            if (h.onBoundary) {
                return true
            }
        }

        return false
    }

    /**
     * Convenience function to iterate over the vertices neighboring this vertex.
     * @example
     * let v = mesh.vertices[0];
     * for (let u of v.adjacentVertices()) {
     *     // Do something with u
     * }
     */
    adjacentVertices(ccw = true) {
        return new VertexVertexIterator(this.halfedge, ccw)
    }

    /**
     * Convenience function to iterate over the edges adjacent to this vertex.
     * @example
     * let v = mesh.vertices[0];
     * for (let e of v.adjacentEdges()) {
     *     // Do something with e
     * }
     */
    adjacentEdges(ccw = true) {
        return new VertexEdgeIterator(this.halfedge, ccw)
    }

    /**
     * Convenience function to iterate over the faces adjacent to this vertex.
     * @example
     * let v = mesh.vertices[0];
     * for (let f of v.adjacentFaces()) {
     *     // Do something with f
     * }
     */
    adjacentFaces(ccw = true) {
        return new VertexFaceIterator(this.halfedge, ccw)
    }

    /**
     * Convenience function to iterate over the halfedges adjacent to this vertex.
     * @example
     * let v = mesh.vertices[0];
     * for (let h of v.adjacentHalfedges()) {
     *     // Do something with h
     * }
     */
    adjacentHalfedges(ccw = true) {
        return new VertexHalfedgeIterator(this.halfedge, ccw) // outgoing halfedges
    }

    /**
     * Convenience function to iterate over the corners adjacent to this vertex.
     * @example
     * let v = mesh.vertices[0];
     * for (let c of v.adjacentCorners()) {
     *     // Do something with c
     * }
     */
    adjacentCorners(ccw = true) {
        return new VertexCornerIterator(this.halfedge, ccw)
    }

    toString() {
        return this.index
    }
}

class VertexVertexIterator {
    _halfedge: Halfedge
    _ccw: boolean
    justStarted: boolean
    current: Halfedge
    end: Halfedge

    // constructor
    constructor(halfedge, ccw) {
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let vertex = this.current.twin.vertex
                    this.current = this.ccw
                        ? this.current.twin.next
                        : this.current.prev.twin
                    return {
                        done: false,
                        value: vertex,
                    }
                }
            },
        }
    }
}

class VertexEdgeIterator {
    _halfedge: Halfedge
    _ccw: boolean
    justStarted: boolean
    current: Halfedge
    end: Halfedge

    // constructor
    constructor(halfedge, ccw) {
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let edge = this.current.edge
                    this.current = this.ccw
                        ? this.current.twin.next
                        : this.current.prev.twin
                    return {
                        done: false,
                        value: edge,
                    }
                }
            },
        }
    }
}

class VertexFaceIterator {
    _halfedge: Halfedge
    _ccw: boolean
    justStarted: boolean
    current: Halfedge
    end: Halfedge

    // constructor
    constructor(halfedge, ccw) {
        while (halfedge.onBoundary) {
            halfedge = halfedge.twin.next
        } // halfedge must not be on the boundary
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                while (this.current.onBoundary) {
                    this.current = this.ccw
                        ? this.current.twin.next
                        : this.current.prev.twin
                } // halfedge must not be on the boundary
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let face = this.current.face
                    this.current = this.ccw
                        ? this.current.twin.next
                        : this.current.prev.twin
                    return {
                        done: false,
                        value: face,
                    }
                }
            },
        }
    }
}

class VertexHalfedgeIterator {
    _halfedge: Halfedge
    _ccw: boolean
    justStarted: boolean
    current: Halfedge
    end: Halfedge

    // constructor
    constructor(halfedge, ccw) {
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let halfedge = this.current
                    this.current = this.ccw
                        ? this.current.twin.next
                        : this.current.prev.twin
                    return {
                        done: false,
                        value: halfedge,
                    }
                }
            },
        }
    }
}

class VertexCornerIterator {
    _halfedge: Halfedge
    _ccw: boolean
    justStarted: boolean
    current: Halfedge
    end: Halfedge

    // constructor
    constructor(halfedge, ccw) {
        while (halfedge.onBoundary) {
            halfedge = halfedge.twin.next
        } // halfedge must not be on the boundary
        this._halfedge = halfedge
        this._ccw = ccw
    }

    [Symbol.iterator]() {
        return {
            current: this._halfedge,
            end: this._halfedge,
            ccw: this._ccw,
            justStarted: true,
            next() {
                while (this.current.onBoundary) {
                    this.current = this.ccw
                        ? this.current.twin.next
                        : this.current.prev.twin
                } // halfedge must not be on the boundary
                if (!this.justStarted && this.current === this.end) {
                    return {
                        done: true,
                    }
                } else {
                    this.justStarted = false
                    let corner = this.current.next.corner
                    this.current = this.ccw
                        ? this.current.twin.next
                        : this.current.prev.twin
                    return {
                        done: false,
                        value: corner,
                    }
                }
            },
        }
    }
}

// ================================================================

class Corner {
    halfedge: Halfedge = undefined
    index: number

    constructor() {
        this.halfedge = undefined
        this.index = -1 // an ID between 0 and |C| - 1, where |C| is the number of corners in a mesh
    }

    get vertex() {
        return this.halfedge.prev.vertex
    }

    get face() {
        return this.halfedge.face
    }

    get next() {
        return this.halfedge.next.corner
    }

    get prev() {
        return this.halfedge.prev.corner
    }

    toString() {
        return this.index
    }
}

// ================================================================

class Mesh {
    vertices: Vertex[] = []
    edges: Edge[] = []
    faces: Face[] = []
    corners: Corner[] = []
    halfedges: Halfedge[] = []
    boundaries = []
    generators = []

    constructor() {
        this.vertices = []
        this.edges = []
        this.faces = []
        this.corners = []
        this.halfedges = []
        this.boundaries = []
        this.generators = []
    }

    /**
     * Computes the euler characteristic of this mesh.
     * @method module:Core.Mesh#eulerCharacteristic
     * @returns {number}
     */
    eulerCharacteristic() {
        return this.vertices.length - this.edges.length + this.faces.length
    }

    /**
     * Constructs this mesh.
     * @returns {boolean} True if this mesh is constructed successfully and false if not
     * (when this mesh contains any one or a combination of the following - non-manifold vertices,
     *  non-manifold edges, isolated vertices, isolated faces).
     */
    build(positions: Serie, indices: Serie): boolean {
        // preallocate elements
        this.preallocateElements(positions, indices)

        // create and insert vertices
        let indexToVertex = new Map()
        for (let i = 0; i < positions.count; i++) {
            let v = new Vertex()
            v.index = i
            this.vertices[i] = v
            indexToVertex.set(i, v)
        }

        // create and insert halfedges, edges and non boundary loop faces
        let eIndex = 0
        let edgeCount = new Map()
        let existingHalfedges = new Map()
        let hasTwinHalfedge = new Map()
        for (let I = 0; I < indices.array.length; I += 3) {
            // create new face
            let f = new Face()
            this.faces[I / 3] = f

            // create a halfedge for each edge of the newly created face
            for (let J = 0; J < 3; J++) {
                let h = new Halfedge()
                this.halfedges[I + J] = h
            }

            // initialize the newly created halfedges
            for (let J = 0; J < 3; J++) {
                // current halfedge goes from vertex i to vertex j
                let K = (J + 1) % 3
                let i = indices.array[I + J]
                let j = indices.array[I + K]

                // set the current halfedge's attributes
                let h = this.halfedges[I + J]
                h.next = this.halfedges[I + K]
                h.prev = this.halfedges[I + ((J + 3 - 1) % 3)]
                h.onBoundary = false
                hasTwinHalfedge.set(h, false)

                // point the new halfedge and vertex i to each other
                let v = indexToVertex.get(i)
                h.vertex = v
                v.halfedge = h

                // point the new halfedge and face to each other
                h.face = f
                f.halfedge = h

                // swap if i > j
                if (i > j) j = [i, (i = j)][0]

                let value = [i, j]
                let key = value.toString()
                if (existingHalfedges.has(key)) {
                    // if a halfedge between vertex i and j has been created in the past, then it
                    // is the twin halfedge of the current halfedge
                    let twin = existingHalfedges.get(key)
                    h.twin = twin
                    twin.twin = h
                    h.edge = twin.edge

                    hasTwinHalfedge.set(h, true)
                    hasTwinHalfedge.set(twin, true)
                    edgeCount.set(key, edgeCount.get(key) + 1)
                } else {
                    // create an edge and set its halfedge
                    let e = new Edge()
                    this.edges[eIndex++] = e
                    h.edge = e
                    e.halfedge = h

                    // record the newly created edge and halfedge from vertex i to j
                    existingHalfedges.set(key, h)
                    edgeCount.set(key, 1)
                }

                // check for non-manifold edges
                if (edgeCount.get(key) > 2) {
                    console.warn('Mesh has non-manifold edges!')
                    return false
                }
            }
        }

        // create and insert boundary halfedges and "imaginary" faces for boundary cycles
        // also create and insert corners
        let hIndex = indices.array.length
        let cIndex = 0
        for (let i = 0; i < indices.array.length; i++) {
            // if a halfedge has no twin halfedge, create a new face and
            // link it the corresponding boundary cycle
            let h = this.halfedges[i]
            if (!hasTwinHalfedge.get(h)) {
                // create new face
                let f = new Face()
                this.boundaries.push(f)

                // walk along boundary cycle
                let boundaryCycle = []
                let he = h
                do {
                    // create a new halfedge
                    let bH = new Halfedge()
                    this.halfedges[hIndex++] = bH
                    boundaryCycle.push(bH)

                    // grab the next halfedge along the boundary that does not have a twin halfedge
                    let nextHe = he.next
                    while (hasTwinHalfedge.get(nextHe)) {
                        nextHe = nextHe.twin.next
                    }

                    // set the current halfedge's attributes
                    bH.vertex = nextHe.vertex
                    bH.edge = he.edge
                    bH.onBoundary = true

                    // point the new halfedge and face to each other
                    bH.face = f
                    f.halfedge = bH

                    // point the new halfedge and he to each other
                    bH.twin = he
                    he.twin = bH

                    // continue walk
                    he = nextHe
                } while (he !== h)

                // link the cycle of boundary halfedges together
                let n = boundaryCycle.length
                for (let j = 0; j < n; j++) {
                    boundaryCycle[j].next = boundaryCycle[(j + n - 1) % n] // boundary halfedges are linked in clockwise order
                    boundaryCycle[j].prev = boundaryCycle[(j + 1) % n]
                    hasTwinHalfedge.set(boundaryCycle[j], true)
                    hasTwinHalfedge.set(boundaryCycle[j].twin, true)
                }
            }

            // point the newly created corner and its halfedge to each other
            if (!h.onBoundary) {
                let c = new Corner()
                c.halfedge = h
                h.corner = c

                this.corners[cIndex++] = c
            }
        }

        // check if mesh has isolated vertices, isolated faces or
        // non-manifold vertices
        if (
            this.hasIsolatedVertices() ||
            this.hasIsolatedFaces() ||
            this.hasNonManifoldVertices()
        ) {
            return false
        }

        // index elements
        this.indexElements()

        return true
    }

    /**
     * Preallocates mesh elements.
     */
    private preallocateElements(positions: Serie, indices: Serie) {
        let nBoundaryHalfedges = 0
        let sortedEdges = new Map()

        for (let I = 0; I < indices.array.length; I += 3) {
            for (let J = 0; J < 3; J++) {
                let K = (J + 1) % 3
                let i = indices.array[I + J]
                let j = indices.array[I + K]

                // swap if i > j
                if (i > j) j = [i, (i = j)][0]

                let value = [i, j]
                let key = value.toString()
                if (sortedEdges.has(key)) {
                    nBoundaryHalfedges--
                } else {
                    sortedEdges.set(key, value)
                    nBoundaryHalfedges++
                }
            }
        }

        let nVertices = positions.count
        let nEdges = sortedEdges.size
        let nFaces = indices.count
        let nHalfedges = 2 * nEdges
        let nInteriorHalfedges = nHalfedges - nBoundaryHalfedges

        // clear arrays
        this.vertices.length = 0
        this.edges.length = 0
        this.faces.length = 0
        this.halfedges.length = 0
        this.corners.length = 0
        this.boundaries.length = 0
        this.generators.length = 0

        // allocate space
        this.vertices = new Array(nVertices)
        this.edges = new Array(nEdges)
        this.faces = new Array(nFaces)
        this.halfedges = new Array(nHalfedges)
        this.corners = new Array(nInteriorHalfedges)
    }

    /**
     * Checks whether this mesh has isolated vertices.
     */
    private hasIsolatedVertices() {
        for (let v of this.vertices) {
            if (v.isIsolated()) {
                console.warn('Mesh has isolated vertices!')
                return true
            }
        }

        return false
    }

    /**
     * Checks whether this mesh has isolated faces.
     */
    private hasIsolatedFaces() {
        for (let f of this.faces) {
            let boundaryEdges = 0
            for (let h of f.adjacentHalfedges()) {
                if (h.twin.onBoundary) boundaryEdges++
            }

            if (boundaryEdges === 3) {
                console.warn('Mesh has isolated faces!')
                return true
            }
        }

        return false
    }

    /**
     * Checks whether this mesh has non-manifold vertices.
     */
    private hasNonManifoldVertices() {
        let adjacentFaces = new Map()
        for (let v of this.vertices) {
            adjacentFaces.set(v, 0)
        }

        for (let f of this.faces) {
            for (let v of f.adjacentVertices()) {
                adjacentFaces.set(v, adjacentFaces.get(v) + 1)
            }
        }

        for (let b of this.boundaries) {
            for (let v of b.adjacentVertices()) {
                adjacentFaces.set(v, adjacentFaces.get(v) + 1)
            }
        }

        for (let v of this.vertices) {
            if (adjacentFaces.get(v) !== v.degree()) {
                return true
            }
        }

        return false
    }

    /**
     * Assigns indices to this mesh's elements.
     */
    private indexElements() {
        let index = 0
        for (let v of this.vertices) {
            v.index = index++
        }

        index = 0
        for (let e of this.edges) {
            e.index = index++
        }

        index = 0
        for (let f of this.faces) {
            f.index = index++
        }

        index = 0
        for (let h of this.halfedges) {
            h.index = index++
        }

        index = 0
        for (let c of this.corners) {
            c.index = index++
        }

        index = 0
        for (let b of this.boundaries) {
            b.index = index++
        }
    }
}

// ================================================================

function normalize(positions: Serie, vertices: Vertex[], rescale = true) {
    // compute center of mass
    let N = vertices.length
    let cm = new Vector()

    for (let v of vertices) {
        let p = positions.itemAt(v.index) as number[]
        cm.incrementBy(p)
    }

    cm.divideBy(N)

    // translate to origin and determine radius
    let radius = -1
    for (let v of vertices) {
        let p = new Vector(positions.itemAt(v.index) as number[])
        p.decrementBy(cm)
        radius = Math.max(radius, p.norm())
    }

    // rescale to unit radius
    if (rescale) {
        for (let v of vertices) {
            let p = new Vector(positions.itemAt(v.index) as number[])
            p.divideBy(radius)
        }
    }
}

class Geometry {
    positions: Serie
    mesh: Mesh

    constructor(positions: Serie, indices: Serie, normalizePositions = true) {
        this.mesh = new Mesh()
        this.mesh.build(positions, indices)

        this.positions = positions
        // for (let i = 0; i < positions.count; i++) {
        // 	let v = this.mesh.vertices[i]
        // 	let p = positions.itemAt(i)
        // 	this.positions[v] = p
        // }

        if (normalizePositions) {
            normalize(this.positions, this.mesh.vertices)
        }
    }

    private vector(h: Halfedge) {
        let a = this.pos(h.vertex)
        let b = this.pos(h.next.vertex)

        return b.minus(a)
    }

    /**
     * Computes the length of an edge.
     */
    private length(e: Edge) {
        return this.vector(e.halfedge).norm()
    }

    private pos(v: Vertex) {
        return new Vector(this.positions.itemAt(v.index) as number[])
    }

    /**
     * Computes the midpoint of an edge.
     */
    private midpoint(e: Edge) {
        let h = e.halfedge
        let a = this.pos(h.vertex)
        let b = this.pos(h.twin.vertex)
        return a.plus(b).over(2)
    }

    /**
     * Computes the mean edge length of all the edges in a mesh.
     */
    meanEdgeLength() {
        let sum = 0
        let edges = this.mesh.edges
        for (let e of edges) {
            sum += this.length(e)
        }

        return sum / edges.length
    }

    /**
     * Computes the area of a face.
     */
    area(f: Face) {
        if (f.isBoundaryLoop()) return 0.0

        let u = this.vector(f.halfedge)
        let v = this.vector(f.halfedge.prev).negated()

        return 0.5 * u.cross(v).norm()
    }

    /**
     * Computes the total surface area of a mesh.
     * @method module:Core.Geometry#totalArea
     * @returns {number}
     */
    totalArea() {
        let sum = 0.0
        for (let f of this.mesh.faces) {
            sum += this.area(f)
        }

        return sum
    }

    /**
     * Computes the normal of a face.
     * @method module:Core.Geometry#faceNormal
     * @param {module:Core.Face} f The face whose normal needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    faceNormal(f) {
        if (f.isBoundaryLoop()) return undefined

        let u = this.vector(f.halfedge)
        let v = this.vector(f.halfedge.prev).negated()

        return u.cross(v).unit()
    }

    /**
     * Computes the centroid of a face.
     * @method module:Core.Geometry#centroid
     * @param {module:Core.Face} f The face whose centroid needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    centroid(f: Face) {
        let h = f.halfedge
        let a = this.pos(h.vertex)
        let b = this.pos(h.next.vertex)
        let c = this.pos(h.prev.vertex)

        if (f.isBoundaryLoop()) return a.plus(b).over(2)

        return a.plus(b).plus(c).over(3)
    }

    /**
     * Computes the circumcenter of a face.
     * @method module:Core.Geometry#circumcenter
     * @param {module:Core.Face} f The face whose circumcenter needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    circumcenter(f: Face) {
        let h = f.halfedge
        let a = this.pos(h.vertex)
        let b = this.pos(h.next.vertex)
        let c = this.pos(h.prev.vertex)

        if (f.isBoundaryLoop()) return a.plus(b).over(2)

        let ac = c.minus(a)
        let ab = b.minus(a)
        let w = ab.cross(ac)

        let u = w.cross(ab).times(ac.norm2())
        let v = ac.cross(w).times(ab.norm2())
        let x = u.plus(v).over(2 * w.norm2())

        return x.plus(a)
    }

    /**
     * Computes an orthonormal bases for a face.
     * @method module:Core.Geometry#orthonormalBases
     * @param {module:Core.Face} f The face on which the orthonormal bases needs to be computed.
     * @returns {module:LinearAlgebra.Vector[]} An array containing two orthonormal vectors tangent to the face.
     */
    orthonormalBases(f: Face) {
        let e1 = this.vector(f.halfedge).unit()
        let normal = this.faceNormal(f)
        let e2 = normal.cross(e1)
        return [e1, e2]
    }

    /**
     * Computes the angle (in radians) at a corner.
     * @method module:Core.Geometry#angle
     * @param {module:Core.Corner} c The corner at which the angle needs to be computed.
     * @returns {number} The angle clamped between 0 and π.
     */
    angle(c: Corner) {
        let u = this.vector(c.halfedge.prev).unit()
        let v = this.vector(c.halfedge.next).negated().unit()
        return Math.acos(Math.max(-1.0, Math.min(1.0, u.dot(v))))
    }

    /**
     * Computes the cotangent of the angle opposite to a halfedge.
     * @method module:Core.Geometry#cotan
     * @param {module:Core.Halfedge} h The halfedge opposite to the angle whose cotangent needs to be computed.
     * @returns {number}
     */
    cotan(h: Halfedge) {
        if (h.onBoundary) return 0.0
        let u = this.vector(h.prev)
        let v = this.vector(h.next).negated()
        return u.dot(v) / u.cross(v).norm()
    }

    /**
     * Computes the signed angle (in radians) between two adjacent faces.
     * @method module:Core.Geometry#dihedralAngle
     * @param {module:Core.Halfedge} h The halfedge (shared by the two adjacent faces) on which
     * the dihedral angle is computed.
     * @returns {number} The dihedral angle.
     */
    dihedralAngle(h: Halfedge) {
        if (h.onBoundary || h.twin.onBoundary) return 0.0

        let n1 = this.faceNormal(h.face)
        let n2 = this.faceNormal(h.twin.face)
        let w = this.vector(h).unit()
        let cosTheta = n1.dot(n2)
        let sinTheta = n1.cross(n2).dot(w)
        return Math.atan2(sinTheta, cosTheta)
    }

    /**
     * Computes the barycentric dual area of a vertex.
     * @method module:Core.Geometry#barycentricDualArea
     * @param {module:Core.Vertex} v The vertex whose barycentric dual area needs to be computed.
     * @returns {number}
     */
    barycentricDualArea(v: Vertex) {
        let area = 0.0
        for (let f of v.adjacentFaces()) {
            area += this.area(f) / 3
        }

        return area
    }

    /**
     * Computes the circumcentric dual area of a vertex.
     * @see {@link http://www.cs.cmu.edu/~kmcrane/Projects/Other/TriangleAreasCheatSheet.pdf}
     * @method module:Core.Geometry#circumcentricDualArea
     * @param {module:Core.Vertex} v The vertex whose circumcentric dual area needs to be computed.
     * @returns {number}
     */
    circumcentricDualArea(v: Vertex) {
        let area = 0.0
        for (let h of v.adjacentHalfedges()) {
            let u2 = this.vector(h.prev).norm2()
            let v2 = this.vector(h).norm2()
            let cotAlpha = this.cotan(h.prev)
            let cotBeta = this.cotan(h)

            area += (u2 * cotAlpha + v2 * cotBeta) / 8
        }

        return area
    }

    /**
     * Computes the normal at a vertex using the "equally weighted" method.
     * @method module:Core.Geometry#vertexNormalEquallyWeighted
     * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    vertexNormalEquallyWeighted(v: Vertex) {
        let n = new Vector()
        for (let f of v.adjacentFaces()) {
            let normal = this.faceNormal(f)

            n.incrementBy(normal)
        }

        n.normalize()

        return n
    }

    /**
     * Computes the normal at a vertex using the "face area weights" method.
     * @method module:Core.Geometry#vertexNormalAreaWeighted
     * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    vertexNormalAreaWeighted(v: Vertex) {
        let n = new Vector()
        for (let f of v.adjacentFaces()) {
            let normal = this.faceNormal(f)
            let area = this.area(f)

            n.incrementBy(normal.times(area))
        }

        n.normalize()

        return n
    }

    /**
     * Computes the normal at a vertex using the "tip angle weights" method.
     * @method module:Core.Geometry#vertexNormalAngleWeighted
     * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    vertexNormalAngleWeighted(v: Vertex) {
        let n = new Vector()
        for (let c of v.adjacentCorners()) {
            let normal = this.faceNormal(c.halfedge.face)
            let angle = this.angle(c)

            n.incrementBy(normal.times(angle))
        }

        n.normalize()

        return n
    }

    /**
     * Computes the normal at a vertex using the "gauss curvature" method.
     * @method module:Core.Geometry#vertexNormalGaussCurvature
     * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    vertexNormalGaussCurvature(v: Vertex) {
        let n = new Vector()
        for (let h of v.adjacentHalfedges()) {
            let weight = (0.5 * this.dihedralAngle(h)) / this.length(h.edge)

            n.decrementBy(this.vector(h).times(weight))
        }

        n.normalize()

        return n
    }

    /**
     * Computes the normal at a vertex using the "mean curvature" method (same as the "area gradient" method).
     * @method module:Core.Geometry#vertexNormalMeanCurvature
     * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    vertexNormalMeanCurvature(v: Vertex) {
        let n = new Vector()
        for (let h of v.adjacentHalfedges()) {
            let weight = 0.5 * (this.cotan(h) + this.cotan(h.twin))

            n.decrementBy(this.vector(h).times(weight))
        }

        n.normalize()

        return n
    }

    /**
     * Computes the normal at a vertex using the "inscribed sphere" method.
     * @method module:Core.Geometry#vertexNormalSphereInscribed
     * @param {module:Core.Vertex} v The vertex on which the normal needs to be computed.
     * @returns {module:LinearAlgebra.Vector}
     */
    vertexNormalSphereInscribed(v: Vertex) {
        let n = new Vector()
        for (let c of v.adjacentCorners()) {
            let u = this.vector(c.halfedge.prev)
            let v = this.vector(c.halfedge.next).negated()

            n.incrementBy(u.cross(v).over(u.norm2() * v.norm2()))
        }

        n.normalize()

        return n
    }

    /**
     * Computes the angle defect at a vertex (= 2π minus the sum of incident angles
     * at an interior vertex or π minus the sum of incident angles at a boundary vertex).
     * @method module:Core.Geometry#angleDefect
     * @param {module:Core.Vertex} v The vertex whose angle defect needs to be computed.
     * @returns {number}
     */
    angleDefect(v: Vertex) {
        let angleSum = 0.0
        for (let c of v.adjacentCorners()) {
            angleSum += this.angle(c)
        }

        return v.onBoundary() ? Math.PI - angleSum : 2 * Math.PI - angleSum
    }

    /**
     * Computes the total angle defect (= 2π times the euler characteristic of the mesh).
     * @method module:Core.Geometry#totalAngleDefect
     * @returns {number}
     */
    totalAngleDefect() {
        let totalDefect = 0.0
        for (let v of this.mesh.vertices) {
            totalDefect += this.angleDefect(v)
        }

        return totalDefect
    }

    /**
     * Computes the (integrated) scalar gauss curvature K at a vertex.
     */
    scalarGaussCurvature(v: Vertex): number {
        return this.angleDefect(v)
    }

    /**
     * Computes the (integrated) scalar mean curvature H at a vertex.
     */
    scalarMeanCurvature(v: Vertex): number {
        let sum = 0.0
        for (let h of v.adjacentHalfedges()) {
            sum += 0.5 * this.length(h.edge) * this.dihedralAngle(h)
        }
        return sum
    }

    /**
     * Computes the (pointwise) minimum and maximum principal curvature values at a vertex.
     * @method module:Core.Geometry#principalCurvatures
     * @param {module:Core.Vertex} v The vertex on which the principal curvatures need to be computed.
     * @returns {number[]} An array containing the minimum and maximum principal curvature values at a vertex.
     */
    principalCurvatures(v: Vertex): number[] {
        let A = this.circumcentricDualArea(v)
        let H = (this.scalarMeanCurvature(v) as number) / A
        let K = this.angleDefect(v) / A

        let discriminant = H * H - K
        if (discriminant > 0) discriminant = Math.sqrt(discriminant)
        else discriminant = 0

        let k1 = H - discriminant
        let k2 = H + discriminant

        return [k1, k2]
    }

    /**
     * Get the Gaussian curvature
     */
    K(): Serie {
        return Serie.create({
            array: this.mesh.vertices.map((v) => this.angleDefect(v)),
            itemSize: 1,
        })
    }

    /**
     * Get the mean curvature
     */
    H(): Serie {
        return Serie.create({
            array: this.mesh.vertices.map((v) => this.scalarMeanCurvature(v)),
            itemSize: 1,
        })
    }

    /**
     * Get the first principal curvature
     */
    k1(): Serie {
        const array = this.mesh.vertices.map((v, i) => {
            const c = this.principalCurvatures(v) as number[]
            return c[0]
        })
        return Serie.create({ array, itemSize: 1 })
    }

    /**
     * Get the second principal curvature
     */
    k2(): Serie {
        const array = this.mesh.vertices.map((v, i) => {
            const c = this.principalCurvatures(v) as number[]
            return c[1]
        })
        return Serie.create({ array, itemSize: 1 })
    }
}

// ====================================================================

class Vector {
    x: number
    y: number
    z: number

    constructor(x: number | number[] = 0, y?: number, z?: number) {
        if (Array.isArray(x)) {
            this.x = x[0]
            this.y = x[1]
            this.z = x[2]
        } else {
            this.x = x
            this.y = y !== undefined ? y : 0
            this.z = z !== undefined ? z : 0
        }
    }

    /**
     * Computes the Euclidean length of this vector.
     * @method Vector#norm
     * @returns {number}
     */
    norm() {
        return Math.sqrt(this.norm2())
    }

    /**
     * Computes the Euclidean length squared of this vector.
     * @method Vector#norm2
     * @returns {number}
     */
    norm2() {
        return this.dot(this)
    }

    /**
     * Divides this vector by its Euclidean length.
     * @method Vector#normalize
     */
    normalize() {
        let n = this.norm()
        this.x /= n
        this.y /= n
        this.z /= n
    }

    /**
     * Returns a normalized copy of this vector.
     * @method Vector#unit
     * @returns {Vector}
     */
    unit() {
        let n = this.norm()
        let x = this.x / n
        let y = this.y / n
        let z = this.z / n

        return new Vector(x, y, z)
    }

    /**
     * Checks whether this vector's components are finite.
     * @method Vector#isValid
     * @returns {boolean}
     */
    isValid() {
        return (
            !isNaN(this.x) &&
            !isNaN(this.y) &&
            !isNaN(this.z) &&
            isFinite(this.x) &&
            isFinite(this.y) &&
            isFinite(this.z)
        )
    }

    /**
     * u += v
     * @method Vector#incrementBy
     * @param {Vector} v The vector added to this vector.
     */
    incrementBy(v: Vector | number[]) {
        if (Array.isArray(v)) {
            this.x += v[0]
            this.y += v[1]
            this.z += v[2]
        } else {
            this.x += v.x
            this.y += v.y
            this.z += v.z
        }
    }

    /**
     * u -= v
     * @method Vector#decrementBy
     * @param {Vector} v The vector subtracted from this vector.
     */
    decrementBy(v: Vector | number[]) {
        if (Array.isArray(v)) {
            this.x -= v[0]
            this.y -= v[1]
            this.z -= v[2]
        } else {
            this.x -= v.x
            this.y -= v.y
            this.z -= v.z
        }
    }

    /**
     * u *= s
     * @method Vector#scaleBy
     * @param {number} s The number this vector is scaled by.
     */
    scaleBy(s: number) {
        this.x *= s
        this.y *= s
        this.z *= s
    }

    /**
     * u /= s
     * @method Vector#divideBy
     * @param {number} s The number this vector is divided by.
     */
    divideBy(s: number) {
        this.scaleBy(1 / s)
    }

    /**
     * Returns u + v
     * @method Vector#plus
     * @param {Vector} v The vector added to this vector.
     * @return {Vector}
     */
    plus(v: Vector) {
        return new Vector(this.x + v.x, this.y + v.y, this.z + v.z)
    }

    /**
     * Returns u - v
     * @method Vector#minus
     * @param {Vector} v The vector subtracted from this vector.
     * @return {Vector}
     */
    minus(v: Vector) {
        return new Vector(this.x - v.x, this.y - v.y, this.z - v.z)
    }

    /**
     * Returns u * s
     * @method Vector#times
     * @param {number} s The number this vector is multiplied by.
     * @return {Vector}
     */
    times(s: number) {
        return new Vector(this.x * s, this.y * s, this.z * s)
    }

    /**
     * Returns u / s
     * @method Vector#over
     * @param {number} s The number this vector is divided by.
     * @return {Vector}
     */
    over(s: number) {
        return this.times(1 / s)
    }

    /**
     * Returns -u
     * @method Vector#negated
     * @return {Vector}
     */
    negated() {
        return this.times(-1)
    }

    /**
     * Computes the dot product of this vector and v
     * @method Vector#dot
     * @param {Vector} v The vector this vector is dotted with.
     * @return {number}
     */
    dot(v: Vector) {
        return this.x * v.x + this.y * v.y + this.z * v.z
    }

    /**
     * Computes the cross product of this vector and v
     * @method Vector#cross
     * @param {Vector} v The vector this vector is crossed with.
     * @return {Vector}
     */
    cross(v: Vector) {
        return new Vector(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x,
        )
    }
}
