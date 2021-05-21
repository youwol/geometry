/**
 * Some utility functions and classes
 * @module Utils
 */
import { Serie } from "@youwol/dataframe"
import * as math from '@youwol/math'

/**
 * @brief The definition of a plane in 3D
 */
export type Plane = {
    point : math.vec.Vector3,
    normal: math.vec.Vector3
}


/**
 * @brief Triangle coordinate system.
 * Allows to transform `math.Vector3` from global to triangle local coordinate system, 
 * and vis versa
 * @category Utils
 */
export class TriangleCSys {
    private mat_ = [1,0,0, 0,1,0, 0,0,1]

    setBase(x: math.vec.Vector3, y: math.vec.Vector3, z: math.vec.Vector3) {
        let v1 = vector(y, x, true) // see bottom for vector()
        let v2 = vector(z, x, true)
        return this.setNormal(math.vec.cross(v1,v2))
    }

    setNormal(n: math.vec.Vector3) {
        const TINY_ANGLE_ = 1e-7
        let x3 = math.vec.clone(n)
        if (math.vec.norm(x3) < TINY_ANGLE_) {
            throw new Error('Cannot calculate element normal. Elt must have a very odd shape.')
        }
        x3 = math.vec.normalize(x3)

        let x2 = math.vec.cross([0, 0, 1], x3 as math.vec.Vector3)
        if (math.vec.norm(x2) < TINY_ANGLE_) {
            x2 = [0, 1, 0]
        }
        x2 = math.vec.normalize(x2) as math.vec.Vector3

        let x1 = math.vec.cross(x2, x3 as math.vec.Vector3)
        x1 = math.vec.normalize(x1) as math.vec.Vector3

        this.mat_[0] = x1[0]
        this.mat_[1] = x2[0]
        this.mat_[2] = x3[0]
        this.mat_[3] = x1[1]
        this.mat_[4] = x2[1]
        this.mat_[5] = x3[1]
        this.mat_[6] = x1[2]
        this.mat_[7] = x2[2]
        this.mat_[8] = x3[2]
    }

    get matrix() {
        return this.mat_
    }
    get dip(): math.vec.Vector3 {
        return [this.mat_[0][0], this.mat_[1][0], this.mat_[2][0]]
    }
    get strike() : math.vec.Vector3 {
        return [this.mat_[0][1], this.mat_[1][1], this.mat_[2][1]]
    }
    get normal(): math.vec.Vector3 {
        return [this.mat_[0][2], this.mat_[1][2], this.mat_[2][2]]
    }

    toLocal(v: math.vec.Vector3): math.vec.Vector3 {
        return multVec(this.mat_ as math.vec.Vector9, v)
    }

    toGlobal(v: math.vec.Vector3): math.vec.Vector3 {
        return multTVec(this.mat_ as math.vec.Vector9, v)
    }

    shearComponent(t: math.vec.Vector3): math.vec.IVector {
        return  math.vec.scale(math.vec.sub(t, this.normalComponent(t)), -1)
    }

    normalComponent(t: math.vec.Vector3): math.vec.IVector {
        return math.vec.scale(this.normal, -math.vec.dot(t, this.normal))
    }
}

// -------------------------------------------

/**
 * @brief Plane fitting to many 3D points
 * @param points The points coordinates in flat array
 * @return {point: Vec3, normal: Vec3} The plane parameters fitting the points
 * in a least squares sens
 */
export function fittingPlane(points: Serie): Plane {
    if (points.length < 3) {
        throw new Error('Not enough points to fit a plane')
    }

    const sum: math.vec.Vector3 = [0, 0, 0]
    for (let i=0; i<points.array.length; i+=3) {
        sum[0] += points.array[i]
        sum[1] += points.array[i+1]
        sum[2] += points.array[i+2]
    }
    let centroid = math.vec.scale(sum, 1/(points.length) ) as math.vec.Vector3

    // Calc full 3x3 covariance matrix, excluding symmetries:
    let xx = 0.0, xy = 0.0, xz = 0.0
    let yy = 0.0, yz = 0.0, zz = 0.0

    for (let i=0; i<points.length; i+=3) {
        let r = [points.array[i]-centroid[0], points.array[i+1]-centroid[1], points.array[i+2]-centroid[2]]
        xx += r[0]**2
        xy += r[0] * r[1]
        xz += r[0] * r[2]
        yy += r[1]**2
        yz += r[1] * r[2]
        zz += r[2]**2
    }

    let det_x = yy*zz - yz*yz
    let det_y = xx*zz - xz*xz
    let det_z = xx*yy - xy*xy
    let det_max = Math.max(det_x, det_y, det_z)
    if (det_max <= 0) {
        throw new Error('determlinant is <0')
    }

    // Pick path with best conditioning:
    let dir: math.vec.Vector3 = [0,0,0]
    if (det_max == det_x) {
        dir = [det_x, xz*yz - xy*zz, xy*yz - xz*yy]
    } else if (det_max == det_y) {
        dir = [xz*yz - xy*zz, det_y, xy*xz - yz*xx]
    } else {
        dir = [xy*yz - xz*yy, xy*xz - yz*xx, det_z]
    }

    return {
        point: centroid,
        normal: math.vec.normalize(dir) as math.vec.Vector3
    }
}

