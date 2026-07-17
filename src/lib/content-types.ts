/**
 * Tipos y metadatos para **Bitácora de contenido** y **Wishlist**
 * (libros, películas, series, podcasts, cursos…).
 */

export type ContentType = "book" | "movie" | "series" | "podcast" | "article" | "course" | "other";
export type ContentStatus = "pending" | "in_progress" | "completed";
export type Recommend = "yes" | "no" | "maybe";

export type ContentLogItem = {
  id: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  startDate: string | null;
  endDate: string | null;
  rating: number | null;
  genre: string;
  platform: string;
  notes: string;
  keyLearnings: string;
  recommend: Recommend | null;
  tags: string[];
  progressPercent: number;
  currentPosition: string;
  createdAt: string;
  updatedAt: string;
};

export type WishlistType = "book" | "movie" | "series" | "podcast" | "course" | "product" | "other";
export type WishPriority = "high" | "medium" | "low";
export type WishReason = "recommendation" | "personal" | "work" | "other";

export type WishlistItem = {
  id: string;
  title: string;
  itemType: WishlistType;
  priority: WishPriority;
  reason: WishReason;
  source: string;
  notes: string;
  tags: string[];
  remindAt: string | null;
  purchased: boolean;
  createdAt: string;
  updatedAt: string;
};

export const CONTENT_META: Record<ContentType, { label: string; emoji: string }> = {
  book: { label: "Libro", emoji: "📚" },
  movie: { label: "Película", emoji: "🎬" },
  series: { label: "Serie", emoji: "📺" },
  podcast: { label: "Podcast", emoji: "🎙️" },
  article: { label: "Artículo", emoji: "📰" },
  course: { label: "Curso", emoji: "🎓" },
  other: { label: "Otro", emoji: "✨" },
};

export const WISH_META: Record<WishlistType, { label: string; emoji: string }> = {
  book: { label: "Libro", emoji: "📚" },
  movie: { label: "Película", emoji: "🎬" },
  series: { label: "Serie", emoji: "📺" },
  podcast: { label: "Podcast", emoji: "🎙️" },
  course: { label: "Curso", emoji: "🎓" },
  product: { label: "Producto", emoji: "🛍️" },
  other: { label: "Otro", emoji: "✨" },
};

export const STATUS_META: Record<ContentStatus, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "oklch(0.75 0.05 240)" },
  in_progress: { label: "En progreso", color: "oklch(0.75 0.18 70)" },
  completed: { label: "Terminado", color: "oklch(0.75 0.18 150)" },
};

export const PRIORITY_META: Record<WishPriority, { label: string; color: string }> = {
  high: { label: "Alta", color: "oklch(0.7 0.22 25)" },
  medium: { label: "Media", color: "oklch(0.78 0.18 70)" },
  low: { label: "Baja", color: "oklch(0.7 0.1 240)" },
};
