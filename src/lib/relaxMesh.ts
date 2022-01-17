import { Serie } from "@youwol/dataframe"
import { vec } from "@youwol/math"
import { nodesAroundNode, Surface } from "."

/**
 * Beautify a flat triangulated surface
 * @returns 
 */
export function relaxMesh(positions: Serie, indices: Serie, iterations = 100, damp = 0.1): Serie {
    const surface = Surface.create(positions, indices)

    let meanArea = 0
    surface.forEachFace(f => meanArea += f.area )
    meanArea /= surface.nbFacets

    const meanEdge = Math.sqrt(4 * meanArea / Math.sqrt(3))

    for (let i=0; i<iterations; ++i) {
        surface.forEachNode( (n,i) => {
            if (n.isOnBorder === false) {
                let f = [0,0,0]
                nodesAroundNode(n, n1 => {
                    let f1 = vec.create(n.pos, n1.pos) // force vector
                    const norm = vec.norm(f1)          // length force vector
                    f1[0] /= norm; f1[1] /= norm
                    f = vec.add(f, vec.scale(f1, (norm - meanEdge)) ) as vec.Vector3
                })
                n.setPos(n.pos[0]+f[0]*damp, n.pos[1]+f[1]*damp, f[2])
            }
        })
    }
    
    return surface.nodesAsSerie
}