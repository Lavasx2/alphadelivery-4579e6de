# Roadmap

## Current — Android location update
- [x] Declare foreground location permissions and increment Android version
- [ ] Validate location behavior and release signatures
- [ ] Deliver updated APK and AAB signed with the existing upload key

## Current — Google Play first release
- [x] Build and validate a release-signed AAB with a dedicated upload key
- [x] Deliver the bundle and Arabic publishing checklist; retain encrypted upload-key backup in private project metadata

## Current — Phone location picker
- [ ] Full-screen map selection with one-finger dragging
- [ ] Explicit device permission request and actionable location errors
- [ ] Verify non-Maps interactions and location tests (live Maps requires authorized origin)

## Open — Uploaded upgraded edition
- [ ] Merge upgraded interface, translations, theme, recovery and tracking while preserving current integrations and data
- [ ] Adapt report moderation and trusted checkout to existing account/device safety schema
- [ ] Verify imported screens and critical flows

## Done
- [x] Link managed Google Maps Platform connection (verified: home map renders, no console errors)
- [x] Clarify multi-vendor platform requirements with user

## Open — Alpha Delivery multi-vendor build (build everything)
- [x] DB migration: stores (+owner, slug, colors, hours, location, approval status), store_categories, store_products, store_subscriptions (annual), courier_subscriptions (monthly), orders.store_id
- [x] Seed Crust Tebessa as first approved store with its menu
- [x] Alpha Delivery branding on home/shell (awaiting user logo)
- [x] Home page: directory of approved stores, search + filter
- [x] /store/$slug: dynamic-theme store page (same design as current home), menu + cart + order flow per store
- [x] Onboarding wizard: store data, colors with live preview, image uploads, menu builder; submits for approval
- [x] Site-owner panel: approve/reject store applications, subscriptions
- [x] Store-owner dashboard: own store orders, menu management
- [x] Courier board: all-store order feed, accept/deliver, monthly subscription status
- [x] Order flow: store gets order for prep; couriers notified with pickup (store) + delivery (customer) info; cash payment

## Open — Brand, localization, safety, and analytics
- [x] Add persistent light/dark switch and Algeria-wide delivery selection
- [ ] Replace yellow/black styling with the approved white, magenta, coral, and violet Alpha palette
- [ ] Complete Arabic, English, and French translations, including editable store and menu names
- [x] Rename the site-owner area to “Dashboard” in every supported language
- [x] Add forgot-password and public reset-password flows
- [x] Remove coordinate fields from store registration while retaining map-based location selection
- [x] Let assigned couriers report customers from an order
- [x] Let the site owner review reports and ban/unban the customer account and device; retain IP only as private evidence
- [x] Add owner analytics for top stores and products by wilaya
- [ ] Verify public, courier, store-owner, and site-owner screens on desktop and mobile
