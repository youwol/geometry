/**
 * See https://github.com/anvaka/streamlines from Ankava
 * MIT License
 */

import { Vector } from "./Vector"
import { createLookupGrid } from "./createLookupGrid"
import { createStreamlineIntegrator } from "./integrator"
import { BoundingBox, StreamLinesOptions } from "./types"

enum State {
    STATE_INIT,
    STATE_STREAMLINE,
    STATE_PROCESS_QUEUE,
    STATE_DONE,
    STATE_SEED_STREAMLINE
}

export function streamlines(protoOptions: StreamLinesOptions) {
    const options = protoOptions

    if (!protoOptions) {
        throw new Error('Configuration is required to compute streamlines')
    }

    if (!protoOptions.boundingBox) {
        throw new Error('No bounding box passed to streamline. Creating default one')
    }

    normalizeBoundingBox(options.boundingBox)

    const boundingBox = options.boundingBox

    if (protoOptions.seedArray !== undefined && Array.isArray(protoOptions.seedArray)) {
        const seed = protoOptions.seedArray.shift()
        options.seed = new Vector(seed.x, seed.y)
        options.seedArray = protoOptions.seedArray
    } else if (protoOptions.seed !== undefined) {
        options.seed = protoOptions.seed
    }
    else {
        options.seed = new Vector(
            Math.random() * boundingBox.width  + boundingBox.left,
            Math.random() * boundingBox.height + boundingBox.top
        )
    }

    // Separation between streamlines. Naming according to the paper.
    options.dSep = protoOptions.dSep > 0 ? protoOptions.dSep
        : 1 / Math.max(boundingBox.width, boundingBox.height)

    // When should we stop integrating a streamline.
    options.dTest = protoOptions.dTest > 0 ? protoOptions.dTest : options.dSep * 0.5

    // Lookup grid helps to quickly tell if there are points nearby
    const grid = createLookupGrid(boundingBox, options.dSep, options.isOutsideFct)

    // Integration time step.
    options.timeStep            = protoOptions.timeStep > 0 ? protoOptions.timeStep : 0.01
    options.stepsPerIteration   = protoOptions.stepsPerIteration > 0 ? protoOptions.stepsPerIteration : 10
    options.maxTimePerIteration = protoOptions.maxTimePerIteration > 0 ? protoOptions.maxTimePerIteration : 1000

    const stepsPerIteration = options.stepsPerIteration
    //const resolve
    let state = State.STATE_INIT
    const finishedStreamlineIntegrators: Array<any> = []
    let streamlineIntegrator = createStreamlineIntegrator(options.seed, grid, options)


    return {
        run: nextStep
    }

    // Order:
    //   initProcessing()
    //   processQueue()
    function nextStep() {
        while (state !== State.STATE_DONE) {
            for (var i = 0; i < stepsPerIteration; ++i) {
                if (state === State.STATE_INIT) initProcessing()
                else if (state === State.STATE_STREAMLINE) continueStreamline()
                else if (state === State.STATE_PROCESS_QUEUE) processQueue()
                else if (state === State.STATE_SEED_STREAMLINE) seedStreamline()
            }
        }
    }

    function initProcessing() {
        const streamLineCompleted = streamlineIntegrator.next()
        if (streamLineCompleted) {
            addStreamLineToQueue()
            state = State.STATE_PROCESS_QUEUE
        }
    }

    function seedStreamline() {
        const currentStreamLine = finishedStreamlineIntegrators[0]
        const validCandidate = currentStreamLine.getNextValidSeed()
        if (validCandidate) {
            streamlineIntegrator = createStreamlineIntegrator(
                validCandidate,
                grid,
                options
            )
            state = State.STATE_STREAMLINE
        } else {
            finishedStreamlineIntegrators.shift()
            state = State.STATE_PROCESS_QUEUE
        }
    }

    function processQueue() {
        if (finishedStreamlineIntegrators.length === 0) {
            state = State.STATE_DONE
        } else {
            state = State.STATE_SEED_STREAMLINE;
        }
    }

    function continueStreamline() {
        const isDone = streamlineIntegrator.next()
        if (isDone) {
            addStreamLineToQueue()
            state = State.STATE_SEED_STREAMLINE
        }
    }

    function addStreamLineToQueue() {
        var streamLinePoints = streamlineIntegrator.getStreamline()
        if (streamLinePoints.length > 1) {
            finishedStreamlineIntegrators.push(streamlineIntegrator)
            if (options.onStreamlineAdded) {
                options.onStreamlineAdded(streamLinePoints, options)
            }
        }
    }
}

function assertNumber(x: any, msg: string) {
    if (typeof x !== 'number' || Number.isNaN(x)) throw new Error(msg)
}

function normalizeBoundingBox(bbox: BoundingBox) {
    const msg = 'Bounding box {left, top, width, height} is required'
    if (!bbox) throw new Error(msg)

    assertNumber(bbox.left, msg)
    assertNumber(bbox.top, msg)
    if (typeof bbox.size === 'number') {
        bbox.width  = bbox.size
        bbox.height = bbox.size
    }
    assertNumber(bbox.width, msg)
    assertNumber(bbox.height, msg)

    if (bbox.width <= 0 || bbox.height <= 0) throw new Error('Bounding box cannot be empty')
}