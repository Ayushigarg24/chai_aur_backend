import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandler( async(req,res)=>{
   //get user details from frontend
   //validation - not empty
   //check if user already exist: username ans email
   // check for images and avatar
   //if available then upload on cloudinary
   //check on cloudinary
   //create user object - create entry in db
   //remove password and refresh token field from response
   //check for user creation
   //return response otherwise error


   const {fullname,email,username,password}=req.body
   console.log ("email :", email);

   if( [fullname,email,username,password].some((field) => 
    field?.trim() === "")
){
    throw new ApiError(400,"All fields ate required")
}

const existedUser = User.findOne({
   $or : [{ username }, { email }] 
})
  
if(existedUser){
    throw  new ApiError(409, "username with username or email already exists")
}

const avatarLocalpath = req.files?.avatar[0]?.path
const coverImageLocalpath = req.files?.avatar[0]?.path;

if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
}

if(!coverImageLocalPath) {
    throw new ApiError(400, "Avatar file is required")
}

const avatar = await uploadOnCloudinary(avatarLocalpath)
const coverImage = await uploadOnCloudinary(coverImageLocalpath)


if(!avatar){
    throw new ApiError(400, "Avatar file is required")
}

if(!coverImage){
    throw new ApiError(400, "Avatar file is required")
}

const user = await User.create({
    fullname,
    avatar : avatar.url,
    coverImage :coverImage.url || "",
    email,
    password,
    username: username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
}
 
return res.status(201).json(
    new ApiResponse(200,createdUser,"user registered successfully")
)


}
)

export { registerUser}