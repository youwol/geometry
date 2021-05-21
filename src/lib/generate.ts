import { Serie, DataFrame } from "@youwol/dataframe"
import { triangulate } from "./triangulate"

/**
 * Generate a meshed ellipse made of nbRings rings. The number of points
 * in a ring is function of the number of rings: nbNodes = ringIndex * density, with
 * ringIndex starting from 1 and ending at nbRings.
 * @param a The x axis length
 * @param b The y axis length
 * @param nbRings The number of internal rings (default 8)
 * @param center The position of the ellipse center
 */
export function generateEllipse(
    {a, b, nbRings=4, density=8, center=[0,0,0]}:
    {a: number, b: number, nbRings?: number, density?: number, center?:number[]}): DataFrame
{
    const add = (x: number, y: number) => nodes.push(x+center[0], y+center[1], center[2])
    const onering = (an: number, bn: number, n: number) => {
        for (let i=0; i<n; ++i) {
            const theta = 2*Math.PI*i/(n-1)
            const x = an*Math.cos(theta)/2
            const y = bn*Math.sin(theta)/2
            add(x, y)
        }
    }
    const nodes: Array<number> = []
    const an = a/nbRings
    const bn = b/nbRings
    for (let i=1; i<=nbRings; ++i) {
        onering(an*i, bn*i, density*i)
    }
    add(0,0)

    return triangulate( Serie.create({array: nodes, itemSize: 3}) )
}

/**
 * Generate a meshed rectangle
 * @param a The x axis length
 * @param b The y axis length
 * @param na The number of points along the x axis
 * @param nb The number of points along the y axis
 * @param center The position of the rectangle center
 */
export function generateRectangle(
    {a, b, na, nb, center=[0,0,0]}:
    {a: number, b: number, na: number, nb: number, center?:number[]}): DataFrame
{
    const add = (x: number, y: number) => nodes.push(x+center[0]-a/2, y+center[1]-b/2, center[2])
    const nodes: Array<number> = []
    const aa = 1/(na-1)
    const bb = 1/(nb-1)
    for (let i=0; i<na; ++i) {
        for (let j=0; j<nb; ++j) {
            add(a*i*aa, b*j*bb)
        }
    }

    return triangulate( Serie.create({array: nodes, itemSize: 3}) )
}
