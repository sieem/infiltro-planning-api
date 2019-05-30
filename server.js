const express = require('express')
const mongoose = require('mongoose')


const port = process.env.PORT || 3000
const app = express()
const db = "mongodb://infiltro:infiltrologin@localhost:27017/infiltro-planning"

app.use(express.json())


mongoose.connect(db, { useNewUrlParser: true }, err => {
    if (err) console.log(err)
    else {
        console.log('connected to mongodb')
    }
})


app.get('/', (req,res) => {
    res.send('Hello from server')
})

app.post('/register', (req, res) => {
    let userData = req.body
    console.log(userData)

})

app.listen(port, () => {
    console.log(`Server running on localhost:${port}`)
})