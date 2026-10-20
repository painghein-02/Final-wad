//src/app/api/course/route.js

import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import { successResponse, errorResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";
import { X_HEADER_USER_ID, X_HEADER_USER_ROLE } from "@/lib/constant";

// Helper function to attach CORS headers to any response
function withCors(response) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    return response;
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
    try {
        const userId = request.headers.get(X_HEADER_USER_ID);
        const userRole = request.headers.get(X_HEADER_USER_ROLE);

        const client = await getClientPromise();
        const db = client.db();

        let query = {};

        if (userRole === "Teacher") {
            // Teachers only see their own courses
            query = { teacherId: userId };
        } else if (userRole === "Student") {
            // Students see all courses except canceled ones
            query = { status: { $ne: "Cancel" } };
        } else {
            return withCors(errorResponse("Unauthorized role", 403));
        }

        const courses = await db.collection("courses").find(query).toArray();

        return withCors(successResponse({ data: courses }, 200));
    } catch (error) {
        return withCors(errorResponse("Failed to fetch courses", 500));
    }
}

export async function POST(request) {
    try {
        const userId = request.headers.get(X_HEADER_USER_ID);
        const userRole = request.headers.get(X_HEADER_USER_ROLE);

        // Business Rule: Only authenticated Teachers can create courses
        if (userRole !== "Teacher") {
            return withCors(errorResponse("Only teachers can create courses", 403));
        }

        const body = await request.json();
        const { name, duration, topics, price, maxStudent, status = "Open" } = body;

        if (!name || !duration || !price || !maxStudent) {
            return withCors(errorResponse("Missing required fields", 400));
        }

        const client = await getClientPromise();
        const db = client.db();

        const newCourse = {
            name,
            duration: Number(duration),
            topics: Array.isArray(topics) ? topics : [topics],
            price: Number(price),
            maxStudent: Number(maxStudent),
            status, // Open, Close, Cancel
            teacherId: userId, // Bind ownership to the creator
            enrolledStudents: [], // Initialize empty enrollment array
            createdAt: new Date(),
        };

        const result = await db.collection("courses").insertOne(newCourse);

        return withCors(successResponse({ ...newCourse, _id: result.insertedId }, 201));
    } catch (error) {
        return withCors(errorResponse("Failed to create course", 500));
    }
}