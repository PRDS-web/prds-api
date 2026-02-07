import express from 'express';
import { getUserInfo, getAllUsers, updateProfile, updateRole, updateBankDetails,getBankDetails,getBankinghistory } from '../../Controller/UserController.js';
import { verifyToken, verifyAdmin } from '../../Middleware/AuthMiddleware.js';
const UserRoutes = express.Router();

UserRoutes.get('/getUserInfo', verifyToken,getUserInfo);
UserRoutes.get('/getAllUsers', verifyToken,verifyAdmin ,getAllUsers);
UserRoutes.post('/updateProfile',verifyToken, updateProfile);
UserRoutes.put('/updateUserRole',verifyToken, verifyAdmin, updateRole);
UserRoutes.post('/updateBankDetails',verifyToken, updateBankDetails);
UserRoutes.get('/getBankDetails',verifyToken, getBankDetails);
UserRoutes.get('/getBankinghistory',verifyToken, getBankinghistory);
export default UserRoutes;