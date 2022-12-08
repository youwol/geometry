// See also https://github.com/Tom-Alexander/regression-js

export class LinearRegression {
    b = 0
    bIsSet = false

    setB(b: number) {
        this.b = b
        this.bIsSet = true
    }

    run(xValues: number[], yValues: number[]) {
        let sum_x = 0
        let sum_y = 0
        let sum_xy = 0
        let sum_xx = 0
        let sum_yy = 0
        let count = 0
        let x = 0
        let y = 0
        const values_length = xValues.length

        if (values_length != yValues.length) {
            throw new Error(
                'The parameters xValues and yValues need to have same size!',
            )
        }

        if (values_length === 0) {
            return []
        }

        for (let v = 0; v < values_length; v++) {
            x = xValues[v]
            y = yValues[v]
            sum_x += x
            sum_y += y
            sum_xx += x * x
            sum_yy += y * y
            sum_xy += x * y
            count++
        }

        // Calculate m and b for the formula: y = x * m + b
        let m = 0,
            b = 0
        if (this.bIsSet) {
            b = this.b
            m = (sum_y - count) / sum_x
        } else {
            m =
                (count * sum_xy - sum_x * sum_y) /
                (count * sum_xx - sum_x * sum_x)
            b = sum_y / count - (m * sum_x) / count
        }

        const numer = count * sum_xy - sum_x * sum_y
        const denom = Math.sqrt(
            (count * sum_xx - sum_x * sum_x) * (count * sum_yy - sum_y * sum_y),
        )
        return {
            m,
            b,
            r2: Math.pow(numer / denom, 2),
        }
    }
}
