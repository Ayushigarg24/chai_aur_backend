import mongoose, { isValidObjectId } from "mongoose"
 import {Tweet} from "../models/tweet.models.js"
 import {User} from "../models/user.models.js"
 import {ApiError} from "../utils/ApiError.js"
 import {ApiResponse} from "../utils/ApiResponse.js"
 import {asyncHandler} from "../utils/asyncHandler.js"
 
 const createTweet = asyncHandler(async (req, res) => {
     //TODO: create tweet
     const {content} = req.body;
     const userId = req.user._id;

     if(!userId || !isValidObjectId(userId)){
        throw new ApiError(404,"userId not found")
     }
     if(!content || content.trim() === ""){
        throw new ApiError(404,"content is required")
     }

     const user = await User.findById(userId)

     if(!user){
        throw new ApiError(404,"user not found")
     }
    
     const tweet = await Tweet.create({
        owner : userId,
        content
     })

     if(!tweet){
        throw new ApiError(500,"Failed to create a tweet")
     }

     return res
     .status(200)
     .json(new ApiResponse(200,tweet,"tweet created successfully"))
          
 })
 
 const getUserTweets = asyncHandler(async (req, res) => {
     // TODO: get user tweets
     const userId = req.user._id

     if(!userId || !isValidObjectId(userId)){
        throw new ApiError("invalid userId ")
     }

     const alltweets = await Tweet.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "allTweets"
            }
        },
        {
            $unwind : allTweets
        },
        {
            $project : {
                _id : 1,
                content : 1,
                "allTweets.username" : 1,
                "allTweets.email" : 1,
            }
        }
     ])

     if(!alltweets || alltweets.length === 0){
        throw new ApiError(404, "no tweets found for this user")
     }

     return res
            .status(200)
            .json(new ApiResponse(200,allTweets,"tweets fetched successfully"))
 })
 
 const updateTweet = asyncHandler(async (req, res) => {
     //TODO: update tweet
     const {updatedContent} = req.body;
     const tweetId = req.params;

     if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id")
     }

     if(!updatedContent || updatedContent.trim() === ""){
        throw new ApiError(400,"updated content needed")
     }

     const updatedTweet = await  Tweet.findByIdAndUpdate(
        tweetId,
    {
        content : updatedContent
    },
{
    new : true
})
     if(!updatedTweet){
        throw new ApiError(500,"tweet not updated !!")
     }

     return res.status(200)
            .json(
                new ApiResponse(200,updatedTweet,"tweet updated successfully")
            )
 })
 
 const deleteTweet = asyncHandler(async (req, res) => {
     //TODO: delete tweet
     const tweetId = req.params;
     
     if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(404,"tweetId invalid")
     }
     
     const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

     if(!deletedTweet){
        throw new ApiError(500,"error while deleting tweet")
     }

     return res
            .status(200)
            .json(new ApiResponse(200,deletedTweet,"tweet deleted successfully"))
 })
 
 export {
     createTweet,
     getUserTweets,
     updateTweet,
     deleteTweet
 }