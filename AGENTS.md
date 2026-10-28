<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store ratings are validated through the shared store-ratings helper and loaded from Google Places only in authenticated store-save flows; public pages never issue per-store Maps requests, avoiding fabricated scores and public API fan-out.
- Location picking uses a full-screen dialog with Google Maps native gestures; document touch behavior stays unrestricted so horizontal map dragging works on phones.
- Device geolocation is requested on explicit user actions, independently of delivery quotes, with distinct permission errors and a lower-accuracy timeout fallback.
- The native Android app is a Capacitor shell (`capacitor.config.ts`, `www/`, `android/`) that loads the published site URL via `server.url`; content changes never require an APK rebuild. Regenerate native files with `bunx cap sync android`; icons/splash come from `assets/` via `@capacitor/assets generate --android`.
- Android release bundles use an upload keystore supplied through `ANDROID_UPLOAD_KEYSTORE` and `ANDROID_UPLOAD_KEY_PASSWORD`; release tasks fail without these values so no unsigned or debug-signed store build is delivered. Never commit signing credentials or keystores.
