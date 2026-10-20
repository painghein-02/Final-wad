import { NextResponse } from "next/server";
import { getClientPromise } from "@/lib/mongodb";
import bcryptjs from "bcryptjs";
import corsHeaders from "@/lib/cors";

// Handle CORS preflight
export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST() {
    try {
        const client = await getClientPromise();
        const db = client.db();

        // Clear existing users to avoid duplicates
        await db.collection("users").deleteMany({});

        // Hash the default password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash("password123", salt);

        const users = [
            { username: "teacher1", email: "t1@test.com", password: hashedPassword, role: "Teacher" },
            { username: "teacher2", email: "t2@test.com", password: hashedPassword, role: "Teacher" },
            { username: "teacher3", email: "t3@test.com", password: hashedPassword, role: "Teacher" },
            { username: "student1", email: "s1@test.com", password: hashedPassword, role: "Student" },
            { username: "student2", email: "s2@test.com", password: hashedPassword, role: "Student" },
            { username: "student3", email: "s3@test.com", password: hashedPassword, role: "Student" },
        ];

        await db.collection("users").insertMany(users);

        return NextResponse.json({
            message: "Database seeded successfully!",
            testCredentials: "All users have the password 'password123'"
        }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: "Failed to seed database" }, { status: 500, headers: corsHeaders });
    }
}