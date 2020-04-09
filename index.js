const express = require("express");


const app = express();


const PORT = process.env.PORT || 8000;



//keep the middleware on top
app.use(require('./render_munch_middleware'))


// app.use(require('prerender-node'));


app.listen(PORT, () => console.log('Listening on PORT', PORT))
