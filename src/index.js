import connectDB from "./db/index.js";
import { app } from "./app.js";
import dotenv from 'dotenv'

dotenv.config({
    path:'.env'
})
const port =  process.env.PORT || 3000
connectDB()
.then(()=>{
    app.listen(port,()=>{
        console.log("Server is created")
    })
})
.catch((err)=>{
    console.log("Database connection error",err)
})