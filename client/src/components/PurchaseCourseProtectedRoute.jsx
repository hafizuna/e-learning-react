import { useGetCourseDetailWithStatusQuery } from "@/features/api/purchaseApi";
import { useParams, Navigate } from "react-router-dom";

const PurchaseCourseProtectedRoute = ({children}) => {
    const {courseId} = useParams();
    const {data, isLoading} = useGetCourseDetailWithStatusQuery(courseId);

    console.log('Purchase protection data:', data);

    if(isLoading) return <p>Loading...</p>

    if (!data?.isPurchased) {
        console.log('Course not purchased, redirecting to course detail');
        return <Navigate to={`/course-detail/${courseId}`} />;
    }

    return children;
}

export default PurchaseCourseProtectedRoute;