import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { Beaker } from 'lucide-react';

const abTestLogSchema = z.object({
  hypothesis: z.string().min(1, 'Hipótese é obrigatória'),
  setup: z.string().optional(),
  result: z.string().optional(),
});

type AbTestLogFormData = z.infer<typeof abTestLogSchema>;

interface AbTestLogFormProps {
  projectId: string;
  onSuccess?: () => void;
}

export function AbTestLogForm({ projectId, onSuccess }: AbTestLogFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AbTestLogFormData>({
    resolver: zodResolver(abTestLogSchema),
    defaultValues: {
      hypothesis: '',
      setup: '',
      result: '',
    },
  });

  const handleSubmit = async (data: AbTestLogFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}/ab-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar teste A/B');
      }

      toast.success('Teste A/B registrado com sucesso!');
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-blue-600" />
          <div>
            <CardTitle>Log de Testes A/B</CardTitle>
            <CardDescription>Registre hipóteses e resultados de testes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hypothesis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hipótese</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: CTA A vs CTA B, Título longo vs curto"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Descreva brevemente o que está sendo testado</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setup do Teste (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva como o teste foi configurado, grupos de controle, duração, etc."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Qual foi o resultado? Qual variante venceu? Qual foi o impacto?"
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Salvando...' : 'Registrar Teste A/B'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
