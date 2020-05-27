module.exports = (app, cache) => {

    /**
     * Coverage file used by main app
     */
    app.get('/covid/api/coverage', (req, res) => {
        console.log('ROUTE = /covid/api/coverage')
        const result = cache['coverage'];
        if (result) {
            res.send(result);
        }
        else {
            return res.status(404).send('No Coverage file')
        }
    });

    /**
     * Extra info per country
     */
    app.get('/covid/api/country/:countryCode', (req, res) => {
        const countryCode = req.params.countryCode;
        const result = cache[countryCode];
        if (result) {
            res.send(result);
        }
        else {
            return res.status(404).send(`No Extra info for ${countryCode}`)
        }
    });
}