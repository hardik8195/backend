import connectDB from "./db/index.js";
import { PORT } from "./constants.js";
import { app } from "./app.js";

const port = PORT || 3000
connectDB()
.then(()=>{
    app.listen(port,()=>{
        console.log("Server is created")
    })
})
.catch((err)=>{
    console.log("Database connection error",err)
})