const geom = require('../dist/@youwol/geometry')

const i = geom.intersectTriangle({
    ray: {
        origin: [0.1, 0, -10],
        direction: [0, 0, 1],
    },
    p1: [0, 0, -3],
    p2: [1, 0, -2],
    p3: [1, 1, 0],
})

console.log(i)
