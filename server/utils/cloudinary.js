import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from 'fs';
dotenv.config();

// Configure cloudinary
cloudinary.config({
  cloud_name: "ddui35kig",
  api_key: "748916519589534",
  api_secret: "EtOdQTMtlgq2YrCTlLBrsKZLX0M",
});

export const uploadMedia = async (file) => {
  try {
    console.log('Uploading file to Cloudinary:', { file });
    
    // Check if file exists
    if (!fs.existsSync(file)) {
      console.error('File does not exist:', file);
      return null;
    }

    const uploadResponse = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      folder: "lms_videos", // Add a folder for organization
    });

    console.log('Cloudinary upload response:', uploadResponse);

    // Delete the temporary file after successful upload
    try {
      fs.unlinkSync(file);
    } catch (err) {
      console.error('Error deleting temp file:', err);
    }

    return uploadResponse;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};

export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    console.log('Deleting media from Cloudinary:', { publicId });
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('Delete result:', result);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return null;
  }
};

export const deleteVideoFromCloudinary = async (publicId) => {
  try {
    console.log('Deleting video from Cloudinary:', { publicId });
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
    console.log('Delete video result:', result);
    return result;
  } catch (error) {
    console.error('Cloudinary video delete error:', error);
    return null;
  }
};
