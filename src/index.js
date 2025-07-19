import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ConnectWithDB from './Utils/DBConnection.js';
import AuthRoutes from './Routes/Auth/AuthRoutes.js';
import UserRoutes from './Routes/User/UserRoutes.js';

const app = express();
const port  = 8080;


app.use(cors({
    origin: "http://localhost:3000",
    credentials: "true",
    methods: ['GET','POST','PATCH','PUT'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));

ConnectWithDB();

app.get('/',(req, res) =>{
    res.send("I am very happy today");
});

app.use('/api/v1/auth',AuthRoutes);
app.use('/api/v1/user',UserRoutes);

app.listen(port,()=>{
    console.log("Initial Setup is done good to go now");
})