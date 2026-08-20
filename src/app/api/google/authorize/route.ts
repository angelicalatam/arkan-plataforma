import { NextResponse, type NextRequest } from "next/server";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_SCOPES,
  isGoogleConfigured,
  googleRedirectUri,
} from "@/lib/google/config";

export async function GET(request: NextRequest) {
  if (!isGoogleConfigured) {
    return NextResponse.redirect(new URL("/configuracion?google=noconfig", request.url));
  }
  const origin = request.nextUrl.origin;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: googleRedirectUri(origin),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  });
  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
