import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
const registerUser = asyncHandler(async (req,res) => {
    
    //get data from frontend
    const {fullName,userName,Password,email} = req.body;
    
    //validation check
    if(fullName==="") throw new ApiError(400,"all fields are required")
    if(userName==="") throw new ApiError(400,"all fields are required")
    if(Password==="") throw new ApiError(400,"all fields are required")
    if(email==="") throw new ApiError(400,"all fields are required")
    
    //check if user exists
    const existedUser = User.findOne({
        $or:[{userName},{email}]
    })

    if(existedUser) throw new ApiError(409,"User already exists")

    //check for images and avatar
    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) throw ApiError(400,"Avatar is required")
    

  
})
export {registerUser}