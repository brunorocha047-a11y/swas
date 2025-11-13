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
import { useState } from 'react';
import { toast } from 'sonner';

const brandStoryCanvasSchema = z.object({
  brandArchetype: z.string().optional(),
  brandBeliefs: z.string().optional(),
  visualIcon: z.string().optional(),
  sonicIcon: z.string().optional(),
});

type BrandStoryCanvasFormData = z.infer<typeof brandStoryCanvasSchema>;

interface BrandStoryCanvasProps {
  projectId: string;
  initialData?: Partial<BrandStoryCanvasFormData>;
  onSubmit?: (data: BrandStoryCanvasFormData) => Promise<void>;
}

export function BrandStoryCanvas({ projectId, initialData, onSubmit }: BrandStoryCanvasProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BrandStoryCanvasFormData>({
    resolver: zodResolver(brandStoryCanvasSchema),
    defaultValues: initialData || {
      brandArchetype: '',
      brandBeliefs: '',
      visualIcon: '',
      sonicIcon: '',
    },
  });

  const handleSubmit = async (data: BrandStoryCanvasFormData) => {
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
          throw new Error('Erro ao salvar Brand Story Canvas');
        }

        toast.success('Brand Story Canvas salvo com sucesso!');
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
        <CardTitle>Brand Story Canvas</CardTitle>
        <CardDescription>Defina a identidade e os valores da sua marca</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="brandArchetype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Archetype</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: The Hero, The Sage, The Lover..." {...field} />
                  </FormControl>
                  <FormDescription>Qual é o arquétipo da sua marca?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brandBeliefs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Beliefs</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva as crenças e valores da sua marca..." {...field} />
                  </FormControl>
                  <FormDescription>Quais são os valores fundamentais da sua marca?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visualIcon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visual Icon</FormLabel>
                  <FormControl>
                    <Input placeholder="URL da imagem ou descrição do ícone visual..." {...field} />
                  </FormControl>
                  <FormDescription>Qual é o ícone visual que representa sua marca?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sonicIcon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sonic Icon</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do ícone sonoro (jingle, som característico)..." {...field} />
                  </FormControl>
                  <FormDescription>Qual é o ícone sonoro que representa sua marca?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Salvando...' : 'Salvar Brand Story Canvas'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
