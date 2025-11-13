import { useForm, useFieldArray } from 'react-hook-form';
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
import { Trash2, Plus } from 'lucide-react';

const personaSchema = z.object({
  name: z.string().min(1, 'Nome da persona é obrigatório'),
  jtbd: z.string().min(1, 'Job-To-Be-Done é obrigatório'),
  awarenessLevel: z.number().int().min(1).max(5, 'Nível de consciência deve estar entre 1 e 5'),
  primaryMotivator: z.string().optional(),
});

const audienceIntelligenceSchema = z.object({
  personas: z.array(personaSchema).min(1, 'Adicione pelo menos uma persona'),
});

type AudienceIntelligenceFormData = z.infer<typeof audienceIntelligenceSchema>;

interface AudienceIntelligenceProps {
  projectId: string;
  initialData?: Partial<AudienceIntelligenceFormData>;
  onSubmit?: (data: AudienceIntelligenceFormData) => Promise<void>;
}

export function AudienceIntelligence({ projectId, initialData, onSubmit }: AudienceIntelligenceProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<AudienceIntelligenceFormData>({
    resolver: zodResolver(audienceIntelligenceSchema),
    defaultValues: initialData || {
      personas: [
        {
          name: '',
          jtbd: '',
          awarenessLevel: 3,
          primaryMotivator: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'personas',
  });

  const handleSubmit = async (data: AudienceIntelligenceFormData) => {
    try {
      setIsLoading(true);
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Chamada padrão para a API
        const response = await fetch(`/api/v1/mapeamento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, personas: data.personas }),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar Audience Intelligence');
        }

        toast.success('Audience Intelligence salvo com sucesso!');
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
        <CardTitle>Audience Intelligence</CardTitle>
        <CardDescription>Defina as personas e o nível de consciência do seu público</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4 border-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`personas.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Persona</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: CEO de startup tech" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`personas.${index}.jtbd`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job-To-Be-Done</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Qual é o trabalho que essa persona precisa fazer?" {...field} />
                          </FormControl>
                          <FormDescription>Descreva o objetivo principal dessa persona</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`personas.${index}.awarenessLevel`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Consciência (1-5)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="5"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>1 = Problema desconhecido, 5 = Solução conhecida</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`personas.${index}.primaryMotivator`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivador Principal</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Competição, Benefício, Inspiração" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover Persona
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  name: '',
                  jtbd: '',
                  awarenessLevel: 3,
                  primaryMotivator: '',
                })
              }
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Persona
            </Button>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Salvando...' : 'Salvar Audience Intelligence'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
