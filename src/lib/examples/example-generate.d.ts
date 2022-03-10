/**
Generate a rectangular triangulated surface

```ts
const geom = require('@youwol/geometry')

const surface = geom.generateRectangle({
    a: 10,
    b: 20,
    na: 10,
    nb: 10
})

console.log( "  - nb vertices:", surface.get('positions').count )
console.log( "  - nb faces   :", surface.get('indices').count )
```

Generate an elliptical triangulated surface
```ts
const geom = require('@youwol/geometry')

const surface = geom.generateEllipse({
    a: 20, 
    b: 10, 
    nbRings: 4, 
    density: 8, 
    center=[-10, -10, 2]
})

console.log( "  - nb vertices:", surface.get('positions').count )
console.log( "  - nb faces   :", surface.get('indices').count )
```
*/
export namespace Example_1 {}
