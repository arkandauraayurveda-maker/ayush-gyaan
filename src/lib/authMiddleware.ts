import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import connectToDatabase from "@/lib/mongodb";
import User, { IUser } from "@/models/User";

export interface AuthenticatedRequestData {
  uid: string;
  email: string;
  user: IUser;
  isMainAdmin: boolean;
}

const MAIN_ADMIN_EMAIL = "jkdewasi961096@gmail.com";

/**
 * 🔒 Strictly verifies Main Admin (Super Admin) - jkdewasi961096@gmail.com
 */
export async function verifyMainAdminAuth(req: NextRequest): Promise<{ errorResponse?: NextResponse; authData?: AuthenticatedRequestData }> {
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

    if (decodedToken.email !== MAIN_ADMIN_EMAIL) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "Forbidden: Super Admin privileges required" },
          { status: 403 }
        )
      };
    }

    await connectToDatabase();
    let user = await User.findOne({ uid: decodedToken.uid });

    if (!user) {
      user = new User({
        uid: decodedToken.uid,
        email: decodedToken.email || MAIN_ADMIN_EMAIL,
        name: "Main Admin",
        role: "admin",
        isOnboarded: true,
        aiPlan: { tier: 'pro', tokens: 99999 }
      });
      await user.save();
    }

    return {
      authData: {
        uid: decodedToken.uid,
        email: decodedToken.email || MAIN_ADMIN_EMAIL,
        user,
        isMainAdmin: true
      }
    };
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    console.error("Main Admin Auth Error:", errObj.message || error);
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Invalid or expired authorization token" },
        { status: 401 }
      )
    };
  }
}

/**
 * 🔒 Verifies Admin/Co-Admin access with optional granular tab checking.
 */
export async function verifyAdminAuth(
  req: NextRequest, 
  requiredTabKey?: string
): Promise<{ errorResponse?: NextResponse; authData?: AuthenticatedRequestData }> {
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
    let user = await User.findOne({ uid: decodedToken.uid });

    const isMainAdmin = decodedToken.email === MAIN_ADMIN_EMAIL || user?.email === MAIN_ADMIN_EMAIL;

    if (!user && isMainAdmin) {
      user = new User({
        uid: decodedToken.uid,
        email: decodedToken.email || MAIN_ADMIN_EMAIL,
        name: "Main Admin",
        role: "admin",
        isOnboarded: true,
        aiPlan: { tier: 'pro', tokens: 99999 }
      });
      await user.save();
    }

    if (!user) {
      return {
        errorResponse: NextResponse.json(
          { success: false, error: "User account not found" },
          { status: 404 }
        )
      };
    }

    // 1. Main Admin -> Full access to all tabs
    if (isMainAdmin) {
      return {
        authData: {
          uid: decodedToken.uid,
          email: decodedToken.email || user.email,
          user,
          isMainAdmin: true
        }
      };
    }

    // 2. Co-Admin Check
    if (user.role === "co-admin") {
      if (requiredTabKey) {
        const allowed = user.allowedAdminTabs || [];
        if (!allowed.includes(requiredTabKey)) {
          return {
            errorResponse: NextResponse.json(
              { success: false, error: `Access Denied: You do not have permission to access the '${requiredTabKey}' section.` },
              { status: 403 }
            )
          };
        }
      }

      return {
        authData: {
          uid: decodedToken.uid,
          email: decodedToken.email || user.email,
          user,
          isMainAdmin: false
        }
      };
    }

    // 3. Regular Admin Check
    if (user.role === "admin") {
      return {
        authData: {
          uid: decodedToken.uid,
          email: decodedToken.email || user.email,
          user,
          isMainAdmin: false
        }
      };
    }

    // 4. Default: Forbidden
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Forbidden: Admin or Co-Admin privileges required" },
        { status: 403 }
      )
    };

  } catch (error: unknown) {
    const errObj = error as { message?: string };
    console.error("Admin Auth Error:", errObj.message || error);
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Invalid or expired authorization token" },
        { status: 401 }
      )
    };
  }
}

/**
 * 🔒 Verifies Firebase ID Token for any authenticated user.
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

    const isMainAdmin = decodedToken.email === MAIN_ADMIN_EMAIL || user.email === MAIN_ADMIN_EMAIL;

    return {
      authData: {
        uid: decodedToken.uid,
        email: decodedToken.email || user.email,
        user,
        isMainAdmin
      }
    };
  } catch (error: unknown) {
    const errObj = error as { message?: string };
    console.error("User Auth Error:", errObj.message || error);
    return {
      errorResponse: NextResponse.json(
        { success: false, error: "Invalid or expired authorization token" },
        { status: 401 }
      )
    };
  }
}
