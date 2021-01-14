const fs = require('fs')
const parse = require('./parse.js')
const { hist, quantile } = require('./histogram.js')

const getInputs = (str) => {
    if (str.includes('[') && str.includes(']')) {
        return str.replace('[', '').replace(']', '').split(',').map(s => s.trim())
    }
    else {
        return [str]
    }
}

const getIO = () => {
    const inputIdx = process.argv.indexOf('--input')
    const outputIdx = process.argv.indexOf('--output')
    const quantilesIdx = process.argv.indexOf('--quantiles')

    return {
        input: getInputs(process.argv[inputIdx + 1]),
        output: process.argv[outputIdx + 1],
        quantiles: getInputs(process.argv[quantilesIdx + 1])
    }
}

const run = async () => {
    const datasets = await parse(getIO().input)
    const data = datasets.flat(1)
    const histogram = hist(data.map(sample => sample.slice(0, 4)))

    const quantiles = getIO().quantiles.map(q => {
        return quantile(histogram, data.length, Number(q))
    })
    
    const meta = {
        sampleSize: data.length
    }
    
    try {
        fs.mkdirSync(getIO().outputFilePath)
    } catch (e) {}

    fs.writeFileSync(`${getIO().output}/historgram.json`, JSON.stringify(histogram, null, 2))
    quantiles.forEach((q, i) => {
        fs.writeFileSync(`${getIO().output}/quantile${getIO().quantiles[i]}.json`, JSON.stringify(q, null, 2))
    })
    fs.writeFileSync(`${getIO().output}/samples.json`, JSON.stringify(data, null, 2))
    fs.writeFileSync(`${getIO().output}/meta.json`, JSON.stringify(meta, null, 2))
}

run()
