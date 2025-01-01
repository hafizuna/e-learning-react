import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";
import { Link } from "react-router-dom";

const Course = ({ course = {} }) => {
  if (!course) return null;

  return (
    <Link to={`/course-detail/${course?._id}`}>
      <Card className="overflow-hidden rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 shadow-lg hover:shadow-purple-500/20 border border-purple-100 dark:border-purple-900/20 transform hover:-translate-y-1 transition-all duration-300">
        <div className="relative group">
          <img
            src={course?.courseThumbnail || "https://placehold.co/600x400?text=Course+Thumbnail"}
            alt={course?.courseTitle || "Course"}
            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <CardContent className="px-6 py-5 space-y-4 relative backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
          <h1 className="font-bold text-lg leading-tight hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-2">
            {course?.courseTitle || "Untitled Course"}
          </h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-purple-500/20 shadow-lg">
                <AvatarImage 
                  src={course?.creator?.photoUrl || "https://github.com/shadcn.png"} 
                  alt={course?.creator?.name || 'Instructor'} 
                />
                <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                  {course?.creator?.name?.charAt(0) || 'I'}
                </AvatarFallback>
              </Avatar>
              <h1 className="font-medium text-sm text-gray-600 dark:text-gray-300">
                {course?.creator?.name || "Instructor"}
              </h1>
            </div>
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors px-3 py-1.5 text-xs rounded-full">
              {course?.courseLevel || "All Levels"}
            </Badge>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-purple-100 dark:border-purple-900/20">
            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
              ${course?.coursePrice || 0}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {course?.totalLectures || 0} lectures
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Course;
