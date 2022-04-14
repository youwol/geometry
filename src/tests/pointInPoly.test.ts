import { Serie } from "@youwol/dataframe"
import { pointInPolygon } from "../lib"

test('test pointInPolygon', () => {
    const polygon = Serie.create({array: [1, 1,  1, 2,  2, 2,  2, 1], itemSize: 2})
    expect( pointInPolygon(1.5, 1.5, polygon) ).toBeTruthy()
    expect( pointInPolygon(4.9, 1.2, polygon) ).toBeFalsy()
    expect( pointInPolygon(1.8, 1.1, polygon) ).toBeTruthy()
})
