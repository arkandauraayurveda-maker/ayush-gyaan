import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import connectToDatabase from "@/lib/mongodb";
import User, { IUser } from "@/models/User";

export interface AuthenticatedRequestData {
  uid: string;
  email: string;
  user: IUser;
}

/**
 * Verifies Firebase ID Token from Authorization header (Bearer token)
 * and verifies that the authenticated user has the required role (e.g. 'admin').
 */
export async function verifyAdminAuth(req: NextRequest): Promise<{ errorResponse?: NextResponse; authData?: AuthenticatedRequestData }> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "Unauthorized access: Bearer token missing" },
          { status: 401 }
        )
      };
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    await connectToDatabase();
    const user = await User.findOne({ uid: decodedToken.uid });

    if (!user) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "User not found in system" },
          { status: 404 }
        )
      };
    }

    if (user.role !== "admin") {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "Forbidden: Admin privileges required" },
          { status: 403 }
        )
      };
    }

    return {
      authData: {
        uid: decodedToken.uid,
        email: decodedToken.email || user.email,
        user
      }
    };
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    console.error("Admin Authentication Error:", errObj.message || error);
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Invalid or expired authorization token" },
        { status: 401 }
      )
    };
  }
}

/**
 * Verifies Firebase ID Token from Authorization header for any authenticated user.
 */
export async function verifyUserAuth(req: NextRequest): Promise<{ errorResponse?: NextResponse; authData?: AuthenticatedRequestData }> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "Unauthorized access: Bearer token missing" },
          { status: 401 }
        )
      };
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    await connectToDatabase();
    const user = await User.findOne({ uid: decodedToken.uid });

    if (!user) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "User not found in system" },
          { status: 404 }
        )
      };
    }

    return {
      authData: {
        uid: decodedToken.uid,
        email: decodedToken.email || user.email,
        user
      }
    };
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    console.error("User Authentication Error:", errObj.message || error);
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Invalid or expired authorization token" },
        { status: 401 }
      )
    };
  }
}
