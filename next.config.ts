import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.pexels.com" }],
    domains: ["res.cloudinary.com", "media.licdn.com", "cdn.www.gob.pe", "blog.continental.edu.pe", "www.elumbreras.com.pe"],

  },

  /* config options here */
};

export default nextConfig;
