import { NextRequest, NextResponse } from "next/server";
import { verifyMainAdminAuth } from "@/lib/authMiddleware";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

/**
 * 🔒 GET: Fetch all users for Co-Admin management (Main Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyMainAdminAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("uid email name role allowedAdminTabs createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, users });

  } catch (error: any) {
    console.error("Co-Admin Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * 🔒 POST: Update user role and allowed admin tabs (Main Admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyMainAdminAuth(req);
    if (authResult.errorResponse) return authResult.errorResponse;

    const { targetUserId, role, allowedAdminTabs } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Target User ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const targetUser = await User.findOne({ _id: targetUserId });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Protect Main Admin from being downgraded
    if (targetUser.email === "jkdewasi961096@gmail.com") {
      return NextResponse.json({ success: false, error: "Main Admin role cannot be modified!" }, { status: 400 });
    }

    const validRoles = ["user", "student", "admin", "co-admin"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid role specified" }, { status: 400 });
    }

    if (role) targetUser.role = role;
    if (Array.isArray(allowedAdminTabs)) targetUser.allowedAdminTabs = allowedAdminTabs;

    await targetUser.save();

    return NextResponse.json({ 
      success: true, 
      message: `User permissions updated successfully!`,
      user: {
        _id: targetUser._id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        allowedAdminTabs: targetUser.allowedAdminTabs
      }
    });

  } catch (error: any) {
    console.error("Co-Admin Update Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
