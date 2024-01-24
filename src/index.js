import connectDB from "./db/index.js";
import { app } from "./app.js";
import dotenv from 'dotenv'

dotenv.config({
    path:'./.env'
})
const port =  process.env.PORT
connectDB()
.then(()=>{
    app.listen(port,()=>{
        console.log(`Server is created ${port}`)
    })
})
.catch((err)=>{
    console.log('Database connection error',err)
})
