import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isSessionValid } from "@/lib/auth/session";

/** Blocks every page and API route until the visitor has signed in at /login. */
export async function proxy(request: NextRequest) {
  if (await isSessionValid(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Everything except the login page, Next internals and static files in /public.
  matcher: ["/((?!login|_next/static|_next/image|favicon\.ico|.*\.(?:png|jpe?g|webp|svg|gif|ico|glb|json|mp4|woff2?)$).*)"],
};
