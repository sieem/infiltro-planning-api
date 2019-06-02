const express = require('express')
const multer = require('multer')
const upload = multer()

const router = express.Router()

const planningController = require('./controllers/planningController')
const authController = require('./controllers/authController')
const companiesController = require('./controllers/companiesController')

const authMiddleware = require('./middleware/authMiddleware')

router.post('/register', upload.none(), authController.registerUser)
router.post('/login', upload.none(), authController.loginUser)
router.get('/get-user-details', authMiddleware.verifyToken, authMiddleware.getUserDetails, authController.getUserDetails)

router.get('/planning-data', authMiddleware.verifyToken, planningController.getPlanningData)

router.get('/get-companies', companiesController.getCompanies)
router.post('/save-company', upload.none(), companiesController.saveCompany)
router.post('/remove-company', upload.none(), companiesController.removeCompany)

module.exports = router;