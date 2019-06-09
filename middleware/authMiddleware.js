const jwt = require('jsonwebtoken')
const User = require('../models/user')

const secretKey = 'secretKey'

exports.verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1]
    if (token === 'null') {
        return res.status(401).send('Unauthorized request')
    }
    let payload = jwt.verify(token, secretKey)
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    req.userId = payload.id
    next()
}

exports.getUserDetails = (req, res, next) => {
    User.findById(req.userId, (err, user) => {
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