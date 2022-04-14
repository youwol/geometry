import { Serie } from "@youwol/dataframe"
import { Surface } from "./he"

/**
 * Get borders ([[Serie]]) as pair of two 3D nodes, i.e., `[x11,y11, x12,y12,  x21,y21, x22,y22, ...]`
 */
export function extractSurfaceBorders(positions: Serie, indices: Serie): Serie {
    const surface = Surface.create(positions, indices)
    return surface.bordersAsSerie
}
