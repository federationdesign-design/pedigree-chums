import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pedigree Chums™: The Dog Bingo Game",
    short_name: "Dog Bingo",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fff8e6",
    theme_color: "#1497d6",
  };
}
