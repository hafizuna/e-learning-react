import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useEditLectureMutation, useGetLectureByIdQuery, useRemoveLectureMutation } from "@/features/api/courseApi";
import axios from "axios";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const API_URL = "http://localhost:3000/api/v1/course";

const LectureTab = () => {
  const [lectureTitle, setLectureTitle] = useState("");
  const [uploadVideInfo, setUploadVideoInfo] = useState(null);
  const [isFree, setIsFree] = useState(false);
  const [mediaProgress, setMediaProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [btnDisable, setBtnDisable] = useState(true);
  const params = useParams();
  const { courseId, lectureId } = params;

  const {data:lectureData} = useGetLectureByIdQuery(lectureId);
  const lecture = lectureData?.lecture;

  useEffect(()=>{
    if(lecture){
      setLectureTitle(lecture.lectureTitle);
      setIsFree(lecture.isPreviewFree);
      setUploadVideoInfo(lecture.videoInfo)
      setBtnDisable(false); // Enable button when editing existing lecture
    }
  },[lecture])

  useEffect(() => {
    setBtnDisable(!lectureTitle.trim());
  }, [lectureTitle]);

  const [edtiLecture, { data, isLoading, error, isSuccess }] = useEditLectureMutation();
  const [removeLecture,{data:removeData, isLoading:removeLoading, isSuccess:removeSuccess}] = useRemoveLectureMutation();

  const fileChangeHandler = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("video", file);
      setMediaProgress(true);
      try {
        const res = await axios.post(
          `${API_URL}/${courseId}/lecture/${lectureId}`, 
          formData,
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: ({ loaded, total }) => {
              setUploadProgress(Math.round((loaded * 100) / total));
            },
          }
        );

        if (res.data.success) {
          console.log('Upload response:', res.data);
          setUploadVideoInfo({
            videoUrl: res.data.lecture.videoUrl,
            publicId: res.data.lecture.publicId,
          });
          setBtnDisable(false); // Enable button after successful upload
          toast.success("Video uploaded successfully");
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(error.response?.data?.message || "Failed to upload video");
      } finally {
        setMediaProgress(false);
      }
    }
  };

  const editLectureHandler = async () => {
    try {
      await edtiLecture({
        lectureTitle,
        videoInfo: uploadVideInfo,
        isPreviewFree: isFree,
        courseId,
        lectureId,
      });
    } catch (error) {
      console.error('Edit error:', error);
      toast.error("Failed to update lecture");
    }
  };

  const removeLectureHandler = async () => {
    try {
      await removeLecture(lectureId);
    } catch (error) {
      console.error('Remove error:', error);
      toast.error("Failed to remove lecture");
    }
  }

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message);
    }
    if (error) {
      toast.error(error.data?.message || "An error occurred");
    }
  }, [isSuccess, error]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Lecture</CardTitle>
        <CardDescription>
          Make changes to your lecture here. Click save when you're done.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            type="text"
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="Your Title Name"
          />
        </div>
        <div>
          <Label>Video</Label>
          <Input
            type="file"
            accept="video/*"
            onChange={fileChangeHandler}
          />
          {mediaProgress && (
            <div className="mt-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-gray-500 mt-1">
                Uploading: {uploadProgress}%
              </p>
            </div>
          )}
          {uploadVideInfo?.videoUrl && (
            <div className="mt-2">
              <video 
                src={uploadVideInfo.videoUrl} 
                controls 
                className="w-full max-w-[500px] mt-2"
              />
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="preview"
            checked={isFree}
            onCheckedChange={setIsFree}
          />
          <Label htmlFor="preview">Free Preview</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={removeLectureHandler}
            disabled={removeLoading}
          >
            {removeLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Lecture"
            )}
          </Button>
          <Button
            disabled={isLoading || btnDisable}
            onClick={editLectureHandler}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LectureTab;
