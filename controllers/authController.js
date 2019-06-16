const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const secretKey = 'secretKey'
const saltRounds = 10

exports.getUser = (req, res) => {
    User.findById(req.params.userId, (err, user) => {
        if (err) console.log(err)
        else {
            if (!user.password) {
                res.status(200).json(user)
            } else {
                return res.status(401).send('Unauthorized request')
            }
        }
    })
}

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
                        let payload = { id: user._id, role: user.role, company: user.company }
                        let token = jwt.sign(payload, secretKey)
                        res.status(200).send({ token })
                    }
                });
            }
        }
    })
}

exports.addUser = (req, res) => {
    if (req.user.role === 'admin') {
        User.findOne({ email: req.body.email }, (err, user) => {
            if (err) console.log(err)
            else {
                if (user)
                    res.status(401).send('Email already exists')
                else {
                    let user = new User(req.body)
                    user.save((err, user) => {
                        if (err) console.log(err)
                        else {
                            // TODO: send email
                            res.status(200).send({ userId: user._id })
                        }
                    })
                }
            }
        })
    } else {
        return res.status(401).send('Unauthorized request')
    }
    
}

exports.registerUser = (req, res) => {
    User.findById(req.body._id, (err, user) => {
        if (err) console.log(err)
        else {
            user.password = req.body.password

            bcrypt.hash(user.password, saltRounds, (err, hash) => {
                if (err) console.log(err)
                user.password = hash;

                user.save((err, user) => {
                    if (err) console.log(err)
                    else {
                        let payload = { id: user._id, role: user.role, company: user.company }
                        let token = jwt.sign(payload, secretKey)
                        res.status(200).send({ token })
                    }
                })
            })
        }
    })
    
}