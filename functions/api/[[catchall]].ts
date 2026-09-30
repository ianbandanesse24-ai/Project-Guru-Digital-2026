// Cloudflare Pages Functions API Handler
// Menangani seluruh rute /api/* secara native di Cloudflare Edge Workers

interface Env {
  GEMINI_API_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  GITHUB_TOKEN?: string;
}

type PagesFunction<T = any> = (context: {
  request: Request;
  env: T;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, any>;
}) => Promise<Response> | Response;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, Prefer, X-Client-Info, CF-Connecting-IP, CF-Ray',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, Prefer, X-Client-Info, CF-Connecting-IP, CF-Ray',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Health Check
    if (pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          appName: 'ADMINISTRASI GURU KREATIF',
          edge: 'Cloudflare Pages Functions',
          timestamp: new Date().toISOString(),
          aiReady: Boolean(env.GEMINI_API_KEY),
        }),
        { headers: corsHeaders }
      );
    }

    // 2. Cloudflare Status
    if (pathname === '/api/cloudflare/status') {
      const cf = (request as any).cf || {};
      const cfRay = request.headers.get('cf-ray');
      const cfConnectingIp = request.headers.get('cf-connecting-ip');
      const cfCountry = request.headers.get('cf-ipcountry') || cf.country;

      return new Response(
        JSON.stringify({
          success: true,
          isCloudflare: true,
          detectedNetwork: 'Cloudflare Global Anycast Edge (Pages Functions)',
          clientIp: cfConnectingIp || 'Edge Client',
          cfRay,
          cfCountry,
          colo: cf.colo,
          httpProtocol: cf.httpProtocol,
          features: {
            trustProxyEnabled: true,
            spaRedirectsConfigured: true,
            edgeCorsActive: true,
            wranglerPagesReady: true,
          },
        }),
        { headers: corsHeaders }
      );
    }

    // 3. Supabase Transparent Proxy
    if (pathname === '/api/supabase/proxy' && request.method === 'POST') {
      const body = await request.json() as any;
      const targetUrl = body.url;

      if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('https://')) {
        return new Response(JSON.stringify({ error: 'URL target tidak valid' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      const parsedUrl = new URL(targetUrl);
      if (!parsedUrl.hostname.endsWith('supabase.co')) {
        return new Response(JSON.stringify({ error: 'Proxy hanya diizinkan untuk domain supabase.co' }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      const fetchOptions: RequestInit = {
        method: (body.method || 'GET').toUpperCase(),
        headers: body.headers || {},
      };

      if (body.body && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method || '')) {
        fetchOptions.body = typeof body.body === 'string' ? body.body : JSON.stringify(body.body);
      }

      try {
        const response = await fetch(targetUrl, {
          method: (body.method || 'GET').toUpperCase(),
          headers: body.headers || {},
          body: body.body && ['POST', 'PUT', 'PATCH'].includes((body.method || '').toUpperCase())
            ? (typeof body.body === 'string' ? body.body : JSON.stringify(body.body))
            : undefined,
        });
        const textData = await response.text();

        const resHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => {
          resHeaders[k] = v;
        });

        return new Response(
          JSON.stringify({
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders,
            body: textData,
          }),
          { headers: corsHeaders }
        );
      } catch (fetchErr: any) {
        const hostname = parsedUrl.hostname;
        const msg = `Domain Supabase "${hostname}" tidak dapat dijangkau di Edge Network. Pastikan project Supabase aktif.`;
        return new Response(
          JSON.stringify({
            ok: false,
            status: 502,
            error: msg,
            body: JSON.stringify({ message: msg, error: msg }),
          }),
          { status: 502, headers: corsHeaders }
        );
      }
    }

    // 4. Supabase Connection Test
    if (pathname === '/api/supabase/test-connection' && request.method === 'POST') {
      const startTime = Date.now();
      const body = await request.json() as any;
      const targetUrl = (body.url || env.VITE_SUPABASE_URL || 'https://phbrqacielziyyzxntdn.supabase.co').trim();
      const key = (body.apiKey || env.VITE_SUPABASE_ANON_KEY || '').trim();

      if (!targetUrl || !key) {
        return new Response(
          JSON.stringify({ success: false, message: 'URL dan API Key Supabase belum lengkap' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const endpoint = `${targetUrl.replace(/\/$/, '')}/rest/v1/school_profile?select=id&limit=1`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      const latencyMs = Date.now() - startTime;
      const text = await response.text();

      if (!response.ok) {
        let parsedError: any = null;
        try { parsedError = JSON.parse(text); } catch {}
        const msg = parsedError?.message || text;

        if (
          response.status === 404 ||
          msg.includes('does not exist') ||
          msg.includes('relation "public.school_profile" does not exist') ||
          parsedError?.code === 'PGRST204' ||
          parsedError?.code === '42P01'
        ) {
          return new Response(
            JSON.stringify({
              success: true,
              latencyMs,
              tableExists: false,
              message: `Terhubung ke Supabase Edge (${latencyMs}ms)! Skema tabel database belum dibuat. Silakan salin & jalankan Skrip SQL di Supabase SQL Editor.`,
            }),
            { headers: corsHeaders }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            latencyMs,
            message: `Koneksi ditolak Supabase: ${msg}`,
          }),
          { status: response.status, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          latencyMs,
          tableExists: true,
          message: `Koneksi ke Supabase Cloud berhasil aktif dan terverifikasi di Cloudflare Edge (${latencyMs}ms)!`,
        }),
        { headers: corsHeaders }
      );
    }

    // 5. GitHub Test Connection
    if (pathname === '/api/github/test-connection' && request.method === 'POST') {
      const startTime = Date.now();
      const body = await request.json() as any;
      const repoOwner = (body.owner || '').trim();
      const repoName = (body.repo || '').trim();
      const patToken = (body.token || env.GITHUB_TOKEN || '').trim();

      if (!repoOwner || !repoName) {
        return new Response(
          JSON.stringify({ success: false, message: 'Username/Owner dan Nama Repository GitHub wajib diisi' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'E-Project-Guru-Digital/1.0',
      };
      if (patToken) {
        headers['Authorization'] = `Bearer ${patToken}`;
      }

      const ghRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}`, {
        method: 'GET',
        headers,
      });

      const latencyMs = Date.now() - startTime;
      const data = await ghRes.json() as any;

      if (!ghRes.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            latencyMs,
            message: ghRes.status === 404
              ? `Repository "${repoOwner}/${repoName}" tidak ditemukan di GitHub.`
              : `Koneksi GitHub gagal (${ghRes.status}): ${data.message || 'Error'}`,
          }),
          { status: ghRes.status, headers: corsHeaders }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          latencyMs,
          repoUrl: data.html_url,
          defaultBranch: data.default_branch || 'main',
          isPrivate: data.private,
          message: `Terhubung ke GitHub Edge: ${data.full_name} (${data.private ? 'Private' : 'Public'}, branch: ${data.default_branch})`,
        }),
        { headers: corsHeaders }
      );
    }

    // Default 404 for unknown APIs
    return new Response(
      JSON.stringify({ error: `API endpoint ${pathname} not found` }),
      { status: 404, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal Cloudflare Edge Error' }),
      { status: 500, headers: corsHeaders }
    );
  }
};
