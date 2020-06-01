const express = require('express')
const multer = require('multer')
const upload = multer()

const router = express.Router()

const projectController = require('./controllers/projectController')
const authController = require('./controllers/authController')
const companiesController = require('./controllers/companiesController')
const mailController = require('./controllers/mailController')
const commentController = require('./controllers/commentController')
const archiveController = require('./controllers/archiveController')

const authMiddleware = require('./middleware/authMiddleware')

router.post('/add-user', upload.none(), authMiddleware.verifyToken, authMiddleware.getUserDetails, authController.addUser)
router.post('/register', upload.none(), authController.registerUser)
router.post('/login', upload.none(), authController.loginUser)
router.get('/get-users', authMiddleware.verifyToken, authMiddleware.getUserDetails, authController.getUsers)
router.get('/get-user/:userId', authController.getUser)
router.get('/get-user-by-resettoken/:resetToken', authController.getUserByResetToken)
router.post('/reset-password', upload.none(), authController.resetPassword)
router.post('/edit-user', upload.none(), authMiddleware.verifyToken, authMiddleware.getUserDetails, authController.editUser)
router.delete('/remove-user/:userId', authMiddleware.verifyToken, authMiddleware.getUserDetails, authController.removeUser)

router.get('/generate-project-id', authMiddleware.verifyToken, projectController.generateProjectId)
router.get('/get-projects', authMiddleware.verifyToken, authMiddleware.getUserDetails, projectController.getProjects)
router.get('/get-project/:projectId', authMiddleware.verifyToken, authMiddleware.getUserDetails, projectController.getProject)
router.post('/save-project', upload.none(), authMiddleware.verifyToken, authMiddleware.getUserDetails, projectController.saveProject)
router.delete('/remove-project/:projectId', authMiddleware.verifyToken, authMiddleware.getUserDetails, projectController.removeProject)
router.post('/duplicate-project/', upload.none(), authMiddleware.verifyToken, authMiddleware.getUserDetails, projectController.duplicateProject)
router.post('/batch-projects', upload.none(), authMiddleware.verifyToken, authMiddleware.getUserDetails, projectController.batchProjects)
router.post('/send-project-mail', upload.none(), authMiddleware.verifyToken, authMiddleware.getUserDetails, mailController.sendProjectMail)

router.get('/get-comments/:projectId', authMiddleware.verifyToken, authMiddleware.getUserDetails, commentController.getComments)
router.post('/save-comment/:projectId', upload.none(), authMiddleware.verifyToken, authMiddleware.getUserDetails, commentController.saveComment)
router.delete('/remove-comment/:projectId/:commentId', authMiddleware.verifyToken, authMiddleware.getUserDetails, commentController.removeComment)

router.get('/get-archive/:projectId', authMiddleware.verifyToken, authMiddleware.getUserDetails, archiveController.getProjectArchive)

router.get('/get-companies', authMiddleware.verifyToken, authMiddleware.getUserDetails, companiesController.getCompanies)
router.post('/save-company', upload.none(), authMiddleware.verifyToken, authMiddleware.getUserDetails, companiesController.saveCompany)
router.delete('/remove-company/:companyId', authMiddleware.verifyToken, authMiddleware.getUserDetails, companiesController.removeCompany)

module.exports = router;