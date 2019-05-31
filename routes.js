const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')

const planningController = require('./controllers/planningController')
const authController = require('./controllers/authController')

const authMiddleware = require('./middleware/authMiddleware')

router.post('/register', authController.registerUser)

router.post('/login', authController.loginUser)

router.get('/planning-data', authMiddleware.verifyToken, planningController.getPlanningData)

module.exports = router;