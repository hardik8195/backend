import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateRefreshandAcessToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while Generating access token and refresh token")
    }
}
const registerUser = asyncHandler(async (req, res) => {

    //get data from frontend:
    const { fullName, username, password, email } = req.body;


    //validation check:
    if (fullName === undefined) throw new ApiError(400, "All fields are required")
    if (username === undefined) throw new ApiError(400, "All fields are required")
    if (password === undefined) throw new ApiError(400, "all fields are required")
    if (email === undefined) throw new ApiError(400, "All fields are required")

    //check if user exists:
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) throw new ApiError(409, "User already exists")

    //check for images and avatar:
    // const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;  //gives an undefined error
    let coverImageLocalPath;
    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = req.files.avatar[0].path;
    }
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required")



    // upload on avatar and coverImages on cloudinary on any other third pary services
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) throw new ApiError(400, "avatar is required")

    //create a entry in database 
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        password,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url||""
    })

    //remove password and refreshToken field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    //check for user creation
    if (!createdUser) throw new ApiError(500, "something went wrong")

    //return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "Succesfully user registered")
    )

})

const loginUser = asyncHandler(async (req,res) => {
    //get email or username and password from the user
    //validation check
    //find the user
    //validate password
    //generate accesss token
    //generate refresh token

    const {email,password,username} = req.body;

    if(!email && !username) throw new ApiError(400,"username and email is required")

    const user = await User.findOne({
        $or:[{username,email}]
    })

    if(!user) throw new ApiError(404,"The user do not exist exist")

    const userIsValid=await user.isPasswordCorrect(password)

    if(!userIsValid) throw new ApiError(401,"Password is incorrect")

    const {refreshToken,accessToken}=await generateRefreshandAcessToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:accessToken,refreshToken,loggedInUser
        },"user logged in succesfully")
    ) 
})
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken) throw new ApiError(401,"Unauthorised request");

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = User.findById(decodedToken?._id);
    
        if(!user) throw new ApiError(401,"unvalid refresh token")
    
        if(incomingRefreshToken != user?.refreshToken){
            throw new ApiError(401,"your refresh token got expired")
    
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
        const {accessToken,newrefreshToken}=await generateRefreshandAcessToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                201,
                {
                    accessToken,refreshToken:newrefreshToken
                }
                )
        )
    } catch (error) {
        new ApiError(401,error?.message);
    }
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(201,req.user,"current user successfully fetched")
    )
})
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    if(!fullName || !email) throw new ApiError(401,"All fields are required");
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
            
        },
        {
            new : true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(201,user,"Suceesfully updated your information")
    )
})
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) throw new ApiError(401,"Invalid old Password");

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"password is changed")
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails
}
 
