import { Node, Halfedge, Facet } from './combels'

/**
 * Loop over all nodes around a node
 */
export function nodesAroundNode(node: Node, cb: (n: Node, i: number) => void) {
    let cir = node.halfedge
    let i = 0
    do {
        const n = cir.opposite.node
        cb(n, i++)
        cir = cir.nextAroundNode
    } while (cir !== node.halfedge)
}

/**
 * Loop over all nodes around an halfedge
 */
export function nodesAroundHalfedge(
    edge: Halfedge,
    cb: (n: Node, i: number) => void,
) {
    let cir = edge
    let i = 0
    do {
        const e = cir.opposite.node
        cb(e, i++)
        cir = cir.nextAroundNode
    } while (cir !== edge)
}

/**
 * Loop over all facets around a node
 */
export function facetsAroundNode(
    node: Node,
    cb: (n: Facet, i: number) => void,
) {
    let cir = node.halfedge
    let i = 0
    do {
        const facet = cir.facet
        cb(facet, i++)
        cir = cir.nextAroundNode
    } while (cir !== node.halfedge)
}
