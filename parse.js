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
 * 
 * TODOs:
 *   - Filter duplicates! (first step)
 */

const parse = require('csv-parse')
const fs = require('fs')

const get = (inputFilePath) => new Promise((resolve, reject) => {
    // read stream | reading file
    const input = fs.createReadStream(inputFilePath)
    
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
    
    const interpolate = (from, to, steps) => {
        const v = [
            to[0] - from[0],
            to[1] - from[1],
            to[2] - from[2],
            to[3] - from[3]
        ]
    
        const values = []
    
        for (let i = 0; i < steps; i++) {
            values.push([
                from[0] + (v[0] * ((i + 1) / (steps + 1))),
                from[1] + (v[1] * ((i + 1) / (steps + 1))),
                from[2] + (v[2] * ((i + 1) / (steps + 1))),
                from[3] + (v[3] * ((i + 1) / (steps + 1)))
            ])
        }
    
        return values
    }
    
    // combinea
    const sensor = input.pipe(parser)
    
    const isEqualSample = (s1, s2) => {
        return s1.slice(0, 3).every((_, i) => s2 && isEqual(s1[i], s2[i]))
    }
    
    const samples = []
    
    let processed = 0
    const empties = []
    const maxima = [0, 0, 0, 0]
    const transform = samples => {
        const output = []
        let temp = []
        let index = 1
        samples.forEach(sample => {
            if (sample[3] < index * dt) {
                temp.push(sample)
            } else {
                const next = temp.reduce(
                    (acc, val) => {
                        return [
                            acc[0] + val[0],
                            acc[1] + val[1],
                            acc[2] + val[2],
                            acc[3] + Math.sqrt(val[0] * val[0] + val[1] * val[1] + val[2] * val[2])
                        ]
                    }, [0, 0, 0, 0]
                ).map(e => e / temp.length)
    
                // add to histogram
    
                next.forEach((p, i) => {
                    if (Math.abs(p) > maxima[i]) {
                        maxima[i] = Math.abs(p)
                    }
                })
                next[4] = index * dt
                output.push(next)
                index += 1
    
                while (index * dt < sample[3]) {
                    output.push([null, null, null, null, index * dt])
                    empties.push(index)
                    index += 1
                }
    
                temp = [sample]
            }
        })
    
        return output
    }
    
    const empty = (transformed) => {
        const reduced = empties.reduce(
            (acc, val) => {
                if (val - acc.aux[acc.aux.length - 1] === 1) {
                    acc.aux.push(val)
                } else {
                    acc.values.push(acc.aux)
                    acc.aux = [val]
                }
                return acc
            }, {
            aux: [],
            values: []
        }
        )
    
        return {
            indices: reduced.values.slice(1).map(v => v.map(e => e - 1)),
            interpolated: reduced.values.slice(1).map(
                v => interpolate(transformed[v[0] - 2], transformed[v[v.length - 1]], v.length)
            )
        }
    }
    
    sensor.on('data', data => {
        const sample = data.slice(0, data.length - 1).map(Number)
        if (!isEqualSample(sample, samples[samples.length - 1])) {
            samples.push(sample)
        }
    })
    
    sensor.on('end', data => {
        const transformed = transform(samples)
        const { indices, interpolated } = empty(transformed)
        indices.forEach((indexPairs, i) => {
            indexPairs.forEach((index, j) => {
                transformed[index] = interpolated[i][j]
                transformed[index][4] = (index + 1) * dt
            })
        })

        resolve(transformed.map(t => t.slice(0, 4)).filter(t => t[0] !== null && t[0] !== undefined))
    }) 
})

module.exports = (inputFilePaths) => Promise.all(inputFilePaths.map(path => get(path)))