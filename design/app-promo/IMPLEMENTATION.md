# App promotion landing implementation

New URL: `/uygulama`. Existing files and the current `/` homepage are preserved.

The route returns a complete HTML document, so the existing root layout, navigation, authentication providers, language button and footer are not rendered. There is no client JavaScript, account flow or data fetching. It uses the existing `/logo.png` and the transparent phone concept WebP included in this change.

## Store links

Set `AMERIKALA_APP_STORE_URL` and `AMERIKALA_GOOGLE_PLAY_URL` to verified public app listings in the deployment environment. HTTPS URLs are restricted to `apps.apple.com` and `play.google.com`, with app listing path validation. Missing or invalid destinations show noninteractive **Yakında** tiles instead of broken download buttons. No placeholder store URLs or QR codes are shipped.

The current illustration is concept artwork, visibly captioned as a representative view. Replace it with approved actual app screenshots when available. The page does not claim that these are captured screens.

Legal and support links reuse `/privacy` and `/support`. There is no terms link because no matching terms page was found.

To use this design at `/` in the future, a separate explicitly approved change to the existing homepage or hosting routing is necessary. This change does not alter that routing.
