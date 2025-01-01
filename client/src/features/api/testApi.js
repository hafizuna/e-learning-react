import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const TEST_API = "http://localhost:3000/api/v1/test";

export const testApi = createApi({
  reducerPath: "testApi",
  tagTypes: ["Tests"],
  baseQuery: fetchBaseQuery({
    baseUrl: TEST_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createTest: builder.mutation({
      query: (data) => ({
        url: "/create",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Tests"],
    }),
    getTestsByCourse: builder.query({
      query: (courseId) => `/course/${courseId}`,
      providesTags: ["Tests"],
    }),
    getTestById: builder.query({
      query: (testId) => `/${testId}`,
      providesTags: ["Tests"],
    }),
    deleteQuestion: builder.mutation({
      query: ({ testId, questionId }) => ({
        url: `/${testId}/question/${questionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tests"],
    }),
  }),
});

export const { 
  useCreateTestMutation, 
  useGetTestsByCourseQuery, 
  useGetTestByIdQuery,
  useDeleteQuestionMutation
} = testApi;
