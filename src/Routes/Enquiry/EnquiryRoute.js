import express from 'express';
const enquiryRoutes = express.Router();
import { userEnquiry, getAllEnquiries } from '../../Controller/EnquiryController.js';

enquiryRoutes.post('/contactUs',userEnquiry);
enquiryRoutes.get('/allEnquiries',getAllEnquiries);
export default enquiryRoutes;