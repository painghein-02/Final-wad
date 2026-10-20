//src/app/api/auth/logout/route.js

import { successResponse } from "@/lib/utils";
import corsHeaders from "@/lib/cors";
import { NextResponse } from "next/server";

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST() {
    const res = successResponse({ message: "Logout successful" }, 200);

    // Clear the cookie by setting its expiration date to the past
    res.cookies.set("token", "", {
        httpOnly: true,
        path: "/",
        expires: new Date(0)
    });

    return res;
}