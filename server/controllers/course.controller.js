 import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import {deleteMediaFromCloudinary, deleteVideoFromCloudinary, uploadMedia} from "../utils/cloudinary.js";

export const createCourse = async (req,res) => {
    try {
        const {courseTitle, category, subTitle, description, courseLevel, coursePrice} = req.body;
        const thumbnail = req.file;

        if(!courseTitle || !category) {
            return res.status(400).json({
                success: false,
                message: "Course title and category are required."
            });
        }

        let courseThumbnail;
        if(thumbnail) {
            // Upload thumbnail to Cloudinary
            const uploadResponse = await uploadMedia(thumbnail.path);
            if(!uploadResponse) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload thumbnail"
                });
            }
            courseThumbnail = uploadResponse.secure_url;
        }

        const course = await Course.create({
            courseTitle,
            category,
            subTitle,
            description,
            courseLevel,
            coursePrice,
            courseThumbnail,
            creator: req.id
        });

        return res.status(201).json({
            success: true,
            course,
            message: "Course created successfully"
        });
    } catch (error) {
        console.error('Create course error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to create course"
        });
    }
};

export const searchCourse = async (req,res) => {
    try {
        const {query = "", categories, sortByPrice = ""} = req.query;
        console.log('Categories received:', categories);
        
        // create search query
        const searchCriteria = {
            isPublished: true,
            $or: [
                {courseTitle: {$regex: query, $options: "i"}},
                {subTitle: {$regex: query, $options: "i"}},
                {category: {$regex: query, $options: "i"}},
            ]
        };

        // if categories selected
        if(categories) {
            // Handle both single category and array of categories
            const categoryArray = Array.isArray(categories) ? categories : [categories];
            searchCriteria.category = {$in: categoryArray};
            console.log('Category criteria:', searchCriteria.category);
        }

        // define sorting order
        const sortOptions = {};
        if(sortByPrice === "low"){
            sortOptions.coursePrice = 1;//sort by price in ascending
        }else if(sortByPrice === "high"){
            sortOptions.coursePrice = -1; // descending
        }

        console.log('Final search criteria:', searchCriteria);
        
        let courses = await Course.find(searchCriteria)
            .populate({path:"creator", select:"name photoUrl"})
            .sort(sortOptions);

        console.log('Found courses:', courses.length);

        return res.status(200).json({
            success: true,
            courses: courses || []
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Failed to search courses",
            courses: []
        });
    }
}

export const getPublishedCourse = async (_,res) => {
    try {
        const courses = await Course.find({isPublished:true}).populate({path:"creator", select:"name photoUrl"});
        if(!courses){
            return res.status(404).json({
                message:"Course not found"
            })
        }
        return res.status(200).json({
            courses,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to get published courses"
        })
    }
}
export const getCreatorCourses = async (req,res) => {
    try {
        const userId = req.id;
        const courses = await Course.find({creator:userId});
        if(!courses){
            return res.status(404).json({
                courses:[],
                message:"Course not found"
            })
        };
        return res.status(200).json({
            courses,
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to create course"
        })
    }
}
export const editCourse = async (req,res) => {
    try {
        const courseId = req.params.courseId;
        const {courseTitle, subTitle, description, category, courseLevel, coursePrice} = req.body;
        const thumbnail = req.file;

        let course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({
                message:"Course not found!"
            })
        }
        let courseThumbnail;
        if(thumbnail){
            if(course.courseThumbnail){
                const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
                await deleteMediaFromCloudinary(publicId); // delete old image
            }
            // upload a thumbnail on clourdinary
            courseThumbnail = await uploadMedia(thumbnail.path);
        }

 
        const updateData = {courseTitle, subTitle, description, category, courseLevel, coursePrice, courseThumbnail:courseThumbnail?.secure_url};

        course = await Course.findByIdAndUpdate(courseId, updateData, {new:true});

        return res.status(200).json({
            course,
            message:"Course updated successfully."
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to create course"
        })
    }
}
export const getCourseById = async (req,res) => {
    try {
        const {courseId} = req.params;

        const course = await Course.findById(courseId)
            .populate('creator', 'name photoUrl')
            .populate('lectures')
            .populate('enrolledStudents');

        if(!course){
            return res.status(404).json({
                message:"Course not found!"
            })
        }
        return res.status(200).json({
            course
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to get course by id"
        })
    }
}

