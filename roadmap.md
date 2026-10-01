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
