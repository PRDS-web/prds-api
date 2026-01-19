import express from 'express';
import { getUserInfo, getAllUsers, updateProfile, updateRole } from '../../Controller/UserController.js';
import { verifyToken, verifyAdmin } from '../../Middleware/AuthMiddleware.js';
const UserRoutes = express.Router();

UserRoutes.get('/getUserInfo', verifyToken,getUserInfo);
UserRoutes.get('/getAllUsers', verifyToken,verifyAdmin ,getAllUsers);
UserRoutes.post('/updateProfile',verifyToken, updateProfile);
UserRoutes.put('/updateUserRole',verifyToken, verifyAdmin, updateRole);
export default UserRoutes;