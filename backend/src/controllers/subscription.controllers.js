import mongoose, {isValidObjectId} from "mongoose"
 import {User} from "../models/user.models.js"
 import { Subscription } from "../models/subscription.model.js"
 import {ApiError} from "../utils/ApiError.js"
 import {ApiResponse} from "../utils/ApiResponse.js"
 import {asyncHandler} from "../utils/asyncHandler.js"
 
 
 const toggleSubscription = asyncHandler(async (req, res) => {
     const {channelId} = req.params
     if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(404,"invalid channel id")
     }
     // TODO: toggle subscription
     const subscribed = await Subscription.findOne(
        {
            $and : [{subscriber : req.user?._id},{channel : channelId}]
        }
     )
     if(!subscribed){
        const sub = await Subscription.create({
            subscriber : req.user?._id,
            channel : channelId
        })

        if(!sub){
            throw new ApiError(500,"error while subscribing channel")
        }
        return res
                .status(200)
                .json(new ApiResponse(200,sub,"subscribed successfully",))
     }
     const unsub = await Subscription.findByIdAndDelete(subscribed._id)

     if(!unsub){
        throw new ApiError(500,"error while unsubscibing the channel")
     }
     return res
            .status(200)
            .json(new ApiResponse(200,unsub,"unsubscribed successfully"))
 })
 
 // controller to return subscriber list of a channel
 const getUserChannelSubscribers = asyncHandler(async (req, res) => {
     const {channelId} = req.params
     const {page = 1, limit = 10} = req.query
     if(!channelId || !isValidObjectId(channelId)){
        throw new ApiError(404,"invalid channelId")
     }
     const pipeline = [
        {
            $match : {
                channel : new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscriberInfo",
                pipeline :[
                    {
                        $project :{
                            username : 1,
                            fullname : 1,
                            avatar : 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriberInfo" // flatten to one document per subscriber
        },
        {
            $project: {
                subscriber: "$subscriberInfo",
                createdAt: 1,
                totalViews: 1
            }
        }
     ]

     
         const result = await Subscription.aggregatePaginate(
            Subscription.aggregate(pipeline),
            {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        );

         if(!result){
            throw new ApiError(500,"error while fetching according to pagination")
         }
         return res
         .status(200)
         .json(
             new ApiResponse(
                 200,
                 {
                     result
                 },
                 "The subscriber are fetched successfully!"
             )
         ); 
 })
 
 // controller to return channel list to which user has subscribed
 const getSubscribedChannels = asyncHandler(async (req, res) => {
     const { subscriberId } = req.params
     const {page = 1, limit =10} = req.query
     if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new ApiError(404,"invalid subscriber id")
     }
     const pipeline = [
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channelInfo",
                pipeline : [
                   { $project : {
                        avatar : 1,
                        fullname :1,
                        username : 1,
                    }
                }
                ]
            }
        },
        {
            $unwind : "$channelInfo"
        },
        {
          $project : {
            channel: "$channelInfo",
            createdAt : 1,
            totalViews : 1
          }
        }
     ]

     const result = await Subscription.aggregatePaginate(
        Subscription.aggregate(pipeline),
        {
            page: parseInt(page),
            limit: parseInt(limit)
        }
    );

    if(!result) {
        throw new ApiError(500,"error while fetching channels")
    }

    return res
             .status(200)
             .json(new ApiResponse(200,result,"channels fetched successfully"))

 })
 
 export {
     toggleSubscription,
     getUserChannelSubscribers,
     getSubscribedChannels
 }