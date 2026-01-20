import express from 'express';
import { registerUser, verifyUser, loginUser, logoutUser, SSOSignin, forgotPassword, resetPassword } from '../../Controller/AuthController.js';

const router = express.Router();


router.post("/register",registerUser);
router.get('/verify',verifyUser);
router.post('/login',loginUser);
router.get('/logout',logoutUser);
router.get('/sso',SSOSignin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;