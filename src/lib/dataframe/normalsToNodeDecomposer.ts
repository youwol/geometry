import { Serie, DataFrame} from "@youwol/dataframe"
import { NormalsDecomposer, vec } from "@youwol/math"
import { fromTriangleToNode } from "./fromTriangleToNode"

/**
 * Get normals to the node of a mesh
 * @category dataframe
 */
export class NormalsToNodeDecomposer extends NormalsDecomposer {
    /**
     * @hidden 
     */
    serie(df: DataFrame, itemSize: number, name: string): Serie {
        const serie = super.serie(df, itemSize, name)

        if (!serie) return undefined
        
        return fromTriangleToNode( {
            positions: df.series.positions,
            indices: df.series.indices,
            serie
        })
    }
}
