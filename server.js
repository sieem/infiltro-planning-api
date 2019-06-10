const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const routes = require('./routes')

const port = process.env.PORT || 3000
const app = express()
const db = "mongodb://infiltro:infiltrologin@localhost:27017/infiltro-planning"

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

app.use(express.static('../infiltro-planning/dist'))

app.listen(port, () => {
    console.log(`Server running on localhost:${port}`)
})