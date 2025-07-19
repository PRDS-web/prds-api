import express from 'express';
import { getUserInfo, getAllUsers, updateProfile } from '../../Controller/UserController.js';
import { verifyToken, verifyAdmin } from '../../Middleware/AuthMiddleware.js';
const UserRoutes = express.Router();

UserRoutes.get('/getUserInfo', verifyToken,getUserInfo);
UserRoutes.post('/getAllUsers', verifyToken,verifyAdmin ,getAllUsers);
UserRoutes.post('/updateProfile',verifyToken, updateProfile);
export default UserRoutes;