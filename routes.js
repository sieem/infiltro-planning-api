const express = require('express')
const multer = require('multer')
const upload = multer()

const router = express.Router()

const projectController = require('./controllers/projectController')
const authController = require('./controllers/authController')
const companiesController = require('./controllers/companiesController')

const authMiddleware = require('./middleware/authMiddleware')

router.post('/add-user', authMiddleware.verifyToken, authMiddleware.getUserDetails, upload.none(), authController.addUser)
router.post('/register', upload.none(), authController.registerUser)
router.post('/login', upload.none(), authController.loginUser)
router.get('/get-user/:userId', authController.getUser)
// router.get('/logout', authController.logoutUser)
// router.get('/get-user-details', authMiddleware.verifyToken, authMiddleware.getUserDetails, authController.getUserDetails)

router.get('/get-projects', authMiddleware.verifyToken, authMiddleware.getUserDetails, projectController.getProjects)
router.get('/get-project/:projectId', authMiddleware.verifyToken, authMiddleware.getUserDetails, projectController.getProject)
router.post('/save-project', authMiddleware.verifyToken, authMiddleware.getUserDetails, upload.none(), projectController.saveProject)

router.get('/get-companies', companiesController.getCompanies)
router.post('/save-company', upload.none(), companiesController.saveCompany)
router.post('/remove-company', upload.none(), companiesController.removeCompany)

module.exports = router;