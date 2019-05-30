const express = require('express')
const mongoose = require('mongoose')
const User = require('./models/user')
const jwt = require('jsonwebtoken')
const secretKey = 'secretKey'

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
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) console.log(err)
        else {
            if (user)
                res.status(400).send('Email already excists')
            else {
                let user = new User(req.body)
                user.save((err, user) => {
                    if (err) console.log(err)
                    else {
                        let payload = { subject: user._id }
                        let token = jwt.sign(payload, secretKey)
                        res.status(200).send({ token })
                    }
                })
            } 
        }
    })
})

app.post('/login', (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) console.log(err)
        else {
            if (!user) 
                res.status(401).send('Invalid Email')
            else
                if (user.password !== req.body.password) 
                    res.status(401).send('Invalid Password')
                else {
                    let payload = { subject: user._id }
                    let token = jwt.sign(payload, secretKey)
                    res.status(200).send({ token })
                }
        }
    })
})

app.listen(port, () => {
    console.log(`Server running on localhost:${port}`)
})