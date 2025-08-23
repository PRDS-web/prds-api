import express from 'express';
const enquiryRoutes = express.Router();
import { userEnquiry } from '../../Controller/EnquiryController.js';

enquiryRoutes.post('/contactUs',userEnquiry);

export default enquiryRoutes;