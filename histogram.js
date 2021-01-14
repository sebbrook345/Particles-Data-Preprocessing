// const fs = require('fs')

// const getIO = () => {
//     const inputIdx = process.argv.indexOf('--input')
//     const outputIdx = process.argv.indexOf('--output')

//     return {
//         inputFilePath: process.argv[inputIdx + 1],
//         outputFilePath: process.argv[outputIdx + 1]
//     }
// }

// // read dataset
// const dataset = JSON.parse(fs.readFileSync(getIO().inputFilePath, { encoding: 'utf-8' }))

// const hist = Object.entries(dataset.reduce(
//     (histogram, sample) => {
//         // use magnitude (force mag == sample[3])
//         if (sample[3]) {
//             const mag = sample[3].toFixed(2)
//             if (!histogram[mag]) {
//                 histogram[mag] = 0
//             }
//             histogram[mag] += 1
//         }

//         return histogram
//     }, {}
// )).sort((a, b) => Number(a[0]) - Number(b[0]))

const quantile = (histogram, size, q) => {
    const threshold = Math.floor(size * q)
    const result = []
    let processed = 0
    histogram.forEach(entry => {
        if (processed + entry[1] < threshold) {
            result.push(entry)
        }
        processed += entry[1]
    })
    return result
}

const hist = (dataset) => Object.entries(dataset.reduce(
    (histogram, sample) => {
        // use magnitude (force mag == sample[3])
        if (sample[3]) {
            const mag = sample[3].toFixed(2)
            if (!histogram[mag]) {
                histogram[mag] = 0
            }
            histogram[mag] += 1
        }

        return histogram
    }, {}
)).sort((a, b) => Number(a[0]) - Number(b[0]))

module.exports = {
    hist,
    quantile
}