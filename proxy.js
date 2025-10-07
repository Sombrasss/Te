// proxy.js
export async function handler(event, context) {
  try {
    const url = new URL(event.rawUrl);
    const target = url.searchParams.get('url');
    if (!target) return new Response('Falta o parâmetro ?url=', { status: 400 });

    const res = await fetch(target, { redirect: 'follow' });
    const contentType = res.headers.get('content-type') || '';

    // se não for HTML, apenas retransmite
    if (!contentType.includes('text/html')) {
      const headers = new Headers(res.headers);
      headers.delete('x-frame-options');
      headers.delete('content-security-policy');
      return new Response(res.body, { status: res.status, headers });
    }

    let html = await res.text();

    // remove anúncios e scripts
    html = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^>]*(ads|advert|doubleclick|adservice|adzerk|adsystem)[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\b(class|id)=["'][^"']*(ads|banner|sponsor|promo|ad-)[^"']*["']/gi, '');

    const headersOut = new Headers();
    headersOut.set('Content-Type', 'text/html; charset=utf-8');
    headersOut.set('Cache-Control', 'no-store');

    return new Response(html, { status: 200, headers: headersOut });
  } catch (err) {
    return new Response('Erro: ' + err.message, { status: 500 });
  }
}