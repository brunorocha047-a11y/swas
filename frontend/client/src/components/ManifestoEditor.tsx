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

const manifestoEditorSchema = z.object({
  brandManifesto: z.string().min(1, 'Brand Manifesto é obrigatório'),
});

type ManifestoEditorFormData = z.infer<typeof manifestoEditorSchema>;

interface ManifestoEditorProps {
  projectId: string;
  initialData?: Partial<ManifestoEditorFormData>;
  onSubmit?: (data: ManifestoEditorFormData) => Promise<void>;
}

export function ManifestoEditor({ projectId, initialData, onSubmit }: ManifestoEditorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ManifestoEditorFormData>({
    resolver: zodResolver(manifestoEditorSchema),
    defaultValues: initialData || {
      brandManifesto: '',
    },
  });

  const handleSubmit = async (data: ManifestoEditorFormData) => {
    try {
      setIsLoading(true);
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Chamada padrão para a API
        const response = await fetch(`/api/v1/project/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar Brand Manifesto');
        }

        toast.success('Brand Manifesto salvo com sucesso!');
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
        <CardTitle>Brand Manifesto</CardTitle>
        <CardDescription>Escreva o manifesto que define os valores e a missão da sua marca</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="brandManifesto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Manifesto</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escreva o manifesto da sua marca aqui. Inclua a missão, visão e valores..."
                      className="min-h-64"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Um manifesto forte comunica o propósito e os valores da sua marca de forma clara e inspiradora.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Salvando...' : 'Salvar Brand Manifesto'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
