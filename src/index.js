import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ConnectWithDB from './Utils/DBConnection.js';
import AuthRoutes from './Routes/Auth/AuthRoutes.js';
import UserRoutes from './Routes/User/UserRoutes.js';
import EnquiryRoutes from './Routes/Enquiry/EnquiryRoute.js';

const app = express();
const port  = 8080;


app.use(cors({
    origin: ["http://localhost:5173", "https://prds-ui.vercel.app", "https://pradetra.com","https://www.pradetra.com"],
    credentials: true,
    methods: ['GET','POST','PATCH','PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options("*", cors());

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

ConnectWithDB();

app.get('/',(req, res) =>{
    res.send("I am very happy today");
});

app.use('/api/v1/auth',AuthRoutes);
app.use('/api/v1/user',UserRoutes);
app.use('api/v1/enquiry', EnquiryRoutes);

app.listen(port,()=>{
    console.log("Initial Setup is done good to go now");
})