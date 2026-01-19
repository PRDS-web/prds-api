import express from 'express';
import { getAllJobs, createNewJob, updateJob, deleteJob} from '../../Controller/JobOpportunityController.js';
import { verifyToken, verifyAdmin } from '../../Middleware/AuthMiddleware.js';
const JobOpportunityRoutes = express.Router();

JobOpportunityRoutes.get('/getAllJobs',getAllJobs);
JobOpportunityRoutes.post('/createNewJob', verifyToken,verifyAdmin ,createNewJob);
JobOpportunityRoutes.put('/updateJob',verifyToken,verifyAdmin, updateJob);
JobOpportunityRoutes.delete('/deleteJob',verifyToken, verifyAdmin, deleteJob);

export default JobOpportunityRoutes;