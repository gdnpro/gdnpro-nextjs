export interface Preload {
  as: string
  href: string
  type: string
  rel?: "preload" | "prefetch"
  crossorigin?: "anonymous" | "use-credentials"
}
