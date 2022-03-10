/**
Use the normal to the fitting plane to triangulate in 2D

```ts
const io   = require('@youwol/io')
const df   = require('@youwol/dataframe')
const geom = require('@youwol/geometry')
const fs   = require('fs')

const points  = df.createSerie({data: [x,y,z...], itemSize: 3})
const plane   = geom.fittingPlane(points)
const surface = geom.triangulate( points, plane.normal )

console.log( df.info(surface) )
console.log( "  - nb vertices:", surface.get('positions').count )
console.log( "  - nb faces   :", surface.get('indices').count )

const buffer  = io.encodeGocadTS( surface )
fs.writeFile('output.gcd', buffer, 'utf8', err => {})
```
*/
export namespace Example_2 {}
