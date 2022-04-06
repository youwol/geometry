import { Vector } from './Vector'

export type BoundingBox = {
    size  ?: number | undefined
    width : number
    height: number
    left  : number
    top   : number
}

export type CheckCallback = (d: number, p: Vector) => boolean

export type LookupGrid = {
    occupyCoordinates: (p: Vector) => void,
    isTaken: (x: number, y: number, checkCallback: CheckCallback) => boolean,
    isOutside: (x: number, y: number) => boolean
}

export type VelocityFunction = (p: Vector) => Vector

export type StreamLinesOptions = {
    vectorField         : (p: Vector) => Vector
    onStreamlineAdded   : (points: Vector[], config: StreamLinesOptions) => void | undefined
    onPointAdded        : (point: Vector, otherPoint: Vector, config: StreamLinesOptions) => boolean
    boundingBox         : BoundingBox
    forwardOnly         : boolean
    seed                ?: Vector
    dSep                : number  // Separation between streamlines. Naming according to the paper
    dTest               : number  // When should we stop integrating a streamline
    timeStep            : number
    stepsPerIteration   : number
    maxTimePerIteration : number
    maximumPointsPerLine?: number
    seedArray           ?: Vector[]
}
