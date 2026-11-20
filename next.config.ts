import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const common = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];
    return [
      // Everything except the embed widget refuses to be framed (clickjacking protection).
      { source: '/((?!embed).*)', headers: [...common, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" }] },
      { source: '/embed', headers: [...common, { key: 'Content-Security-Policy', value: 'frame-ancestors *' }] },
    ];
  },
};

export default nextConfig;
