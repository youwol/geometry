export function deg2rad(a: number) {
    return (a * Math.PI) / 180
}

export function rad2deg(a: number) {
    return (a * 180) / Math.PI
}

export function between_0_360(a: number) {
    if (a < 0) while (a < 0) a += 360
    else if (a > 360) while (a > 360) a -= 360
    return a
}

export function between_0_180(a: number) {
    if (a < 0) while (a < 0) a += 180
    if (a > 180) while (a > 180) a -= 180
    return a
}

export function between_0_2pi(a: number) {
    const twopi = Math.PI * 2.0
    if (a < 0) while (a < 0) a += twopi
    if (a >= twopi) while (a >= twopi) a -= twopi
    return a
}

export function between_0_pi(a: number) {
    if (a < 0) while (a < 0) a += Math.PI
    if (a >= Math.PI) while (a >= Math.PI) a -= Math.PI
    return a
}
