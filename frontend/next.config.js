const withPWA = require("@ducanh2912/next-pwa").default;
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {},
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
  },
};

module.exports = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
