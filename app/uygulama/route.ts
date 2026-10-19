import { renderLanding } from "./document";

// An independent HTML document avoids changing the site's shared layout.
// No account, database access, client bundle or additional dependency is needed.
export function GET() {
  return new Response(
    renderLanding({
      appStore: process.env.AMERIKALA_APP_STORE_URL,
      googlePlay: process.env.AMERIKALA_GOOGLE_PLAY_URL,
    }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  );
}
