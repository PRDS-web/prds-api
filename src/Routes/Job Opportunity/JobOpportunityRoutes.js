import express from 'express';
import { getAllJobs, createNewJob, updateJob, deleteJob, applyJob, appliedJob} from '../../Controller/JobOpportunityController.js';
import { verifyToken, verifyAdmin } from '../../Middleware/AuthMiddleware.js';
const JobOpportunityRoutes = express.Router();

JobOpportunityRoutes.get('/getAllJobs',getAllJobs);
JobOpportunityRoutes.post('/createNewJob', verifyToken,verifyAdmin ,createNewJob);
JobOpportunityRoutes.put('/updateJob',verifyToken,verifyAdmin, updateJob);
JobOpportunityRoutes.delete('/deleteJob',verifyToken, verifyAdmin, deleteJob);
JobOpportunityRoutes.post('/applyJob', verifyToken,applyJob);
JobOpportunityRoutes.get('/getAppliedJobs', verifyToken,appliedJob);

export default JobOpportunityRoutes;