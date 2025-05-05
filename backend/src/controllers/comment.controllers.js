import mongoose, { isValidObjectId } from "mongoose"
 import {Comment} from "../models/comment.model.js"
 import {ApiError} from "../utils/ApiError.js"
 import {ApiResponse} from "../utils/ApiResponse.js"
 import {asyncHandler} from "../utils/asyncHandler.js"
 
 const getVideoComments = asyncHandler(async (req, res) => {
     //TODO: get all comments for a video
     const {videoId} = req.params
     const {page = 1, limit = 10} = req.query

     if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(404,"Invalid vedioId");
     }
    
     const comments = await Comment.aggregate([
        {
            $match:{
                video : mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerDetails",
                pipeline : [
                    {
                        $project : {
                            _id :1,
                            username : 1,
                            avatar : 1,
                            fullname : 1,
                            content : 1
                        }
                    }
                ]
            }
        }
     ])

     if(!comments){
        throw new ApiError(500,"something went wrong while fetching comments")
     }

     const options = {
        page,
        limit
    }

    const result = await Comment
    .aggregatePaginate(comments, options, (err, results) => {
        if(err) {
            throw new ApiError(400, err);
        } else {
            console.log(results);
            return results;
        }
    })

    if(!result) {
        throw new ApiError(400, "the callback didnt worked");
    }

    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        result
                    },
                    "The comments are fetched successfully!"
                )
            );
 })
 
 const addComment = asyncHandler(async (req, res) => {
     // TODO: add a comment to a video
     const {comment} = req.body
     const videoId = req.params

     if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(404,"video not found")
     }

     if(!comment){
        throw new ApiError(404,"comment content not found")
     }

     const newComment = await Comment.create({
         content : comment,
         video : videoId,
         owner : req.user._id
     })

     if (!newComment) {
        throw new ApiError(500,"Error while saving comment")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newComment,
            "Comment Added"
        )
    )
 })
 
 const updateComment = asyncHandler(async (req, res) => {
     // TODO: update a comment
     const {updatedContent} = req.body
     const {commentId} = req.params

     if(updatedContent === "" || updatedContent.trim() === "") {
        throw new ApiError(400, "Please enter a proper comment!");
    }

    if(!commentId || isValidObjectId(commentId)) {
        throw new ApiError(401, "invalid commentId was found!");
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    if(!((comment.owner).equals(req.user?._id))){
        throw new ApiError(400,"You are not allowed to update content")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
         $set : {
            content,
         }
        },
    {new : true})

    if(!updatedComment){
        throw new ApiError(500,"error while updating comment")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedComment,
            "Updated Comment"
        )
    )
 })
 
 const deleteComment = asyncHandler(async (req, res) => {
     // TODO: delete a comment
     const {commentId} = req.params

    if(!commentId || isValidObjectId(commentId)) {
        throw new ApiError(401, "invalid commentId was found!");
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    if(!((comment.owner).equals(req.user?._id))){
        throw new ApiError(400,"You are not allowed to update content")
    }

    const deletedComment = await Comment.findByIdAndDelete(
        commentId
    )

    if(!deletedComment){
        throw new ApiError(500,"error while deleting comment")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            deletedComment,
            "Comment Deleted successfully"
        )
    )
 })
 
 export {
     getVideoComments, 
     addComment, 
     updateComment,
      deleteComment
     }