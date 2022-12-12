import { Serie } from '@youwol/dataframe'

/**
 * @category Extrude
 */
export type SurfaceType = {
    positions: Serie
    indices: Serie
}

/**
 * @category Extrude
 */
export type TraceInfo = {
    id: string // "no-name"
    dip: number // 30
    dipDirection: number // 90
    depth: number // 0.1
    rows: number // 5

    points: Serie
}
