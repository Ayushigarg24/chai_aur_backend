import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {jwt} from "jsonwebtoken"

const generateAccessAndRefreshTokens =  async(userId) => {
    try{
         await User.findById(userId)
         const accessToken = user.generateAccessToken()
         const refreshToken = user.generateRefreshToken()

         user.refreshToken = refreshToken
         user.save({validateBeforeSave : false}) //here we have used this as mongoose other required field will also trigger so we use validateBeforeSave as False

         return {accessToken, refreshToken}
    }catch(error){
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


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

const existedUser = await User.findOne({
   $or : [{ username }, { email }] 
})
  
if(existedUser){
    throw  new ApiError(409, "username with username or email already exists")
}

// const avatarLocalpath = req.files?.avatar[0]?.path
// const coverImageLocalpath = req.files?.coverImage[0]?.path;

let avatarLocalpath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.avatar.length > 0){
     avatarLocalpath = req.files.avatar[0].path
}

let coverImageLocalpath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
     coverImageLocalpath = req.files.coverImage[0].path
}

if(!avatarLocalpath) {
    throw new ApiError(400, "Avatar file is required")
}

if(!coverImageLocalpath) {
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

const loginUser = asyncHandler(async(req,res) =>{
    //req bode se data
    //username or email 
    //find the user
    //password check
    //access and refresh token generate
    //send cookie 
    //send response

    const {email,username,password} = req.body
    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }

    const user = User.findOne({
        $or : [{username},{email}]
    })

    if(!user){
        throw new ApiError(400,"User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user cresdentials")
    }

    const{accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)
    
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken") //here we are again making database query as earlier User object doesn't have fields updated field which we updated later like refresh token ,we can use also update that field in the same user

    const options = {
        httpOnly :true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user :loggedInUser ,accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{
                refreshToken : undefined
            }
        },
        {
            new :true
        }
     )
   

    const options = {
        httpOnly :true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",accessToken,options)
    .clearCookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,{},"user logged out successfully"))
})

const refreshAccessToken = asyncHandler( async(req,res) => {
        const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

        if(!incomingRefreshToken){
            throw new ApiError(401,"unauthorized request")
        }

        try {
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )

            const user = await User.findById(decodedToken?._id)
            if(!user){
                throw new ApiError(401,"Refresh Token is expired or used")
            }

            const options ={
                httpOnly:true,
                secure:true
            }
            const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
            return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {accessToken,refreshToken : newRefreshToken},

                    "Access Token refreshed"
                )
            )

        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid refresh token")
        }
    })

     const changeCurrentPassword = asyncHandler(async (req,res) => {
        const {oldPassword,newPassword}= req.body
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
        if(!isPasswordCorrect){
            throw new ApiError(400,"invalid old password")
        }
        user.password = newPassword
        await user.save({validateBeforeSave : true})

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "password changed successfully")
        )
     })

     const getCurrentUser = asyncHandler(async (req,res) => {
       return res
              .staus(200)
              .json( new ApiResponse(
                200,req.user,"current user fetched successfully")
              )
     })

     const updateAccountDetail = asyncHandler( async (req,res) => {
        const {fullname,email} = req.body

        if(!fullname || !email){
            throw new ApiError(400,"All fields are required")
        }

        const user = User.findByIdAndUpdate(
            req.user?._id,
            {
                $set : {
                    fullname,
                     email
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Account details updated successfully"))
     })

     const updateUserAvatar = asyncHandler(async (req,res) => {
        const avatarLocalpath = req.file?.path

        if(!avatarLocalpath){
            throw new ApiError(400, "Avatar file is missing")
        }

        const avatar = await uploadOnCloudinary(avatarLocalpath)

        if(!avatar.url){
            throw new ApiError(400, "Error while uploading avatar")
        }

        const user = await user.findByIdAndUpdate(req.user?._id,
            {
                $set :{
                    avatar : avatar.url
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Avatar updated successfully"))
     })

     const updateUserCoverImage = asyncHandler(async (req,res) => {
        const coverImageLocalpath = req.file?.path

        if(!coverImageLocalpath){
            throw new ApiError(400, "Cover Image file is missing")
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalpath)

        if(!coverImage.url){
            throw new ApiError(400, "Error while uploading coverImage")
        }

        const user = await user.findByIdAndUpdate(req.user?._id,
            {
                $set :{
                    coverImage: coverImage.url
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200,user,"CoverImage updated successfully"))
     })


export {
     registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage
}