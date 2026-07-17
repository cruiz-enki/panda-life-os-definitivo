/**
 * **Ruta** — Lista de deseos (libros, pelis, productos…).
 */
import { createFileRoute } from "@tanstack/react-router";
import { WishlistPage } from "@/features/wishlist/parts";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist · Panda's LIFE OS" },
      { name: "description", content: "Lo que quieres leer, ver, escuchar o comprar." },
    ],
  }),
  component: WishlistPage,
});
