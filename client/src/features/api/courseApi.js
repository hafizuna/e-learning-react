import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const COURSE_API = "http://localhost:3000/api/v1/course";

export const courseApi = createApi({
  reducerPath: "courseApi",
  tagTypes: ["Refetch_Creator_Course", "Refetch_Lecture"],
  baseQuery: fetchBaseQuery({
    baseUrl: COURSE_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: ({ courseTitle, category }) => ({
        url: "",
        method: "POST",
        body: { courseTitle, category },
      }),
      invalidatesTags: ["Refetch_Creator_Course"],
    }),
    getSearchCourse:builder.query({
      query: ({searchQuery, categories, sortByPrice}) => {
        // Build query string
        const params = new URLSearchParams();
        
        // Add search query
        params.append('query', searchQuery || '');

        // Add categories
        if(categories && categories.length > 0) {
          categories.forEach(category => {
            params.append('categories', category);
          });
        }

        // Add sort by price
        if(sortByPrice){
          params.append('sortByPrice', sortByPrice);
        }

        return {
          url: `/search?${params.toString()}`,
          method: "GET",
        }
      }
    }),
    getPublishedCourse: builder.query({
      query: () => ({
        url: "/published-courses",
        method: "GET",
      }),
    }),
    getCourseById: builder.query({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "GET",
      }),
    }),
    getCreatorCourse: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["Refetch_Creator_Course"],
    }),
    editCourse: builder.mutation({
      query: ({ formData, courseId }) => ({
        url: `/${courseId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["Refetch_Creator_Course"],
    }),
    createLecture: builder.mutation({
      query: ({ courseId, formData }) => {
        console.log('Creating lecture with:', { courseId, formData });
        return {
          url: `/${courseId}/lecture`,
          method: "POST",
          body: formData,
          // Don't set Content-Type header, let browser set it with boundary
          headers: {
            // Remove Content-Type to let browser set it
          },
          formData: true,
          credentials: 'include'
        };
      },
      invalidatesTags: ["Refetch_Lecture"],
    }),
    getCourseLecture: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/lecture`,
        method: "GET",
      }),
      providesTags: ["Refetch_Lecture"],
    }),
    editLecture: builder.mutation({
      query: ({
        lectureTitle,
        videoInfo,
        isPreviewFree,
        courseId,
        lectureId,
      }) => ({
        url: `/${courseId}/lecture/${lectureId}`,
        method: "POST",
        body: { lectureTitle, videoInfo, isPreviewFree },
      }),
    }),
    removeLecture: builder.mutation({
      query: (lectureId) => ({
        url: `/lecture/${lectureId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Refetch_Lecture"],
    }),
    getLectureById: builder.query({
      query: (lectureId) => ({
        url: `/lecture/${lectureId}`,
        method: "GET",
      }),
    }),
    publishCourse: builder.mutation({
      query: ({ courseId, query }) => ({
        url: `/${courseId}`,
        method: "PATCH",
        params: { publish: query },
        credentials: 'include'
      }),
      invalidatesTags: ["Refetch_Creator_Course"],
    }),
    removeCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Refetch_Creator_Course"],
    }),
  }),
});
export const {
  useCreateCourseMutation,
  useGetSearchCourseQuery,
  useGetPublishedCourseQuery,
  useGetCourseByIdQuery,
  useGetCreatorCourseQuery,
  useEditCourseMutation,
  useCreateLectureMutation,
  useGetCourseLectureQuery,
  useEditLectureMutation,
  useRemoveLectureMutation,
  useGetLectureByIdQuery,
  usePublishCourseMutation,
  useRemoveCourseMutation,
} = courseApi;
