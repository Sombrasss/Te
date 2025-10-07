// proxy.js
export async function handler(event, context) {
  try {
    const params = new URLSearchParams(event.rawQuery);
    const target = params.get('url');
    if (!target) {
      return {
        statusCode: 400,
        body: 'Falta o parâmetro ?url='
      };
    }

    const res = await fetch(target, { redirect: 'follow' });
    const contentType = res.headers.get('content-type') || '';

    // se não for HTML, apenas retransmite
    if (!contentType.includes('text/html')) {
      const arrayBuffer = await res.arrayBuffer();
      const base64Body = Buffer.from(arrayBuffer).toString('base64');
      const headers = Object.fromEntries(res.headers.entries());
      delete headers['x-frame-options'];
      delete headers['content-security-policy'];

      return {
        statusCode: res.status,
        headers,
        body: base64Body,
        isBase64Encoded: true
      };
    }

    let html = await res.text();

    // remove scripts e anúncios
    html = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^>]*(ads|advert|doubleclick|adservice|adzerk|adsystem)[^>]*>[\s\S]*?<\/iframe>/gi, '')
      .replace(/\son\w+="[^"]*"/gi, '')
      .replace(/\b(class|id)=["'][^"']*(ads|banner|sponsor|promo|ad-)[^"']*["']/gi, '');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      body: html
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: 'Erro: ' + err.message
    };
  }
}