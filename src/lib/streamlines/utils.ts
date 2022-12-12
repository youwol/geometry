import { Serie } from '@youwol/dataframe'

/**
 * Detect the size of the 2D-grid and return `[nx, ny]` if valid.
 * Undefined otherwise.
 */
export const getDimsGrid2D = (positions: Serie, eps = 1e-7) => {
    const start = positions.itemAt(0)[0]
    let nx = 0
    positions.forEach((p) => {
        if (Math.abs(p[0] - start) < eps) {
            nx++
        }
    })
    if (nx < 2) {
        console.warn('Seems that the grid is not regular')
        return undefined
    }

    const ny = positions.count / nx
    if (Number.isInteger(ny) === false) {
        console.warn('Seems that the grid is not regular')
        return undefined
    }

    return [nx, ny]
}
