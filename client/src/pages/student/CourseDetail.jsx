import BuyCourseButton from "@/components/BuyCourseButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import { BadgeInfo, Lock, PlayCircle } from "lucide-react";
import React from "react";
import ReactPlayer from "react-player";
import { useNavigate, useParams } from "react-router-dom";

const CourseDetail = () => {
  const params = useParams();
  const courseId = params.courseId;
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetCourseDetailWithStatusQuery(courseId);

  if (isLoading) return <h1>Loading...</h1>;
  if (isError) return <h1>Failed to load course details</h1>;
  if (!data?.course) return <h1>Course not found</h1>;

  const { course, isPurchased, hasPendingPurchase } = data;

  const handleContinueCourse = () => {
    navigate(`/course-progress/${courseId}`);
  };

  return (
    <div className="space-y-5">
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-purple-600 to-indigo-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-indigo-400 to-purple-600 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
      </div>
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-soft-light"></div>
        <div className="relative max-w-7xl mx-auto py-12 px-4 ">
          <div className="space-y-4">
            {/* Course Title */}
            <div className="space-y-1">
              <h1 className="font-bold text-xl md:text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {course?.courseTitle}
              </h1>
              <p className="text-sm text-gray-300">{course?.subTitle}</p>
            </div>

            {/* Course Meta */}
            <div className="flex flex-wrap gap-4 text-xs">
              {/* Creator Info */}
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-full bg-purple-600/20">
                  <svg className="w-3 h-3 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Created by</p>
                  <p className="font-medium text-purple-300">{course?.creator?.name}</p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-full bg-indigo-600/20">
                  <BadgeInfo size={12} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Last updated</p>
                  <p className="font-medium text-indigo-300">{new Date(course?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Enrollment Info */}
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-full bg-blue-600/20">
                  <svg className="w-3 h-3 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Students enrolled</p>
                  <p className="font-medium text-blue-300">{course?.totalEnrolled || 0} students</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto my-5 px-4 md:px-8 flex flex-col lg:flex-row justify-between gap-10">
        <div className="w-full lg:w-1/2 space-y-5">
          <h1 className="font-bold text-xl md:text-2xl">Description</h1>
          <p
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: course?.description }}
          />
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
              <CardDescription>{course?.lectures?.length || 0} lectures</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {course?.lectures?.map((lecture, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span>
                    {isPurchased || lecture.isPreviewFree ? (
                      <PlayCircle size={14} className="text-green-500" />
                    ) : (
                      <Lock size={14} />
                    )}
                  </span>
                  <p>{lecture.lectureTitle}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="w-full lg:w-1/3">
          <Card>
            <CardContent className="p-4 flex flex-col">
              <div className="w-full aspect-video mb-4">
                {course?.lectures?.map((lecture, idx) => 
                  lecture.isPreviewFree && lecture.videoUrl && (
                    <div key={idx}>
                      <ReactPlayer
                        width="100%"
                        height="100%"
                        url={lecture.videoUrl}
                        controls={true}
                        light={true}
                      />
                      <p className="mt-2 text-sm font-medium">Preview: {lecture.lectureTitle}</p>
                    </div>
                  )
                )}
              </div>
              <div className="text-2xl font-bold mb-4">₹{course?.coursePrice}</div>
              <div className="space-y-4">
                {isPurchased ? (
                  <Button onClick={handleContinueCourse} className="w-full">
                    Continue Learning
                  </Button>
                ) : (
                  <BuyCourseButton 
                    courseId={courseId} 
                    disabled={hasPendingPurchase}
                    className="w-full"
                  >
                    {hasPendingPurchase ? 'Payment Pending...' : 'Purchase Course'}
                  </BuyCourseButton>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
