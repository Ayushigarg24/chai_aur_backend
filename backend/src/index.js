// require('dotenv').config({path:'./env'}) more improved version of this code is
import dotenv from "dotenv"

import connectDB from "./db/index.js"
import app from "./app.js"
// function connectDB(){} this is not good way ....better is to use iife and in iife we put semicolon in first just for cleaning purpose
// ;(async()=>{})()

    dotenv.config({
        path:'./.env'
    })
    connectDB()
    .then(()=>{
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
           })
    })
    .catch((err)=>{
        console.log("MongoDB connection failed : ",err);
    })
  
   









    //writting database connection code in index.js is not good approach as it will pollute index.js
// import express from "express"
// const app = express()
    
// ;(async()=>{
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error",(error)=>{
//         console.log("Error :",error);
//         throw error
//        })
//        app.listen(process.env.PORT,()=>{
//         console.log(`App is listening on port ${process.env.PORT}`)
//        })
//     }catch (error){
//         console.error("ERROR:",error)
//     }
// })()
