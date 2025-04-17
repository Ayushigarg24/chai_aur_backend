import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    if(!userId || isValidObjectId(userId)){
        throw new ApiError(404,"UserId not found")
    }
    
    if (!query) {
        throw new APIError(404, "Query not found!");
    }

    const owner = await User.findById(userId)

    if (!owner) {
        throw new APIError(404, "User not found!");
    }

    const videos = await Video.find(query).aggregate([
        {
            $match : {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline : [
                    {
                    $project : {
                        username: 1,
                        avatar: 1
                    }
                }
                ]
            }
        },
        {
              $unwind: "$ownerDetails"
        },
        {
            $sort: {
                [sortBy]: sortType === "desc" ? -1 : 1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                ownerDetails: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    if (videos.length === 0) {
        throw new ApiError(404, "No videos found for the given query.");
    }
    
    return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    videos,
                    "Videos retrieved successfully."
                )
            );

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video

    const videoFilePath = req.files?.videoFile[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path

    if(!videoFilePath || !thumbnailPath){
        throw new ApiError(404,"File Not Found")
    }

    if(!title || !description){
        throw new ApiError(404,"File Not Found")
    }

    const videoFile = await uploadOnCloudinary(videoFilePath)
    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!videoFile || !thumbnail){
        throw new ApiError(404,"File Not Uploaded ")
    }

    const newVideo = await Video.create({
        title,
        description,
        videoFile : [videoFile.secure_url, videoFile.public_id],
        thumbnail :  [thumbnail.secure_url, thumbnail.public_id],
        owner : req.user._id
})

return res.
       status(200)
       .json(
        new ApiResponse(
            200,
            newVideo,
            "Video published successfully."
        )
       )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(404,"VideoID not found")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"video not founf")
    }

    return res.status(200)
              .json(
                new ApiResponse(
                    200,
                    video,
                    "video fetched successfully"
                )
              )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(404,"VideoID not found")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404,"Video can not be found")
    }

    await deleteFromCloudinary(video.thumbnail[1]);

    const {title,description} = req.body;
    const thumbnailPath =req.file.thumbnail[0].path;

    if(!title || !description){
        throw new ApiError(404,"title and description is required")
    }
     
    if(!thumbnailPath) {
        throw new ApiError(400, "Thumbnail is required!");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailPath)

    if(!thumbnail){
        throw new ApiError(500,"Failed to upload file on cloudinary")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        title,
        description,
        thumbnail : [thumbnail.secure_url, thumbnail.public_id],
        owner : req.user._id
    },{new : true})

    if (!updatedVideo) {
        throw new ApiError(404, "Video not found!");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video updated successfully."
            )
        );

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(404,"invalid vedio id")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"vedio not found")
    }
    const thumbnailId = video.thumbnail[1];
    const videoFileId = video.videoFile[1];
    await deleteFromCloudinary(thumbnailId);
    await deleteFromCloudinary(videoFileId);
    await Video.findByIdAndDelete(videoId)

    return res.status(200)
              .json(
                new ApiResponse(
                    200,
                    {},
                    "video deleted successfully"
                )
              )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(404,"invalid vedio id")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"vedio not found")
    }

   video.isPublised = !video.isPublised
   await video.save({ validateBeforeSave: false })

   return res
   .status(200)
   .json(
       new ApiResponse(
           200,
           video,
           "Video publish status toggled successfully."
       )
   );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}