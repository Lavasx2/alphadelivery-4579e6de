# Roadmap

## Done
- [x] Link managed Google Maps Platform connection to the remixed project (verified: home page map renders with browser key, no console errors)

## Open
- [ ] Multi-vendor platform transformation (user-uploads spec) — BLOCKED ON ANSWERS:
  1. Transform this project (Crust Tebessa becomes the first store) vs start a fresh project?
  2. Store onboarding: auto-activate after wizard, or require owner approval first?
  3. Platform commission on orders (none / % / flat fee)?
  4. Build scope: everything at once, or phased (DB + store pages → driver network → onboarding wizard)?

### Planned work once decided
- [ ] DB restructure: stores (profile, colors, slug, hours), products/categories per store, orders → store_id, drivers unified (not per-store), store onboarding state
- [ ] Store onboarding wizard (data, colors w/ live preview, logo/banner/product image upload, menu builder)
- [ ] Auto-generated store page at /store/:slug using same design as original store page with dynamic theme
- [ ] Home page: list/search/filter active stores
- [ ] Unified driver network: drivers see all orders from all stores; new-order notifications for nearby drivers
- [ ] Order flow: store owner sees own orders; couriers see pickup (store location) + delivery (customer) details
