//src/app/api/auth/login/route.js

import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { getClientPromise } from "@/lib/mongodb";
import corsHeaders from "@/lib/cors";
import { NextResponse } from "next/server";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
    try {
        console.log("1. Login request received");

        // Check if secrets are loaded
        if (!process.env.JWT_SECRET) {
            console.error("CRITICAL: JWT_SECRET is missing from .env");
            throw new Error("Missing JWT_SECRET");
        }
        if (!process.env.MONGODB_URI) {
            console.error("CRITICAL: MONGODB_URI is missing from .env");
            throw new Error("Missing MONGODB_URI");
        }

        console.log("2. Parsing body...");
        const body = await req.json();
        const { username, password } = body;
        console.log("3. Body parsed, username:", username);

        console.log("4. Connecting to DB...");
        const client = await getClientPromise();
        const db = client.db();

        console.log("5. Searching for user...");
        const user = await db.collection("users").findOne({ username });

        if (!user) {
            console.log("6. User not found");
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401, headers: corsHeaders });
        }

        console.log("7. Comparing passwords...");
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            console.log("8. Password mismatch");
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401, headers: corsHeaders });
        }

        console.log("9. Signing JWT...");
        const token = jwt.sign(
            { id: user._id, username: user.username, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        console.log("10. Creating success response...");
        const res = NextResponse.json({
            message: "Login successful",
            user: { id: user._id, username: user.username, email: user.email, role: user.role }
        }, { status: 200, headers: corsHeaders });

        res.cookies.set("token", token, { httpOnly: true, path: "/" });

        console.log("11. Done!");
        return res;

    } catch (error) {
        console.error("=== FATAL LOGIN ERROR ===");
        console.error(error.message);
        console.error("=========================");

        return NextResponse.json(
            { message: "Internal server error: " + error.message },
            { status: 500, headers: corsHeaders }
        );
    }
}