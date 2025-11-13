import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { ZapierWebhookConfig } from '@/components/ZapierWebhookConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function AdminTenantConfig() {
  const params = useParams();
  const tenantId = params?.id || '';
  const [isLoading, setIsLoading] = useState(true);
  const [tenantConfig, setTenantConfig] = useState<any>(null);

  useEffect(() => {
    if (!tenantId) return;

    const fetchTenantConfig = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/tenant-config`);
        if (response.ok) {
          const data = await response.json();
          setTenantConfig(data);
        }
      } catch (error) {
        console.error('Erro ao buscar configuração do tenant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenantConfig();
  }, [tenantId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuração do Tenant</h1>
          <p className="text-gray-600">Gerencie as configurações de integração e automação</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Zapier Webhook Configuration */}
          <ZapierWebhookConfig
            tenantId={tenantId}
            initialUrl={tenantConfig?.zapierPublishWebhookUrl}
          />

          {/* Additional Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Tenant</CardTitle>
              <CardDescription>Detalhes da sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">ID do Tenant</p>
                  <p className="font-mono text-sm text-gray-900">{tenantId}</p>
                </div>

                {tenantConfig?.aaEmbedUrl && (
                  <div>
                    <p className="text-sm text-gray-600">AgencyAnalytics Embed URL</p>
                    <p className="font-mono text-xs text-gray-900 break-all">
                      {tenantConfig.aaEmbedUrl}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold mb-1">Integrações Suportadas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Zapier (recomendado)</li>
                  <li>Make (anteriormente Integromat)</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold mb-1">Fluxo de Publicação:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Conteúdo é aprovado no MAGMA-OS</li>
                  <li>Webhook é enviado para o Zapier</li>
                  <li>Zapier publica nas redes sociais (Buffer, ContentStudio, etc.)</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold mb-1">Contato de Suporte:</p>
                <p>Para dúvidas, entre em contato com suporte@magma-os.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