/**
 * @brief Get the distances from 3D points to a plane
 * @param pt The considered 3D points or one point
 * @param plane The plane defined with a point and its normal
 */
export function distanceFromPointToPlane(pt: math.vec.Vector3 | Serie, plane: Plane): number | Serie {
    if (pt instanceof Serie) {
        if (pt.itemSize !== 3) throw new Error('points must have itemSize = 3 (coordinates)')
        return pt.map( point => _distanceFromPointToPlane_(point, plane) )
    }

    return _distanceFromPointToPlane_(pt, plane)
}

/**
 * @brief Get the vectors from 3D points to a plane
 * @param pt The considered 3D points or one point
 * @param plane The plane defined with a point and its normal
 */
export function vectorFromPointsToPlane(pt: math.vec.Vector3 | Serie, plane: Plane): math.vec.Vector3 | Serie {
    if (pt instanceof Serie) {
        if (pt.itemSize !== 3) throw new Error('points must have itemSize = 3 (coordinates)')
        return pt.map( point => _vectorFromPointToPlane_(point, plane) )
    }

    return _vectorFromPointToPlane_(pt, plane)
}

/**
 * Project a 3D vector onto the plane and get the in-plane coordinates (2D)
 * @param p The point to project
 * @param plane The plane
 * @returns [x,y] coordinates
 */
export function project(p: math.vec.Vector3 | Serie, plane: Plane) {
    // Like traction vector to be projected onto a plane with normal n
    // t - t.n n --> ts

    const _project = (t: math.vec.Vector3, n: math.vec.Vector3) => {
        const d = math.vec.dot(t, n)
        return [t[0]-d*n[0], t[1]-d*n[1]]
    }

    if (p instanceof Serie) {
        return p.map( point => _project(point, plane.normal) )
    }

    return _project(p, plane.normal)
}

// ----------------------------------------------------------------------

/**
 * @brief Get the distance from a 3D point to a plane
 * @param p The considered 3D point
 * @param plane The plane defined with a point and its normal
 */
 function _distanceFromPointToPlane_(p: math.vec.Vector3, plane: Plane): number {
    const sn = -math.vec.dot( plane.normal, vector(plane.point, p, true) )
    const sd = math.vec.dot(plane.normal, plane.normal)
    const sb = sn / sd
    const B = math.vec.add( p, math.vec.scale(plane.normal, sb) ) as math.vec.Vector3
    return math.vec.norm( vector(p, B) )
}

function _vectorFromPointToPlane_(p: math.vec.Vector3, plane: Plane): math.vec.Vector3 {
    const sn = -math.vec.dot( plane.normal, vector(plane.point, p, true) )
    const sd = math.vec.dot(plane.normal, plane.normal)
    const sb = sn / sd
    const B = math.vec.add( p, math.vec.scale(plane.normal, sb) ) as math.vec.Vector3
    return vector(p, B)
}

function vector(p1: math.vec.Vector3, p2: math.vec.Vector3, normalize: boolean=false): math.vec.Vector3 {
    if (normalize) {
        const x = p2[0]-p1[0]
        const y = p2[1]-p1[1]
        const z = p2[2]-p1[2]
        const n = Math.sqrt(x**2+y**2+z**2)
        return [x/n, y/n, z/n]
    }
    return [p2[0]-p1[0], p2[1]-p1[1], p2[2]-p1[2]]
}

function multVec(e: math.vec.Vector9, v: math.vec.Vector3): math.vec.Vector3 {
    const x = v[0], y = v[1], z = v[2]
    return [
        e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z,
        e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z,
        e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z]
}

function multTVec(e: math.vec.Vector9, v: math.vec.Vector3): math.vec.Vector3 {
    const x = v[0], y = v[1], z = v[2]
    return [
        e[ 0 ] * x + e[ 1 ] * y + e[ 2 ] * z,
        e[ 3 ] * x + e[ 4 ] * y + e[ 5 ] * z,
        e[ 6 ] * x + e[ 7 ] * y + e[ 8 ] * z]
}