// Attach to asith.cc/files/* only after the domain is proxied by Cloudflare.
// WAF/rate limiting runs at the edge; this Worker adds response controls.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (!url.pathname.toLowerCase().endsWith('.pdf')) return fetch(request);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    const upstream = await fetch(request, { cf: { cacheTtl: 0, cacheEverything: false } });
    const response = new Response(upstream.body, upstream);
    response.headers.set('X-Robots-Tag', 'noindex, noarchive, nosnippet');
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Content-Disposition', 'inline; filename="Asith-Wijenayake-Resume.pdf"');
    return response;
  }
};
