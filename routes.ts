import express from 'express';
import multer from 'multer';
import { generateProjectId, getProjects, getProject, saveProject, removeProject, duplicateProject, batchProjects } from './controllers/projectController';
import { addUser, editUser, getUserByResetToken, registerUser, loginUser, getUser, resetPassword, removeUser, getUsers } from './controllers/authController';
import { getCompanies, saveCompany, removeCompany } from './controllers/companiesController';
import { sendProjectMail, getMailTemplates, saveMailTemplate, removeMailTemplate } from './controllers/mailController';
import { getComments, saveComment, removeComment } from './controllers/commentController';
import { getProjectArchive } from './controllers/archiveController';
import { verifyToken, getUserDetails } from './middleware/authMiddleware';

const upload = multer()
const router = express.Router()

router.post('/add-user', upload.none(), verifyToken, getUserDetails, addUser);
router.post('/register', upload.none(), registerUser);
router.post('/login', upload.none(), loginUser);
router.get('/get-users', verifyToken, getUserDetails, getUsers);
router.get('/get-user/:userId', getUser);
router.get('/get-user-by-resettoken/:resetToken', getUserByResetToken);
router.post('/reset-password', upload.none(), resetPassword);
router.post('/edit-user', upload.none(), verifyToken, getUserDetails, editUser);
router.delete('/remove-user/:userId', verifyToken, getUserDetails, removeUser);

router.get('/generate-project-id', verifyToken, generateProjectId);
router.get('/get-projects', verifyToken, getUserDetails, getProjects);
router.get('/get-project/:projectId', verifyToken, getUserDetails, getProject);
router.post('/save-project', upload.none(), verifyToken, getUserDetails, saveProject);
router.delete('/remove-project/:projectId', verifyToken, getUserDetails, removeProject);
router.post('/duplicate-project/', upload.none(), verifyToken, getUserDetails, duplicateProject);
router.post('/batch-projects', upload.none(), verifyToken, getUserDetails, batchProjects);
router.post('/send-project-mail', upload.none(), verifyToken, getUserDetails, sendProjectMail);
router.get('/get-mail-templates', verifyToken, getUserDetails, getMailTemplates);
router.post('/save-mail-template', upload.none(), verifyToken, getUserDetails, saveMailTemplate);
router.delete('/remove-mail-template/:templateId', upload.none(), verifyToken, getUserDetails, removeMailTemplate);

router.get('/get-comments/:projectId', verifyToken, getUserDetails, getComments);
router.post('/save-comment/:projectId', upload.none(), verifyToken, getUserDetails, saveComment);
router.delete('/remove-comment/:projectId/:commentId', verifyToken, getUserDetails, removeComment);

router.get('/get-archive/:projectId', verifyToken, getUserDetails, getProjectArchive);

router.get('/get-companies', verifyToken, getUserDetails, getCompanies);
router.post('/save-company', upload.none(), verifyToken, getUserDetails, saveCompany);
router.delete('/remove-company/:companyId', verifyToken, getUserDetails, removeCompany);

export { router };
