import mongoose, {isValidObjectId} from "mongoose"
 import {Like} from "../models/like.models.js"
 import {ApiError} from "../utils/ApiError.js"
 import {ApiResponse} from "../utils/ApiResponse.js"
 import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.models.js"
import { Video } from "../models/video.models.js"
 
 const toggleVideoLike = asyncHandler(async (req, res) => {
     const {videoId} = req.params
     //TODO: toggle like on video
     if(!videoId || isValidObjectId(videoId)){
             throw new ApiError(404,"invalid vedio id")
         }
    const videoLike = await Like.aggregate([
        {
         $match :{
            video : new mongoose.Types.ObjectId(videoId)
         }
        },
        {
            $lookup : {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "isLiked"
            }
        },
        {
            $addFields : {
                likeToggle : {
                    $cond : {
                        if: {
                            $in: [req.user._id, "$isLiked.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                likeToggle: 1,
                email: 1
            }
        }
    ])
      
    
    if(!videoLike) {
        throw new ApiError(404, "The video was not found");
    }

    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    videoLike[0],
                    "The like was done successfully!"
                )
            );
 })
 
 const toggleCommentLike = asyncHandler(async (req, res) => {
     const {commentId} = req.params
     //TODO: toggle like on comment
     if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(404,"comment id not found")
     }

     const comment = await Comment.findById(commentId);
  if (!comment) {
   throw new ApiError(500, `comment with id ${commentId} does not exist`)
    
  }
  //   console.log(req.user);

  // check if the comment is already liked
  const alreadyLiked = await Like.findOne({
    likedBy: req.user._id,
    comment: commentId,
  });

  if (alreadyLiked) {
    // remove like
    await Like.deleteOne(alreadyLiked);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "comment like removed"));
  }

  const likeDoc = await Like.create({
    comment: commentId,
    likedBy: req.user._id,
  });

  return res
  .status(200)
  .json(
    new ApiResponse(200, likeDoc, "comment like added"));

 
 })
 
 const toggleTweetLike = asyncHandler(async (req, res) => {
     const {tweetId} = req.params
     //TODO: toggle like on tweet
     if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(404,"invalid tweetid or tweetId not found")
     }

     const tweet = await Tweet.findById(tweetId)

     if(!tweet){
        throw new ApiError(404,`tweet with ${tweetId} not found`)
     }

     const alreadyLiked = await Like.findOne({
        likedBy : req.user._id,
        tweet : tweetId
     })

     if(alreadyLiked){
        await Like.deleteOne(alreadyLiked)

        return res
        .status(200)
        .json(new ApiResponse(200,{},"tweet like deleted successfully"))
     }

     const likeDoc  = await Like.create({
       tweet : tweetId,
       likedBy : req.user._id 
     })

     return res
     .status(200)
     .json(new ApiResponse(200,likeDoc,"tweet liked successfully"))
 }
 )
 
 const getLikedVideos = asyncHandler(async (req, res) => {
     //TODO: get all liked videos
     const allVideos = await Video.aggregate([
        {
            $match :{
                likedBy : req.user._id
            }
        },
        {
           $lookup : {
            from : "videos",
            localField : "vedio",
            foreignField : "_id",
            as : "likedVedios"
           }
        },
        {
            $project : {
                likedVedios : 1,
                createdAt : 1
            }
        }
     ]);

     if(!allVideos){
        throw new ApiError(404,"liked vedios not found")
     }

     return res
            .status(200)
            .json(new ApiResponse(200,allVideos,"liked vedios fetched successfully"))
 })
 
 export {
     toggleCommentLike,
     toggleTweetLike,
     toggleVideoLike,
     getLikedVideos
 }