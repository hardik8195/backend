import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {

    //get data from frontend:
    const { fullName, username, password, email } = req.body;


    //validation check:
    if (fullName === undefined) throw new ApiError(400, "all fields are required")
    if (username === undefined) throw new ApiError(400, "all fields are required")
    if (password === undefined) throw new ApiError(400, "all fields are required")
    if (email === undefined) throw new ApiError(400, "all fields are required")

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
    if (req.files && Array.isArray(req.files.avatar && req.files.avatar.length > 0)) {
        avatarLocalPath = req.files.avatar[0].path;
    }
    if (req.files && Array.isArray(req.files.coverImage && req.files.coverImage.length > 0)) {
        coverImageLocalPath = req.files.coverImage[0].path;
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
        coverImage: coverImage?.url || ""
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
export { registerUser }