import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  useCreateLectureMutation,
  useGetCourseLectureQuery,
} from "@/features/api/courseApi";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Lecture from "./Lecture";
import axios from "axios";

const API_URL = "http://localhost:3000/api/v1/course";

const CreateLecture = () => {
  const [lectureTitle, setLectureTitle] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [isPreviewFree, setIsPreviewFree] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const courseId = params.courseId;

  const [createLecture, { data, isLoading, isSuccess, error }] =
    useCreateLectureMutation();

  const {
    data: lectureData,
    isLoading: lectureLoading,
    isError: lectureError,
    refetch,
  } = useGetCourseLectureQuery(courseId);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        console.log('Video file selected:', file);
        setVideoFile(file);
        setUploadProgress(0);
      } else {
        toast.error('Please select a video file');
        e.target.value = '';
      }
    }
  };

  const createLectureHandler = async () => {
    if (!lectureTitle.trim()) {
      toast.error("Please enter a lecture title");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('lectureTitle', lectureTitle);
      formData.append('isPreviewFree', isPreviewFree);
      
      if (videoFile) {
        console.log('Uploading video file:', videoFile);
        formData.append('video', videoFile);
        
        const response = await axios.post(
          `${API_URL}/${courseId}/lecture`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            withCredentials: true,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              console.log('Upload progress:', percentCompleted);
              setUploadProgress(percentCompleted);
            },
          }
        );
        
        console.log('Upload response:', response.data);
        
        if (response.data.success) {
          toast.success('Lecture created successfully');
          resetForm();
          refetch();
        } else {
          throw new Error(response.data.message || 'Failed to create lecture');
        }
      } else {
        // If no video, use RTK mutation
        const response = await createLecture({ 
          courseId,
          formData
        }).unwrap();
        
        console.log('Lecture created:', response);
        if (response.success) {
          toast.success('Lecture created successfully');
          resetForm();
          refetch();
        }
      }
    } catch (error) {
      console.error('Create lecture error:', error);
      toast.error(error.response?.data?.message || error.message || "Failed to create lecture");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setLectureTitle('');
    setVideoFile(null);
    setIsPreviewFree(false);
    if (document.querySelector('input[type="file"]')) {
      document.querySelector('input[type="file"]').value = '';
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
    }
    if (error) {
      toast.error(error.data?.message || "An error occurred");
    }
  }, [isSuccess, error]);

  return (
    <div className="flex-1 mx-10">
      <div className="mb-4">
        <h1 className="font-bold text-xl">Add New Lecture</h1>
        <p className="text-sm text-gray-500">
          Fill in the details below to create a new lecture
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Lecture Title</Label>
          <Input
            type="text"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="Enter lecture title"
          />
        </div>
        <div>
          <Label>Video (Optional)</Label>
          <Input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="cursor-pointer"
            disabled={isUploading}
          />
          {videoFile && (
            <p className="text-sm text-gray-500 mt-1">
              Selected: {videoFile.name}
            </p>
          )}
          {isUploading && (
            <div className="mt-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-gray-500 mt-1">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="preview"
            checked={isPreviewFree}
            onCheckedChange={setIsPreviewFree}
            disabled={isUploading}
          />
          <Label htmlFor="preview">Free Preview</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/course/${courseId}`)}
            disabled={isUploading}
          >
            Back to course
          </Button>
          <Button 
            disabled={isLoading || isUploading || !lectureTitle.trim()} 
            onClick={createLectureHandler}
          >
            {isLoading || isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? `Uploading (${uploadProgress}%)` : 'Creating lecture...'}
              </>
            ) : (
              "Create lecture"
            )}
          </Button>
        </div>
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Course Lectures</h2>
          {lectureLoading ? (
            <p>Loading lectures...</p>
          ) : lectureError ? (
            <p className="text-red-500">Failed to load lectures</p>
          ) : !lectureData?.lectures?.length ? (
            <p className="text-gray-500">No lectures available</p>
          ) : (
            lectureData.lectures.map((lecture, index) => (
              <Lecture
                key={lecture._id}
                lecture={lecture}
                courseId={courseId}
                index={index}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateLecture;
