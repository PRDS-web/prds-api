import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const ConnectWithDB =() =>{
    mongoose.connect(process.env.DB_CONNECTION_URL)
    .then(()=>{
        console.log("We are able to connect with database");
    }).catch((error)=>{
        console.log("There is something went wrong please check => ",error);
    })
}

export default ConnectWithDB;