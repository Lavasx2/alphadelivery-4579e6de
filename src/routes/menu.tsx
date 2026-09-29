import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL — Crust Tebessa now lives at its own store page.
export const Route = createFileRoute("/menu")({
  beforeLoad: () => {
    throw redirect({ to: "/store/$slug", params: { slug: "crust" } });
  },
});
