import express from 'express';
const enquiryRoutes = express.Router();
import { userEnquiry } from '../../Controller/EnquiryController';

enquiryRoutes.get('/contact_us',userEnquiry);

export default enquiryRoutes;