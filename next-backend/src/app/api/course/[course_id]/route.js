//src/app/api/course/[course_id]/route.js

import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { successResponse, errorResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";
import { X_HEADER_USER_ID, X_HEADER_USER_ROLE } from "@/lib/constant";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request, { params }) {
    try {
        const { course_id } = await params;
        const userId = request.headers.get(X_HEADER_USER_ID);
        const userRole = request.headers.get(X_HEADER_USER_ROLE);

        const client = await getClientPromise();
        const db = client.db();

        const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });

        if (!course) return errorResponse("Course not found", 404);

        // Business Rule: Teacher viewing their own course sees enrolled student details
        if (userRole === "Teacher" && course.teacherId === userId) {
            if (course.enrolledStudents && course.enrolledStudents.length > 0) {
                const studentIds = course.enrolledStudents.map(id => new ObjectId(id));
                const students = await db.collection("users")
                    .find({ _id: { $in: studentIds } })
                    .project({ password: 0 }) // Exclude passwords
                    .toArray();
                course.studentDetails = students;
            } else {
                course.studentDetails = [];
            }
        }

        return successResponse(course, 200);
    } catch (error) {
        return errorResponse("Failed to fetch course details", 500);
    }
}

export async function PUT(request, { params }) {
    try {
        const { course_id } = await params;
        const userId = request.headers.get(X_HEADER_USER_ID);
        const userRole = request.headers.get(X_HEADER_USER_ROLE);

        console.log("[PUT /api/course/:id] userId:", userId, "role:", userRole, "course_id:", course_id);

        if (userRole !== "Teacher") return errorResponse("Only teachers can update courses", 403);

        const body = await request.json();
        const { name, duration, topics, price, maxStudent, status } = body;

        console.log("[PUT /api/course/:id] body:", body);

        const client = await getClientPromise();
        const db = client.db();

        const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });
        if (!course) return errorResponse("Course not found", 404);

        console.log("[PUT /api/course/:id] course.teacherId:", course.teacherId, "userId:", userId, "match:", String(course.teacherId) === String(userId));

        // Business Rule: Teachers can update ONLY their own courses
        if (String(course.teacherId) !== String(userId)) return errorResponse("Unauthorized to update this course", 403);

        const updatedFields = {
            ...(name && { name }),
            ...(duration && { duration: Number(duration) }),
            ...(topics && { topics: Array.isArray(topics) ? topics : [topics] }),
            ...(price !== undefined && { price: Number(price) }),
            ...(maxStudent !== undefined && { maxStudent: Number(maxStudent) }),
            ...(status && { status })
        };

        console.log("[PUT /api/course/:id] updatedFields:", updatedFields);

        const result = await db.collection("courses").updateOne(
            { _id: new ObjectId(course_id) },
            { $set: updatedFields }
        );

        console.log("[PUT /api/course/:id] updateResult:", result.modifiedCount, "docs modified");

        return successResponse({ message: "Course updated successfully" }, 200);
    } catch (error) {
        console.error("[PUT /api/course/:id] ERROR:", error);
        return errorResponse("Failed to update course: " + error.message, 500);
    }
}

export async function DELETE(request, { params }) {
    try {
        const { course_id } = await params;
        const userId = request.headers.get(X_HEADER_USER_ID);
        const userRole = request.headers.get(X_HEADER_USER_ROLE);

        if (userRole !== "Teacher") return errorResponse("Only teachers can delete courses", 403);

        const client = await getClientPromise();
        const db = client.db();

        const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });
        if (!course) return errorResponse("Course not found", 404);

        if (course.teacherId !== userId) return errorResponse("Unauthorized to delete this course", 403);

        // Business Rule: Cannot delete course if students are enrolled
        if (course.enrolledStudents && course.enrolledStudents.length > 0) {
            return errorResponse("Cannot delete course with enrolled students", 400);
        }

        await db.collection("courses").deleteOne({ _id: new ObjectId(course_id) });

        return successResponse({ message: "Course deleted successfully" }, 200);
    } catch (error) {
        return errorResponse("Failed to delete course", 500);
    }
}

// POST — toggles enrollment for students (enroll / unenroll)
export async function POST(request, { params }) {
    try {
        const { course_id } = await params;
        const userId = request.headers.get(X_HEADER_USER_ID);
        const userRole = request.headers.get(X_HEADER_USER_ROLE);

        // Business Rule: Only students can enroll/unenroll
        if (userRole !== "Student") return errorResponse("Only students can enroll in courses", 403);

        const client = await getClientPromise();
        const db = client.db();

        const course = await db.collection("courses").findOne({ _id: new ObjectId(course_id) });
        if (!course) return errorResponse("Course not found", 404);

        const alreadyEnrolled = course.enrolledStudents &&
            course.enrolledStudents.some(id => String(id) === String(userId));

        console.log("[POST enroll] userId from header:", userId);
        console.log("[POST enroll] enrolledStudents:", course.enrolledStudents);
        console.log("[POST enroll] alreadyEnrolled:", alreadyEnrolled);

        if (alreadyEnrolled) {
            // ── UNENROLL — filter out by string comparison to handle ObjectId/string mismatches
            const filtered = course.enrolledStudents.filter(id => String(id) !== String(userId));
            await db.collection("courses").updateOne(
                { _id: new ObjectId(course_id) },
                { $set: { enrolledStudents: filtered } }
            );
            console.log("[POST enroll] → unenrolled, remaining:", filtered.length);
            return successResponse({ message: "You have been successfully unenrolled from this course." }, 200);
        }

        // ── ENROLL ────────────────────────────────────────────────
        // Business Rule: Course must be Open to enroll
        if (course.status !== "Open") return errorResponse("Course is not open for enrollment", 400);

        // Business Rule: Check seat availability
        const currentEnrolled = course.enrolledStudents ? course.enrolledStudents.length : 0;
        if (currentEnrolled >= course.maxStudent) return errorResponse("Course is full", 400);

        await db.collection("courses").updateOne(
            { _id: new ObjectId(course_id) },
            { $push: { enrolledStudents: userId } }
        );

        return successResponse({ message: "You have been successfully enrolled in this course." }, 200);
    } catch (error) {
        return errorResponse("Failed to process enrollment: " + error.message, 500);
    }
}