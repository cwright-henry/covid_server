const Coverage = require('./coverage')

const runAll = async () => {
    return await Coverage.getAll()
}

module.exports = {
    runAll
}