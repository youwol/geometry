import { DataFrame, Decomposer, Serie } from '@youwol/dataframe'
import { fromTriangleToNode } from './fromTriangleToNode'

/**
 * A decomposer which uses a decomposer and interpolate from triangles to nodes
 * @example
 * The NormalsDecomposer get the normals at triangles but we want those normals at vertices.
 * ```ts
 * const decomposer = new TriangleToNodeDecomposer({
 *      positions,
 *      indices,
 *      decomposer: new NormalsDecomposer('n')
 * })
 *
 * const mng   = new Manager(df, [decomposer])
 * const serie = mng.serie(3, 'n')
 * ```
 */
export class TriangleToNodeDecomposer implements Decomposer {
    private positions: Serie
    private indices: Serie
    private decomposer: Decomposer

    constructor({
        positions,
        indices,
        decomposer,
    }: {
        positions: Serie
        indices: Serie
        decomposer: Decomposer
    }) {
        this.positions = positions
        this.indices = indices
        this.decomposer = decomposer
    }

    names(
        df: DataFrame,
        itemSize: number,
        serie: Serie,
        name: string,
    ): string[] {
        return this.decomposer.names(df, itemSize, serie, name)
    }

    serie(df: DataFrame, itemSize: number, name: string): Serie {
        const s = this.decomposer.serie(df, itemSize, name)
        if (s) {
            return fromTriangleToNode({
                positions: this.positions,
                indices: this.indices,
                serie: this.decomposer.serie(df, itemSize, name),
            })
        } else {
            return undefined
        }
    }
}
