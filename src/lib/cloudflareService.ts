export interface CloudflareStatus {
  success: boolean;
  isCloudflare: boolean;
  detectedNetwork: string;
  clientIp: string;
  cfRay: string | null;
  cfCountry: string | null;
  cfVisitor: string | null;
  protocol: string;
  headers: Record<string, string | null>;
  features: {
    trustProxyEnabled: boolean;
    spaRedirectsConfigured: boolean;
    edgeCorsActive: boolean;
    wranglerPagesReady: boolean;
  };
  quickGuides: {
    pagesDeployCmd: string;
    tunnelRunCmd: string;
  };
}

export class CloudflareService {
  /**
   * Memeriksa status edge dan reverse proxy Cloudflare saat ini
   */
  static async checkStatus(): Promise<CloudflareStatus | null> {
    try {
      const res = await fetch('/api/cloudflare/status');
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (e) {
      console.warn('Gagal mengambil status Cloudflare:', e);
      return null;
    }
  }

  /**
   * Salin skrip konfigurasi Cloudflare Tunnel (config.yml)
   */
  static getTunnelConfigYaml(domainName: string = 'guru.sekolah.sch.id'): string {
    return `tunnel: <UUID_TUNNEL_ANDA>
credentials-file: /root/.cloudflared/<UUID_TUNNEL_ANDA>.json

ingress:
  - hostname: ${domainName}
    service: http://localhost:3000
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
  - service: http_status:404
`;
  }
}
