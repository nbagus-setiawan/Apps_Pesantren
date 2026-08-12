/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // API Laravel dipanggil langsung dari server-side (route handlers) atau
  // client-side lewat NEXT_PUBLIC_API_URL. Tidak ada rewrite/proxy di sini
  // supaya perilaku dev & prod konsisten.
};

module.exports = nextConfig;
