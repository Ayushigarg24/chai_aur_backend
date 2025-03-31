import mongoose,{Schema} from "mongoose";
import mongooseAggreatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile:{
            type:String,
            required :true,
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        duration:{
            type:Number,//cloudnary url
            required:true
        },
        views:{
            type:Number,
            default:0,
            required:true
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
{timeseries:true}
)

videoSchema.plugin(mongooseAggreatePaginate)

export const Video = mongoose.model("Video",videoSchema)