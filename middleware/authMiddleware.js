const jwt = require('jsonwebtoken')
const User = require('../models/user')

const secretKey = 'secretKey'

exports.verifyToken = (req, res, next) => {
    if (!req.cookies.token) {
        return res.status(401).send('Unauthorized request')
    }
    let token = req.cookies.token
    if (token === 'null') {
        return res.status(401).send('Unauthorized request')
    }
    let payload = jwt.verify(token, secretKey)
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    req.userId = payload.subject
    next()
}

exports.getUserDetails = (req, res, next) => {
    User.findOne({ _id: req.userId }, (err, user) => {
        if (err) console.log(err)
        else {
            if (!user)
                res.status(401).send('User not found')
            else {
                user.password = ""
                req.user = user
                next()
            }
        }
    })
}