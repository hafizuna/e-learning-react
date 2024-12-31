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
  console.log('Course data:', course, 'Purchase Status:', { isPurchased, hasPendingPurchase });

  const handleContinueCourse = () => {
    console.log('Navigating to course progress:', courseId);
    navigate(`/course-progress/${courseId}`);
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#2D2F31] text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex flex-col gap-2">
          <h1 className="font-bold text-2xl md:text-3xl">
            {course?.courseTitle}
          </h1>
          <p className="text-base md:text-lg">{course?.subTitle}</p>
          <p>
            Created By{" "}
            <span className="text-[#C0C4FC] underline italic">
              {course?.creator?.name}
            </span>
          </p>
          <div className="flex items-center gap-2 text-sm">
            <BadgeInfo size={16} />
            <p>Last updated {new Date(course?.createdAt).toLocaleDateString()}</p>
          </div>
          <p>Students enrolled: {course?.enrolledStudents?.length || 0}</p>
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
                  lecture.isPreviewFree && (
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
                )[0] || (
                  course?.lectures?.[0]?.videoUrl && (
                    <div>
                      <ReactPlayer
                        width="100%"
                        height="100%"
                        url={course.lectures[0].videoUrl}
                        controls={false}
                        light={true}
                        playIcon={<Lock className="w-12 h-12 text-white" />}
                      />
                      <p className="mt-2 text-sm text-muted-foreground">Preview not available</p>
                    </div>
                  )
                )}
              </div>
              <Separator className="my-2" />
              <h1 className="text-lg md:text-xl font-semibold">ETB {course?.coursePrice}</h1>
            </CardContent>
            <CardFooter className="flex justify-center p-4">
              {isPurchased ? (
                <Button 
                  className="w-full" 
                  onClick={handleContinueCourse}
                  variant="default"
                >
                  Continue Learning
                </Button>
              ) : hasPendingPurchase ? (
                <Button 
                  className="w-full" 
                  variant="secondary"
                  disabled
                >
                  Payment Pending
                </Button>
              ) : (
                <BuyCourseButton courseId={courseId} />
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
