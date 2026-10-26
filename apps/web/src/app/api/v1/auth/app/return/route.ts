import { NextResponse } from "next/server";
import { appDeepLink } from "../../../../../../auth/app-sign-in";
import { env } from "../../../../../../env";

/** Hand the Android app's sign-in result back to the app (see `APP_RETURN_PATH`
 *  in `app-sign-in.ts`). The page tries to open the app at once, and keeps a
 *  button for browsers that only open an app from a tap. */
export const GET = (request: Request): Response => {
  const link = appDeepLink(new URL(request.url).searchParams);
  return link === undefined
    ? NextResponse.redirect(new URL("/login?error=auth", env.AUTH_PROXY_URL))
    : new NextResponse(returnPage(link), {
        headers: {
          "cache-control": "no-store",
          "content-type": "text/html; charset=utf-8",
          "referrer-policy": "no-referrer",
        },
      });
};

const returnPage = (link: string): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Titan</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0d10;color:#e8eaed;font:16px system-ui,sans-serif}
a{display:inline-block;padding:14px 28px;border-radius:999px;background:#e8eaed;color:#0b0d10;font-weight:600;text-decoration:none}
</style>
</head>
<body>
<main><a id="open" href="${link}">Return to Titan</a></main>
<script>location.replace(document.getElementById("open").href)</script>
</body>
</html>
`;
