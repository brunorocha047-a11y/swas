import { useForm, useFieldArray } from 'react-hook-form';
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
import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

const topicClusterSchema = z.object({
  name: z.string().min(1, 'Nome do cluster é obrigatório'),
});

const pillarSchema = z.object({
  name: z.string().min(1, 'Nome do pilar é obrigatório'),
  topicClusters: z.array(topicClusterSchema).optional(),
});

const pillarEditorSchema = z.object({
  pillars: z.array(pillarSchema).min(1, 'Adicione pelo menos um pilar'),
});

type PillarEditorFormData = z.infer<typeof pillarEditorSchema>;

interface PillarEditorProps {
  projectId: string;
  initialData?: Partial<PillarEditorFormData>;
  onSubmit?: (data: PillarEditorFormData) => Promise<void>;
}

export function PillarEditor({ projectId, initialData, onSubmit }: PillarEditorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PillarEditorFormData>({
    resolver: zodResolver(pillarEditorSchema),
    defaultValues: initialData || {
      pillars: [
        {
          name: '',
          topicClusters: [{ name: '' }],
        },
      ],
    },
  });

  const { fields: pillarFields, append: appendPillar, remove: removePillar } = useFieldArray({
    control: form.control,
    name: 'pillars',
  });

  const handleSubmit = async (data: PillarEditorFormData) => {
    try {
      setIsLoading(true);
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Chamada padrão para a API - criar cada pilar
        for (const pillar of data.pillars) {
          const response = await fetch(`/api/v1/pilares`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              name: pillar.name,
              topicClusters: pillar.topicClusters,
            }),
          });

          if (!response.ok) {
            throw new Error(`Erro ao salvar pilar: ${pillar.name}`);
          }
        }

        toast.success('Pilares salvos com sucesso!');
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
        <CardTitle>Editor de Pilares</CardTitle>
        <CardDescription>Crie pilares estratégicos e seus tópicos associados</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              {pillarFields.map((pillarField, pillarIndex) => (
                <Card key={pillarField.id} className="p-4 border-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`pillars.${pillarIndex}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Pilar</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Inovação, Sustentabilidade..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <TopicClustersField
                      control={form.control}
                      pillarIndex={pillarIndex}
                    />

                    {pillarFields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePillar(pillarIndex)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover Pilar
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
                appendPillar({
                  name: '',
                  topicClusters: [{ name: '' }],
                })
              }
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Pilar
            </Button>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Salvando...' : 'Salvar Pilares'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface TopicClustersFieldProps {
  control: any;
  pillarIndex: number;
}

function TopicClustersField({ control, pillarIndex }: TopicClustersFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `pillars.${pillarIndex}.topicClusters`,
  });

  return (
    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
      <FormLabel>Topic Clusters</FormLabel>
      {fields.map((field, clusterIndex) => (
        <div key={field.id} className="flex gap-2">
          <FormField
            control={control}
            name={`pillars.${pillarIndex}.topicClusters.${clusterIndex}.name`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Ex: Tendências de mercado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(clusterIndex)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => append({ name: '' })}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Cluster
      </Button>
    </div>
  );
}
