import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'


cloudinary.config({ 
  cloud_name: 'deyzjumc3', 
  api_key: '521873633787198', 
  api_secret: 'ZATtJnLwabPY_C18FMwQuugk4o8' 
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto'
    })
    //file is been uploaded on cloudinary
    console.log("file is been uploaded", response.url)

    return response;
  } catch (error) {
    // fs.unlinkSync(localFilePath) //removes localfilepath from local server if upload is failed
    console.log(error)
    return null;
  }
}

export {uploadOnCloudinary}