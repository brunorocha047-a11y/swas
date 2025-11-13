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
import { ChevronRight } from 'lucide-react';

const storyBrandSchema = z.object({
  character: z.string().min(1, 'Personagem é obrigatório'),
  problem: z.string().min(1, 'Problema é obrigatório'),
  guide: z.string().min(1, 'Guia é obrigatório'),
  plan: z.string().min(1, 'Plano é obrigatório'),
  callToAction: z.string().min(1, 'Call-to-Action é obrigatório'),
  successOutcome: z.string().min(1, 'Resultado de sucesso é obrigatório'),
  failureOutcome: z.string().min(1, 'Resultado de fracasso é obrigatório'),
});

type StoryBrandFormData = z.infer<typeof storyBrandSchema>;

interface StoryBrandFormProps {
  projectId: string;
  initialData?: Partial<StoryBrandFormData>;
  onSubmit?: (data: StoryBrandFormData) => Promise<void>;
}

const steps = [
  {
    number: 1,
    title: 'Personagem',
    field: 'character',
    description: 'Quem é o protagonista? (seu cliente)',
  },
  {
    number: 2,
    title: 'Problema',
    field: 'problem',
    description: 'Qual é o problema que o personagem enfrenta?',
  },
  {
    number: 3,
    title: 'Guia',
    field: 'guide',
    description: 'Você é o guia que ajuda a resolver o problema',
  },
  {
    number: 4,
    title: 'Plano',
    field: 'plan',
    description: 'Qual é o plano para resolver o problema?',
  },
  {
    number: 5,
    title: 'Call-to-Action',
    field: 'callToAction',
    description: 'O que você quer que o cliente faça?',
  },
  {
    number: 6,
    title: 'Resultado de Sucesso',
    field: 'successOutcome',
    description: 'O que o cliente ganha ao seguir seu plano?',
  },
  {
    number: 7,
    title: 'Resultado de Fracasso',
    field: 'failureOutcome',
    description: 'O que o cliente perde se não agir?',
  },
];

export function StoryBrandForm({ projectId, initialData, onSubmit }: StoryBrandFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<StoryBrandFormData>({
    resolver: zodResolver(storyBrandSchema),
    defaultValues: initialData || {
      character: '',
      problem: '',
      guide: '',
      plan: '',
      callToAction: '',
      successOutcome: '',
      failureOutcome: '',
    },
  });

  const handleSubmit = async (data: StoryBrandFormData) => {
    try {
      setIsLoading(true);
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Chamada padrão para a API
        const response = await fetch(`/api/v1/project/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storyBrandScript: JSON.stringify(data),
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao salvar StoryBrand Script');
        }

        toast.success('StoryBrand Script salvo com sucesso!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setIsLoading(false);
    }
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>StoryBrand - 7 Passos</CardTitle>
        <CardDescription>
          Passo {currentStep + 1} de {steps.length}: {step.title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Step Content */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name={step.field as keyof StoryBrandFormData}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">{step.title}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={step.description}
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{step.description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={isFirstStep}
              >
                Anterior
              </Button>

              {isLastStep ? (
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar StoryBrand'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
