/**
 * Data preprocessing
 * Tasks:
 *  - Filter duplicates
 *  - Interpolating
 *  - Transform from 200 Hz to 50 Hz
 *  - Enrich data: 
 *     - force magnitude
 *     - moving average
 *     - variance (window, overall)
 */

const parse = require('csv-parse')
const fs = require('fs')

// read stream | reading file
const input = fs.createReadStream('../__DATA__/sensor.tmp')

const output = []
const dt = 20
let step = 1
let curr = []

// csv parser
const parser = parse({
    delimiter: ';',
    from_line: 3
    // columns: true
})

const isEqual = (a, b, eps = 0.001) => {
    return Math.abs(a - b) < eps
}

const interpolate = (values) => {
    const start = values[0]
    const end = values[values.length - 1]
    const inner = values.slice(1, values.length - 1)
    const v = [
        end[0] - start[0],
        end[1] - start[1],
        end[2] - start[2]
    ]
    return inner.map((_, index) => [
        v[0] * ((index + 1) / (inner.length + 1)),
        v[1] * ((index + 1) / (inner.length + 1)),
        v[2] * ((index + 1) / (inner.length + 1))
    ])
}

// combinea
const sensor = input.pipe(parser)

let lineIdx = 0
let fileIdx = 0
sensor.on('data', (data) => {
    const r = data.slice(0, data.length - 1).map(Number)
    if (r[3] < step * dt) {
        if (curr.length > 0) {
            if (!isEqual(curr[curr.length - 1][0], r[0])) {
                curr.push(r)
            }
        } else {
            curr.push(r)
        }
    } else {
        const out = curr.reduce(
            (acc, val) => {
                acc[0] += val[0]
                acc[1] += val[1]
                acc[2] += val[2]
                return acc
            }, [0, 0, 0, 0]
        ).map(e => Math.round(e / curr.length * 1000000) / 1000000)
        curr = []
        out[3] = step * dt
        output[lineIdx] = out
        lineIdx += 1
        step += 1
    }

    if (lineIdx === 1000000) {
        sensor.pause()
        console.log('end')
        const nulls = []
        for (let i = 1; i < output.length; i++) {
            // console.log(output[i][0])
            if (isNaN(output[i][0])) {
                nulls.push(i)
            }
        }

        const pairs = []

        const currentPair = []
        nulls.forEach(n => {
            if (currentPair.length === 0) {
                currentPair[0] = n
                currentPair[1] = n
            } else if (n - currentPair[1] === 1) {
                currentPair[1] = n
            } else {
                pairs.push(currentPair.slice())
                currentPair[0] = n
                currentPair[1] = n
            }
        })

        pairs.forEach(pair => console.log(interpolate([output[pair[0] - 1], ...output.slice(pair[0], pair[1] + 1), output[pair[1] + 1]])))
        // sensor.resume()
        process.exit()
    }
})

sensor.on('end', () => {
    // fs.writeFileSync(`${fileIdx}.csv`, JSON.stringify(output.slice(0, lineIdx), null, 2), { encoding: 'utf-8' })
    console.log('end')
    const nulls = []
    for (let i = 1; i < output.length; i++) {
        // console.log(output[i][0])
        if (isNaN(output[i][0])) {
            nulls.push(i)
        }
    }


})
