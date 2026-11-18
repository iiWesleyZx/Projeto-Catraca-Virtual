import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Catraca Virtual",
    short_name: "Catraca Virtual",
    description:
      "Sistema de monitoramento em tempo real e métricas de movimentação de pessoas.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#090d16",
    theme_color: "#090d16",
    lang: "pt-BR",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
