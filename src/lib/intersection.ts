// from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

import { vec } from '@youwol/math'

export type Ray = {
    origin: vec.Vector3
    direction: vec.Vector3
}

export type Point3 = [number, number, number]

/**
 * Compute the intersected point between a ray and a triangle in 3D.
 * @returns The intersected point or undefined if no intersection
 */
export function intersectTriangle({
    ray,
    p1,
    p2,
    p3,
}: {
    ray: Ray
    p1: Point3
    p2: Point3
    p3: Point3
}) {
    const a = p1
    const b = p2
    const c = p3
    let edge1 = sub(b, a)
    let edge2 = sub(c, a)
    const normal = cross(edge1, edge2)
    let DdN = dot(ray.direction, normal)
    let sign

    if (DdN > 0) {
        sign = 1
    } else if (DdN < 0) {
        sign = -1
        DdN = -DdN
    } else {
        return undefined
    }

    const diff = sub(ray.origin, a)
    edge2 = cross(diff, edge2)
    const DdQxE2 = sign * dot(ray.direction, edge2)

    // b1 < 0, no intersection
    if (DdQxE2 < 0) {
        return undefined
    }

    edge1 = cross(edge1, diff)
    const DdE1xQ = sign * dot(ray.direction, edge1)

    // b2 < 0, no intersection
    if (DdE1xQ < 0) {
        return undefined
    }

    // b1+b2 > 1, no intersection
    if (DdQxE2 + DdE1xQ > DdN) {
        return undefined
    }

    // Line intersects triangle, check if ray does.
    const QdN = -sign * dot(diff, normal)

    // t < 0, no intersection
    if (QdN < 0) {
        return undefined
    }

    // Ray intersects triangle.
    return at(ray, QdN / DdN)
}

// ------------------------------------------------------------

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]

const cross = (a, b) => {
    const ax = a[0],
        ay = a[1],
        az = a[2]
    const bx = b[0],
        by = b[1],
        bz = b[2]
    return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx]
}

const at = (ray: Ray, t) => {
    return [
        ray.direction[0] * t + ray.origin[0],
        ray.direction[1] * t + ray.origin[1],
        ray.direction[2] * t + ray.origin[2],
    ]
}
