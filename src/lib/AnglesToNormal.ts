// import { Vector3, between_0_360, rad2deg, deg2rad } from "@youwol/math"

import { vec } from '@youwol/math'
import { between_0_360, deg2rad, rad2deg } from './extrude/angles'

export class AnglesToNormal {
    private _dip = 0
    private _dipAzim = 0
    private _n: vec.Vector3 = undefined

    get dipAngle() {
        return this._dip
    }
    get dipAzimuth() {
        return this._dipAzim
    }
    get strikeAngle() {
        return between_0_360(this._dipAzim - 90)
    }
    get strikeVector() {
        let l = vec.norm(this._n)
        if (l === 0) {
            l = 1
        }
        let nx = this._n[0] / l
        let ny = this._n[1] / l
        if (this._n[2] < 0) {
            nx = -nx
            ny = -ny
        }
        let s = [-ny, nx, 0] as vec.Vector3
        s = vec.normalize(s) as vec.Vector3
        return s
    }
    get normal() {
        return this._n
    }
    get normalX() {
        return this._n[0]
    }
    get normalY() {
        return this._n[1]
    }
    get normalZ() {
        return this._n[2]
    }

    setNormal(n: vec.Vector3) {
        this.__set_normal__(n)
        const n_ = this._n

        // Get the dip-azimuth
        let l = vec.norm(this._n)
        if (l === 0) {
            l = 1
        }
        let nx = n_[0] / l
        let ny = n_[1] / l
        if (n_[2] < 0) {
            // put the nornal up
            nx = -nx
            ny = -ny
        }
        let alpha = rad2deg(Math.asin(nx))

        if (ny < 0) {
            alpha = 180 - alpha
        }
        if (alpha < 0) {
            alpha = 360 + alpha
        }
        const dip_azim = alpha

        // Get the dip-angle
        let dip = 0
        if (n_[2] >= 0) {
            dip = rad2deg(Math.acos(n_[2]))
        } else {
            dip = rad2deg(Math.acos(-n_[2]))
        }
        this._dip = dip
        this._dipAzim = dip_azim
    }

    setOrientation({
        dipAngle,
        dipAzimuth,
    }: {
        dipAngle: number
        dipAzimuth: number
    }) {
        this.__set_angles__(dipAngle, dipAzimuth)
        const delta = deg2rad(dipAngle)
        const alpha = deg2rad(dipAzimuth)
        this._n = vec.normalize([
            Math.sin(delta) * Math.sin(alpha),
            Math.sin(delta) * Math.cos(alpha),
            Math.cos(delta),
        ]) as vec.Vector3
    }

    __set_normal__(n: vec.Vector3) {
        this._n = vec.clone(n) as vec.Vector3
        this._n = vec.normalize(this._n) as vec.Vector3
    }

    __set_angles__(dip: number, dipazim: number) {
        this._dip = dip
        this._dipAzim = dipazim
    }
}
