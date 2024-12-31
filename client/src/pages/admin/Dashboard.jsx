import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetPurchasedCoursesQuery } from "@/features/api/purchaseApi";
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { data, isLoading, isError } = useGetPurchasedCoursesQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <h1 className="text-xl text-gray-500">Loading dashboard data...</h1>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <h1 className="text-xl text-red-500">Failed to load dashboard data</h1>
      </div>
    );
  }

  // Safely access purchasedCourse with a default empty array
  const purchasedCourse = data?.purchasedCourse || [];

  // Only process data if we have purchases
  const courseData = purchasedCourse.map((course) => ({
    name: course.courseId?.courseTitle || 'Untitled Course',
    price: course.courseId?.coursePrice || 0
  }));

  const totalRevenue = purchasedCourse.reduce(
    (acc, element) => acc + (element.amount || 0),
    0
  );

  const totalSales = purchasedCourse.length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalSales}</p>
            <p className="text-sm text-gray-500 mt-1">Total courses sold</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">₹{totalRevenue}</p>
            <p className="text-sm text-gray-500 mt-1">Total earnings</p>
          </CardContent>
        </Card>

        {courseData.length > 0 ? (
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-700">
                Course Prices Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={courseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={60}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`₹${value}`, 'Price']}
                    labelStyle={{ color: '#6b7280' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#4a90e2"
                    strokeWidth={3}
                    dot={{ stroke: "#4a90e2", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4">
            <CardContent className="p-6">
              <p className="text-center text-gray-500">
                No course data available to display chart
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
