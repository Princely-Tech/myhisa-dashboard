/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  //   async headers() {
  //     return [
  //       {
  //         source: "/(.*)",
  //         headers: [
  //           {
  //             key: "Content-Security-Policy",
  //             value: `
  //               default-src 'self';
  //               script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""};
  //               style-src 'self' 'unsafe-inline';
  //               img-src 'self' data: https:;
  //               connect-src 'self';
  //               frame-ancestors 'none';
  //             `
  //               .replace(/\s{2,}/g, " ")
  //               .trim(),
  //           },
  //           { key: "X-Frame-Options", value: "DENY" },
  //           { key: "X-Content-Type-Options", value: "nosniff" },
  //           {
  //             key: "Strict-Transport-Security",
  //             value: "max-age=63072000; includeSubDomains; preload",
  //           },
  //         ],
  //       },
  //     ];
  //   },
};

export default nextConfig;
