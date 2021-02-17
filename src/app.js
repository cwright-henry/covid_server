const express = require('express');
const helmet = require("helmet");

/**
 * Lets get ready to rumble!
 */
const PORT = 3000;
const app = express()
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.disable('x-powered-by');

// Routes
require('./routes')(app)

// Jobs
require('./jobs')

/**
 * Start Application
 */
app.listen(PORT, () => {
	console.log(`Server listening on ${PORT}`)
});