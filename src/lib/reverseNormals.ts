import { Serie } from "@youwol/dataframe";

/**
 * Reverse les normals given in a Serie.
 * @example
 * ```js
 * import { reverseNormals } from '@youwol/geometry'
 * import { decodeGocadTS } from '@youwol/io'
 * 
 * const surfaces = io.decodeGocadTS(buffer)
 * 
 * // Reverse all the normals for all the loaded surfaces
 * surfaces.forEach( surface => {
 *      surface.indices = reverseNormals(surface.indices)
 * })
 * ```
 * @param indices The indices of the triangles as a serie (flat-array)
 * @returns The new indices as a serie
 * @caterogy dataframe
 */
export function reverseNormals(indices: Serie): Serie {
    if (indices.itemSize !==3) throw new Error('Only triangles are allowed')
    return indices.map( i => [i[0], i[2], i[1]] )
}
