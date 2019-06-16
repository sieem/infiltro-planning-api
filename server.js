require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const cookieParser = require('cookie-parser')
const routes = require('./routes')

const port = process.env.PORT || 3000
const app = express()
const db = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@localhost:27017/${process.env.MONGODB_DB}`
const staticRoot = '../infiltro-planning/dist/'

app.use(express.json())
app.use(cors())
app.use(cookieParser())

mongoose.connect(db, { useNewUrlParser: true }, err => {
    if (err) console.log(err)
    else {
        console.log('connected to mongodb')
    }
})

app.use('/api', routes);

app.use(function (req, res, next) {
    //if the request is not html then move along
    var accept = req.accepts('html', 'json', 'xml');
    if (accept !== 'html') {
        return next();
    }

    // if the request has a '.' assume that it's for a file, move along
    var ext = path.extname(req.path);
    if (ext !== '') {
        return next();
    }

    fs.createReadStream(staticRoot + 'index.html').pipe(res);

});

app.use(express.static(staticRoot));

app.listen(port, () => {
    console.log(`Server running on localhost:${port}`)
})