const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const routes = require('./routes')

const port = process.env.PORT || 3000
const app = express()
const db = "mongodb://infiltro:infiltrologin@localhost:27017/infiltro-planning"

// app.use(express.json())
app.use(cors())

mongoose.connect(db, { useNewUrlParser: true }, err => {
    if (err) console.log(err)
    else {
        console.log('connected to mongodb')
    }
})

app.use('/api', routes);

app.listen(port, () => {
    console.log(`Server running on localhost:${port}`)
})