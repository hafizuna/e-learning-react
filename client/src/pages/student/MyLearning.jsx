import React from "react";
import Course from "./Course";
import { useLoadUserQuery } from "@/features/api/authApi";
import { useGetPurchasedCoursesQuery } from "@/features/api/purchaseApi";

const MyLearning = () => { 
  const { data: userData, isLoading: userLoading } = useLoadUserQuery();
  const { data: purchaseData, isLoading: purchaseLoading } = useGetPurchasedCoursesQuery();

  const isLoading = userLoading || purchaseLoading;
  const enrolledCourses = userData?.user?.enrolledCourses || [];

  return (
    <div className="max-w-4xl mx-auto my-10 px-4 md:px-0">
      <h1 className="font-bold text-2xl">MY LEARNING</h1>
      <div className="my-5">
        {isLoading ? (
          <MyLearningSkeleton />
        ) : enrolledCourses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600 dark:text-gray-400">You haven't enrolled in any courses yet.</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">
              Browse our courses to start your learning journey!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => (
              <Course key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLearning;

// Skeleton component for loading state
const MyLearningSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {[...Array(3)].map((_, index) => (
      <div
        key={index}
        className="bg-gray-300 dark:bg-gray-700 rounded-lg h-40 animate-pulse"
      ></div>
    ))}
  </div>
);
