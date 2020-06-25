const jwt = require('jsonwebtoken')
const User = require('../models/user')

const secretKey = process.env.SECRET_KEY

exports.verifyToken = (req, res, next) => {
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1]
    if (token === 'null') {
        return res.status(401).send('Unauthorized request')
    }

    let payload = {};
    try {
        payload = jwt.verify(token, secretKey)
        
    } catch (error) {
        return res.status(401).send('Invalid Signature');
    }

    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }

    req.userId = payload.id
    next()
}

exports.getUserDetails = (req, res, next) => {
    User.findById(req.userId, (err, user) => {
        if (err) {
            return res.status(400).json(err.message)
        }

        if (!user) {
            return res.status(401).send('User not found')
        }

        user.password = ""
        req.user = user
        next()
    })
}