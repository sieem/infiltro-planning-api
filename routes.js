const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')

const planningController = require('./controllers/planningController')
const authController = require('./controllers/authController')

function verifyToken(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request')
    }
    let token = req.headers.authorization.split(' ')[1]
    if (token === 'null') {
        return res.status(401).send('Unauthorized request')
    }
    let payload = jwt.verify(token, 'secretKey')
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    req.userId = payload.subject
    next()
}

router.post('/register', authController.registerUser)

router.post('/login', authController.loginUser)

router.get('/planning-data', verifyToken, planningController.getPlanningData)

module.exports = router;