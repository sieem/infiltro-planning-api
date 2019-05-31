const express = require('express')
const multer = require('multer')
const upload = multer()

const router = express.Router()

const planningController = require('./controllers/planningController')
const authController = require('./controllers/authController')

const authMiddleware = require('./middleware/authMiddleware')

router.post('/register', upload.none(), authController.registerUser)

router.post('/login', upload.none(), authController.loginUser)

router.get('/planning-data', authMiddleware.verifyToken, planningController.getPlanningData)

module.exports = router;