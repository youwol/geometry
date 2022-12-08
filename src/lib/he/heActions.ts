import { Action } from './action'
import { Surface } from './Surface'
import { SurfaceEditor } from './SurfaceEditor'
import { Halfedge, Facet, Node } from './combels'
import { CombelObserver } from './observer'

/**
 * @category Halfedge
 */
export class MoveNodeAction extends Action {
    private node: Node = undefined

    constructor(
        private n: Node,
        private translation: [number, number, number],
    ) {
        super('Move node')
        if (n === undefined) {
            this.valid = false
        }
        this.node = n
    }

    do() {
        const newPos = this.node.pos.map((x, i) => x + this.translation[i])
        this.node.setPos(newPos)
    }

    undo() {
        const newPos = this.node.pos.map((x, i) => x - this.translation[i])
        this.node.setPos(newPos)
    }
}

// -------------------------------------------------------------

/**
 * @category Halfedge
 */
class FacetRemovedObserver extends CombelObserver<Facet> {
    facets: Array<Facet> = []
    notifiedRemove(f: Facet) {
        this.facets.push(f)
    }
    clear() {
        this.facets = []
    }
}

// This one is a little more complex, but not the most complex
/**
 * @category Halfedge
 */
export class FillHoleAction extends Action {
    private edt: SurfaceEditor = undefined
    private observer = new FacetRemovedObserver()

    constructor(private surface: Surface, private h: Halfedge) {
        super('Fill hole')

        this.edt = new SurfaceEditor(surface)
        if (h === undefined || h.isBorder === false) {
            this.valid = false
        }
    }

    do() {
        this.observer.clear()
        this.edt.registerFacetObserser(this.observer)
        this.edt.beginModif()
        this.edt.fillHole(this.h, true)
        this.edt.endModif()
        this.edt.unregisterFacetObserser(this.observer)
    }

    undo() {
        this.edt.beginModif()
        this.observer.facets.forEach((f) => this.edt.deleteFacet(f))
        this.edt.endModif()
    }
}

// -------------------------------------------------------------
