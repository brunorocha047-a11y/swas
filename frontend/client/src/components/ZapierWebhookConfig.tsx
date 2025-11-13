import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { HelpCircle, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const zapierWebhookSchema = z.object({
  zapierPublishWebhookUrl: z
    .string()
    .url('URL inválida')
    .refine(
      (url) =>
        url.startsWith('https://hooks.zapier.com/') || url.startsWith('https://hooks.make.com/'),
      'URL deve ser um webhook válido do Zapier (https://hooks.zapier.com/) ou Make (https://hooks.make.com/)'
    ),
});

type ZapierWebhookFormData = z.infer<typeof zapierWebhookSchema>;

interface ZapierWebhookConfigProps {
  tenantId: string;
  initialUrl?: string;
  onSave?: (url: string) => Promise<void>;
}

export function ZapierWebhookConfig({
  tenantId,
  initialUrl,
  onSave,
}: ZapierWebhookConfigProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<ZapierWebhookFormData>({
    resolver: zodResolver(zapierWebhookSchema),
    defaultValues: {
      zapierPublishWebhookUrl: initialUrl || '',
    },
  });

  const handleSubmit = async (data: ZapierWebhookFormData) => {
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(data.zapierPublishWebhookUrl);
      } else {
        // Chamada padrão para a API
        const response = await fetch(`/api/v1/tenant-config`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zapierPublishWebhookUrl: data.zapierPublishWebhookUrl,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar configuração');
        }
      }

      toast.success('Webhook URL salvo com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const url = form.getValues('zapierPublishWebhookUrl');

    if (!url) {
      toast.error('Por favor, insira uma URL antes de testar');
      return;
    }

    try {
      setIsTesting(true);
      const response = await fetch(`/api/v1/webhook/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url }),
      });

      if (response.ok) {
        setTestResult('success');
        toast.success('Conexão com webhook testada com sucesso!');
      } else {
        setTestResult('error');
        toast.error('Falha ao conectar com o webhook');
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Erro ao testar conexão');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuração do Webhook Zapier</CardTitle>
        <CardDescription>
          Configure a URL do webhook do Zapier para automação de publicação de conteúdo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert de Instruções */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <p className="font-semibold mb-2">Como configurar:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Acesse sua conta do Zapier</li>
              <li>Crie um novo Zap com "Catch Hook" como trigger</li>
              <li>Copie a URL gerada pelo Zapier</li>
              <li>Cole aqui e clique em "Testar Conexão"</li>
            </ol>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="zapierPublishWebhookUrl"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Webhook URL do Zapier</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Cole aqui o Webhook URL do seu cenário no Zapier que recebe conteúdo
                            aprovado. Deve começar com https://hooks.zapier.com/ ou
                            https://hooks.make.com/
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Input
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL segura (HTTPS) fornecida pelo Zapier ou Make
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Test Result */}
            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-center gap-2 ${
                  testResult === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {testResult === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Conexão com webhook testada com sucesso!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Falha ao conectar com o webhook</span>
                  </>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || !form.getValues('zapierPublishWebhookUrl')}
              >
                {isTesting ? 'Testando...' : 'Testar Conexão'}
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </div>
          </form>
        </Form>

        {/* Informações Adicionais */}
        <Alert className="bg-gray-50 border-gray-200">
          <AlertDescription className="text-gray-700 text-sm">
            <p className="font-semibold mb-2">O que acontece após salvar:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Toda vez que um conteúdo for aprovado, será enviado para este webhook</li>
              <li>O Zapier receberá os dados estruturados do conteúdo</li>
              <li>Você pode configurar ações no Zapier para publicar nas redes sociais</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
