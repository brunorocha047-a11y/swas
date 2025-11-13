import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { useState } from 'react';
import { toast } from 'sonner';

const competitiveLandscapeSchema = z.object({
  competitors: z.string().optional(),
  gapAnalysis: z.string().optional(),
});

type CompetitiveLandscapeFormData = z.infer<typeof competitiveLandscapeSchema>;

interface CompetitiveLandscapeProps {
  projectId: string;
  initialData?: Partial<CompetitiveLandscapeFormData>;
  onSubmit?: (data: CompetitiveLandscapeFormData) => Promise<void>;
}

export function CompetitiveLandscape({ projectId, initialData, onSubmit }: CompetitiveLandscapeProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CompetitiveLandscapeFormData>({
    resolver: zodResolver(competitiveLandscapeSchema),
    defaultValues: initialData || {
      competitors: '',
      gapAnalysis: '',
    },
  });

  const handleSubmit = async (data: CompetitiveLandscapeFormData) => {
    try {
      setIsLoading(true);
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Chamada padrão para a API
        const response = await fetch(`/api/v1/mapeamento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...data }),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar Competitive Landscape');
        }

        toast.success('Competitive Landscape salvo com sucesso!');
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
        <CardTitle>Competitive Landscape</CardTitle>
        <CardDescription>Analise seus concorrentes e identifique lacunas no mercado</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="competitors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concorrentes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Liste seus principais concorrentes e suas características..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Descreva quem são seus concorrentes e o que os diferencia</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gapAnalysis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gap Analysis</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Identifique as lacunas e oportunidades no mercado..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Quais são as oportunidades não exploradas pelos concorrentes?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Salvando...' : 'Salvar Competitive Landscape'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
