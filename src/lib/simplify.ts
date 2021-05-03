/*
 (c) 2013, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/

import { ASerie, copy } from "@youwol/dataframe"
import { norm2, sub, IVector } from "@youwol/math"

/**
 * From `Simplify.js`, a high-performance JS polyline simplification library.
 * 
 * Polyline simplification dramatically reduces the number of points in a polyline while
 * retaining its shape, giving a huge performance boost when processing it and also
 * reducing visual noise. For example, it's essential when rendering a 70k-points line
 * chart or a map route in the browser using Canvas or SVG.
 * 
 * @param points Can be either 2D or 3D points defined in a Serie
 * 
 * @github [mourner.github.io/simplify-js](mourner.github.io/simplify-js)
 * @copyright 2013, Vladimir Agafonkin
 * @license BSD-2-Clause "Simplified" License
 */
export function simplify(points: ASerie, tolerance: number=1, highestQuality: boolean=false) {
    const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1
    return simplifyDouglasPeucker(highestQuality ? points : simplifyRadialDistance(points, sqTolerance), sqTolerance)
}



// -------------------------------------------------------------------------------------

// square distance between 2 points
const getSquareDistance = (p1: IVector, p2: IVector) => norm2(sub(p1, p2))

// square distance from a point to a segment
function getSquareSegmentDistance(p: IVector, p1: IVector, p2: IVector) {
    if (p.length === 2) {
        let x = p1[0],
            y = p1[1],
            dx = p2[0] - x,
            dy = p2[1] - y

        if (dx !== 0 || dy !== 0) {
            var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)
            if (t > 1) {
                x = p2[0]
                y = p2[1]

            } else if (t > 0) {
                x += dx * t
                y += dy * t
            }
        }
        dx = p[0] - x
        dy = p[1] - y

        return dx * dx + dy * dy
    }
    let x = p1[0],
        y = p1[1],
        z = p1[2],
        dx = p2[0] - x,
        dy = p2[1] - y,
        dz = p2[2] - z
    if (dx !== 0 || dy !== 0 || dz !== 0) {
        const t = ((p[0] - x) * dx + (p[1] - y) * dy + (p[2] - z) * dz) /
                (dx * dx + dy * dy + dz * dz)

        if (t > 1) {
            x = p2[0]
            y = p2[1]
            z = p2[2]

        } else if (t > 0) {
            x += dx * t
            y += dy * t
            z += dz * t
        }
    }

    dx = p[0] - x
    dy = p[1] - y
    dz = p[2] - z

    return dx * dx + dy * dy + dz * dz
}

// basic distance-based simplification
function simplifyRadialDistance(points: ASerie, sqTolerance: number): ASerie {
    let prevPoint = points.itemAt(0) as IVector
    const newPoints = [...prevPoint]
    let point: IVector = undefined
    
    const itemSize = points.itemSize

    for (let i = 1, len = points.count; i <len; ++i) {
        point = points.itemAt(i) as IVector
        if (getSquareDistance(point, prevPoint) > sqTolerance) {
            newPoints.push(...point)
            prevPoint = point
        }
    }

    if (prevPoint !== point) {
        newPoints.push(...point)
    }

    const r = points.image(points.length/itemSize, itemSize)
    return copy(newPoints, r)
}

// simplification using optimized Douglas-Peucker algorithm with recursion elimination
function simplifyDouglasPeucker(points: ASerie, sqTolerance: number): ASerie {
    let len = points.length,
        MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array,
        markers = new MarkerArray(len),
        first = 0,
        last = len - 1,
        stack = [],
        newPoints = [],
        i, maxSqDist, sqDist, index

    markers[first] = markers[last] = 1

    while (last) {
        maxSqDist = 0
        for (i = first + 1; i < last; i++) {
            sqDist = getSquareSegmentDistance(
                points.itemAt(i) as IVector,
                points.itemAt(first) as IVector,
                points.itemAt(last) as IVector
            )
            if (sqDist > maxSqDist) {
                index = i
                maxSqDist = sqDist
            }
        }
        if (maxSqDist > sqTolerance) {
            markers[index] = 1
            stack.push(first, index, index, last)
        }
        last = stack.pop()
        first = stack.pop()
    }

    for (i = 0; i < len; i++) {
        if (markers[i]) {
            newPoints.push(points[i])
        }
    }

    const itemSize = points.itemSize
    const r = points.image(points.length/itemSize, itemSize)
    return copy(newPoints, r)
}
