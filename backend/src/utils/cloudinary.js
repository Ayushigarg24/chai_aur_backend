import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

 

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
    // Upload an image
     const uploadOnCloudinary = async (localfilepath) => {
       try{
        if(!localfilepath) return null
        //upload the file
        const response = await cloudinary.uploader.upload
        (localfilepath,{
               resource_types:"auto"
        })
        // file has been uploaded successfully
        console.log("file is uploaded on cloudinary",response.url);
        return response
       }
       catch(error)  {
           fs.unlinkSync(localfilepath) // remove the locally saved file as upload got failed
           return null;
       }
     }
export {uploadOnCloudinary}
