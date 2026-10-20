import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";

const API_URL = import.meta.env.VITE_API_URL;

export default function CoursesPage() {
    const { user, logout } = useContext(UserContext);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [courseData, setCourseData] = useState({
        name: "", duration: "", topics: "", price: "", maxStudent: "",
    });

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/course`, { credentials: "include" });
            const data = await res.json();
            if (res.ok) {
                setCourses(data.data || []);
            } else {
                setError(data.message || "Failed to fetch courses");
            }
        } catch (err) {
            setError("Network error while fetching courses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/course`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    ...courseData,
                    duration: Number(courseData.duration),
                    price: Number(courseData.price),
                    maxStudent: Number(courseData.maxStudent),
                    topics: courseData.topics.split(",").map((t) => t.trim()),
                }),
            });

            if (res.ok) {
                setCourseData({ name: "", duration: "", topics: "", price: "", maxStudent: "" });
                fetchCourses();
            } else {
                const data = await res.json();
                alert(data.message || "Failed to create course");
            }
        } catch (err) {
            alert("Network error");
        }
    };

    // --- NEW ACTIONS FOR DYNAMIC ROUTE --- //

    const handleDelete = async (courseId) => {
        if (!window.confirm("Delete this course?")) return;
        try {
            const res = await fetch(`${API_URL}/api/course/${courseId}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) fetchCourses();
            else alert((await res.json()).message);
        } catch (err) {
            alert("Network error");
        }
    };

    const handleToggleStatus = async (courseId, currentStatus) => {
        const newStatus = currentStatus === "Open" ? "Close" : "Open";
        console.log("[toggleStatus] courseId:", courseId, "currentStatus:", currentStatus, "→", newStatus);
        try {
            const res = await fetch(`${API_URL}/api/course/${courseId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status: newStatus })
            });
            console.log("[toggleStatus] response status:", res.status);
            if (res.ok) {
                await fetchCourses();
            } else {
                const text = await res.text();
                console.error("[toggleStatus] error body:", text);
                try {
                    const data = JSON.parse(text);
                    alert(data.message || "Failed to update status");
                } catch {
                    alert(`Server error ${res.status}: ${text}`);
                }
            }
        } catch (err) {
            console.error("[toggleStatus] fetch error:", err);
            alert("Network error: " + err.message);
        }
    };


    const handleEnroll = async (courseId) => {
        try {
            const res = await fetch(`${API_URL}/api/course/${courseId}`, {
                method: "POST",
                credentials: "include"
            });
            if (res.ok) {
                alert("Successfully enrolled!");
                fetchCourses();
            } else {
                alert((await res.json()).message);
            }
        } catch (err) {
            alert("Network error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
                    <h1 className="text-3xl font-bold text-gray-800">Courses Dashboard</h1>
                    <div className="flex gap-4 items-center">
                        <span className="text-gray-600">
                            Logged in as: <strong className="text-blue-600">{user?.username}</strong> ({user?.role})
                        </span>
                        <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                            Logout
                        </button>
                    </div>
                </div>

                {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

                {user?.role === "Teacher" && (
                    <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
                        <h2 className="text-xl font-bold mb-4">Create New Course</h2>
                        <form onSubmit={handleCreateCourse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Course Name" required className="border p-2 rounded"
                                value={courseData.name} onChange={e => setCourseData({ ...courseData, name: e.target.value })} />
                            <input type="number" placeholder="Duration (hours)" required className="border p-2 rounded"
                                value={courseData.duration} onChange={e => setCourseData({ ...courseData, duration: e.target.value })} />
                            <input type="number" placeholder="Price ($)" required className="border p-2 rounded"
                                value={courseData.price} onChange={e => setCourseData({ ...courseData, price: e.target.value })} />
                            <input type="number" placeholder="Max Students" required className="border p-2 rounded"
                                value={courseData.maxStudent} onChange={e => setCourseData({ ...courseData, maxStudent: e.target.value })} />
                            <input type="text" placeholder="Topics (comma separated)" required className="border p-2 rounded md:col-span-2"
                                value={courseData.topics} onChange={e => setCourseData({ ...courseData, topics: e.target.value })} />
                            <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600 md:col-span-2">
                                Create Course
                            </button>
                        </form>
                    </div>
                )}

                <h2 className="text-2xl font-bold mb-4">Available Courses</h2>
                {loading ? (
                    <p>Loading courses...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {courses.length === 0 ? (
                            <p className="text-gray-500">No courses available right now.</p>
                        ) : (
                            courses.map(course => (
                                <div key={course._id} className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                                        <div className="text-sm text-gray-600 space-y-1 mb-4">
                                            <p><strong>Status:</strong> <span className={course.status === 'Open' ? 'text-green-600' : 'text-red-600'}>{course.status}</span></p>
                                            <p><strong>Price:</strong> ${course.price}</p>
                                            <p><strong>Duration:</strong> {course.duration} hours</p>
                                            <p><strong>Students:</strong> {course.enrolledStudents?.length || 0} / {course.maxStudent}</p>
                                        </div>
                                        <div className="mb-4">
                                            <strong className="text-sm">Topics:</strong>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {course.topics.map((topic, i) => (
                                                    <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{topic}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                        {user?.role === "Teacher" && course.teacherId === user.id && (
                                            <>
                                                <button onClick={() => handleToggleStatus(course._id, course.status)} className="flex-1 bg-yellow-500 text-white py-1 rounded hover:bg-yellow-600 text-sm">
                                                    Toggle Status
                                                </button>
                                                <button onClick={() => handleDelete(course._id)} className="flex-1 bg-red-500 text-white py-1 rounded hover:bg-red-600 text-sm">
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                        {user?.role === "Student" && (() => {
                                            const isEnrolled = course.enrolledStudents?.includes(user.id);
                                            const isFull = (course.enrolledStudents?.length || 0) >= course.maxStudent;
                                            const isOpen = course.status === "Open";

                                            if (isEnrolled) {
                                                return (
                                                    <button
                                                        onClick={() => handleEnroll(course._id)}
                                                        className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 text-sm font-bold"
                                                    >
                                                        ✓ Enrolled — Click to Unenroll
                                                    </button>
                                                );
                                            }
                                            return (
                                                <button
                                                    onClick={() => handleEnroll(course._id)}
                                                    disabled={!isOpen || isFull}
                                                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                                                >
                                                    {!isOpen ? `Course ${course.status}` : isFull ? "Course Full" : "Enroll Now"}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}