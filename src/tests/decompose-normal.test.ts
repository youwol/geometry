import { DataFrame, Serie, Manager, Decomposer } from '@youwol/dataframe'
import { NormalsDecomposer } from '@youwol/math'
import { fromTriangleToNode, TriangleToNodeDecomposer } from '../lib'

// class T2N implements Decomposer {
//     private positions: Serie
//     private indices: Serie
//     private decomposer: Decomposer

//     constructor({positions, indices, decomposer}:{positions: Serie, indices: Serie, decomposer: Decomposer}) {
//         this.positions  = positions
//         this.indices    = indices
//         this.decomposer = decomposer
//     }

//     names(df: DataFrame, itemSize: number, serie: Serie, name: string): string[] {
//         return this.decomposer.names(df, itemSize, serie, name)
//     }

//     serie(df: DataFrame, itemSize: number, name: string): Serie {
//         return fromTriangleToNode({
//             positions: this.positions,
//             indices: this.indices,
//             serie: this.decomposer.serie(df, itemSize, name)
//         })
//     }
// }

test('test normals on AttributeManager', () => {
    const df = DataFrame.create({
        series: {
            positions: Serie.create( {array: [0,0,0, 1,0,0, 1,1,0], itemSize: 3} ),
            indices  : Serie.create( {array: [0,1,2], itemSize: 3} )
        }
    })

    {
        const mng = new Manager(df, [
            new NormalsDecomposer('n')
        ])
        
        expect(mng.names(3)).toEqual(['n'])

        const ns = mng.serie(3, 'n').array
        expect(mng.serie(3, 'n').count).toEqual(1)
        expect(ns[0]).toEqual(0)
        expect(ns[1]).toEqual(0)
        expect(ns[2]).toEqual(1)
    }

    // --------------------------------------------

    {
        const decomposer = new TriangleToNodeDecomposer({
            positions : df.series.positions,
            indices   : df.series.indices,
            decomposer: new NormalsDecomposer('n')
        })

        const mng = new Manager(df, [decomposer])

        expect(mng.names(3)).toEqual(['n'])

        const ns = mng.serie(3, 'n').array
        expect(mng.serie(3, 'n').count).toEqual(3)
        expect(ns[0]).toEqual(0)
        expect(ns[1]).toEqual(0)
        expect(ns[2]).toEqual(1)
    }
})
