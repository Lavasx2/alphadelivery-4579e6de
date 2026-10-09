# Roadmap

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
- [ ] Add persistent light/dark switch and Algeria-wide delivery selection
- [ ] Replace yellow/black styling with the approved white, magenta, coral, and violet Alpha palette
- [ ] Complete Arabic, English, and French translations, including editable store and menu names
- [ ] Rename the site-owner area to “Dashboard” in every supported language
- [ ] Add forgot-password and public reset-password flows
- [ ] Remove coordinate fields from store registration while retaining map-based location selection
- [ ] Let assigned couriers report customers from an order
- [ ] Let the site owner review reports and ban/unban the customer account and device; retain IP only as private evidence
- [ ] Add owner analytics for top stores and products by wilaya
- [ ] Verify public, courier, store-owner, and site-owner screens on desktop and mobile
