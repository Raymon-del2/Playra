const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f3a8ff"/>
      <stop offset="100%" stop-color="#6c6bff"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="12" fill="url(#g)"/>
  <path d="M18 38l8-12 10 14 6-8 4 6" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="20" cy="46" r="4" fill="#fff"/>
  <circle cx="32" cy="46" r="4" fill="#fff"/>
  <circle cx="44" cy="46" r="4" fill="#fff"/>
</svg>
`;

export const GET = () =>
  new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
