const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secretKey = 'secretKey'
const saltRounds = 10

exports.loginUser = (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) console.log(err)
        else {
            if (!user)
                res.status(401).send('Invalid Email')
            else {
                bcrypt.compare(req.body.password, user.password, (err, compareValid) => {
                    if (err) console.log(err)
                    else if (!compareValid) {
                        res.status(401).send('Invalid Password')
                    } else {
                        let payload = { subject: user._id }
                        let token = jwt.sign(payload, secretKey)
                        res.status(200).send({ token })
                    }
                });
            }
        }
    })
}

exports.registerUser = (req, res) => {
    User.findOne({ email: req.body.email }, (err, user) => {
        if (err) console.log(err)
        else {
            if (user)
                res.status(401).send('Email already exists')
            else {
                let user = new User(req.body)
                bcrypt.hash(user.password, saltRounds, (err, hash) => {
                    if (err) console.log(err)
                    user.password = hash;

                    user.save((err, user) => {
                        if (err) console.log(err)
                        else {
                            let payload = { subject: user._id }
                            let token = jwt.sign(payload, secretKey)
                            res.status(200).send({ token })
                        }
                    })
                })
            }
        }
    })
}

exports.getUserDetails = (req, res) => {
    res.status(200).json(req.user)
}