export const createLecture = async (req, res) => {
    try {
        console.log('Request headers:', req.headers);
        console.log('Request files:', req.files);
        console.log('Request file:', req.file);
        console.log('Request body:', req.body);
        
        const { lectureTitle, isPreviewFree } = req.body;
        const { courseId } = req.params;
        const videoFile = req.file;

        console.log('Processing lecture creation:', {
            lectureTitle,
            courseId,
            hasVideoFile: !!videoFile,
            videoFileDetails: videoFile
        });

        if (!lectureTitle || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Lecture title is required"
            });
        }

        let lecture;
        let uploadResponse;

        if (videoFile) {
            console.log('Starting video upload to Cloudinary:', {
                filePath: videoFile.path,
                fileSize: videoFile.size,
                mimeType: videoFile.mimetype
            });

            try {
                uploadResponse = await uploadMedia(videoFile.path);
                console.log('Cloudinary upload response:', uploadResponse);
                
                if (!uploadResponse) {
                    throw new Error('No response from Cloudinary');
                }
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload video to Cloudinary",
                    error: uploadError.message
                });
            }
        } else {
            console.log('No video file provided');
        }

        // Create lecture with or without video
        const lectureData = {
            lectureTitle,
            videoUrl: uploadResponse?.secure_url || null,
            publicId: uploadResponse?.public_id || null,
            isPreviewFree: isPreviewFree || false
        };
        
        console.log('Creating lecture with data:', lectureData);
        
        lecture = await Lecture.create(lectureData);
        console.log('Lecture created:', lecture);

        // Add lecture to course
        const course = await Course.findById(courseId);
        if (!course) {
            if (uploadResponse?.public_id) {
                console.log('Deleting uploaded video due to course not found');
                await deleteVideoFromCloudinary(uploadResponse.public_id);
            }
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        course.lectures.push(lecture._id);
        await course.save();
        console.log('Course updated with new lecture');

        return res.status(201).json({
            success: true,
            lecture,
            message: "Lecture created successfully"
        });

    } catch (error) {
        console.error('Create lecture error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to create lecture",
            error: error.message
        });
    }
};
export const getCourseLecture = async (req,res) => {
    try {
        const {courseId} = req.params;
        const course = await Course.findById(courseId).populate("lectures");
        if(!course){
            return res.status(404).json({
                message:"Course not found"
            })
        }
        return res.status(200).json({
            lectures: course.lectures
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to get lectures"
        })
    }
}
export const editLecture = async (req,res) => {
    try {
        const {lectureTitle, videoInfo, isPreviewFree} = req.body;
        
        const {courseId, lectureId} = req.params;
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            return res.status(404).json({
                message:"Lecture not found!"
            })
        }

        // update lecture
        if(lectureTitle) lecture.lectureTitle = lectureTitle;
        if(videoInfo?.videoUrl) lecture.videoUrl = videoInfo.videoUrl;
        if(videoInfo?.publicId) lecture.publicId = videoInfo.publicId;
        lecture.isPreviewFree = isPreviewFree;

        await lecture.save();

        // Ensure the course still has the lecture id if it was not aleardy added;
        const course = await Course.findById(courseId);
        if(course && !course.lectures.includes(lecture._id)){
            course.lectures.push(lecture._id);
            await course.save();
        };
        return res.status(200).json({
            lecture,
            message:"Lecture updated successfully."
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to edit lectures"
        })
    }
}
export const removeLecture = async (req,res) => {
    try {
        const {lectureId} = req.params;
        const lecture = await Lecture.findByIdAndDelete(lectureId);
        if(!lecture){
            return res.status(404).json({
                message:"Lecture not found!"
            });
        }
        // delete the lecture from couldinary as well
        if(lecture.publicId){
            await deleteVideoFromCloudinary(lecture.publicId);
        }

        // Remove the lecture reference from the associated course
        await Course.updateOne(
            {lectures:lectureId}, // find the course that contains the lecture
            {$pull:{lectures:lectureId}} // Remove the lectures id from the lectures array
        );

        return res.status(200).json({
            message:"Lecture removed successfully."
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to remove lecture"
        })
    }
}
export const getLectureById = async (req,res) => {
    try {
        const {lectureId} = req.params;
        const lecture = await Lecture.findById(lectureId);
        if(!lecture){
            return res.status(404).json({
                message:"Lecture not found!"
            });
        }
        return res.status(200).json({
            lecture
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Failed to get lecture by id"
        })
    }
}

export const removeCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // Find the course
        const course = await Course.findById(courseId).populate('lectures');
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found!"
            });
        }

        // Delete course thumbnail from Cloudinary if exists
        if (course.courseThumbnail) {
            const publicId = course.courseThumbnail.split("/").pop().split(".")[0];
            await deleteMediaFromCloudinary(publicId);
        }

        // Delete all lecture videos from Cloudinary
        for (const lecture of course.lectures) {
            if (lecture.videoUrl) {
                const publicId = lecture.videoUrl.split("/").pop().split(".")[0];
                await deleteVideoFromCloudinary(publicId);
            }
        }

        // Delete all lectures
        await Lecture.deleteMany({ _id: { $in: course.lectures } });

        // Delete the course
        await Course.findByIdAndDelete(courseId);

        return res.status(200).json({
            success: true,
            message: "Course and all associated content deleted successfully"
        });
    } catch (error) {
        console.error('Remove course error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove course"
        });
    }
};

export const togglePublishCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { publish } = req.query;

        console.log('Toggle publish request:', { courseId, publish }); // Debug log

        const course = await Course.findById(courseId).populate('lectures');
        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found!"
            });
        }

        // Check if course has lectures before publishing
        if (publish === "true" && (!course.lectures || course.lectures.length === 0)) {
            return res.status(400).json({
                success: false,
                message: "Cannot publish a course without lectures"
            });
        }

        course.isPublished = publish === "true";
        await course.save();

        console.log('Course updated:', { courseId, isPublished: course.isPublished }); // Debug log

        return res.status(200).json({
            success: true,
            message: course.isPublished ? "Course published successfully" : "Course unpublished successfully",
            course
        });
    } catch (error) {
        console.error('Toggle publish error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to update course publish status"
        });
    }
};
