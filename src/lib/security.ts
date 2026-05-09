import { NextRequest, NextResponse } from "next/server";

export function csrfCheck(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) return null;

  const sourceUrl = origin ?? referer;
  if (sourceUrl && !sourceUrl.startsWith(appUrl)) {
    return NextResponse.json(
      { error: "CSRF шалгалт амжилтгүй" },
      { status: 403 }
    );
  }

  return null;
}
