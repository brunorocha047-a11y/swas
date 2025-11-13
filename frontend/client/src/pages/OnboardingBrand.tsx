import { BrandStoryCanvas } from '@/components/BrandStoryCanvas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'wouter';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function OnboardingBrand() {
  const params = useParams();
  const projectId = params?.projectId || '';
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchMapeamento = async () => {
      try {
        const response = await fetch(`/api/v1/mapeamento/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setInitialData(data.mapeamento);
        }
      } catch (error) {
        console.error('Erro ao buscar mapeamento:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapeamento();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Onboarding - Brand Story Canvas</h1>
          <p className="text-gray-600">
            Defina a identidade visual e sonora da sua marca. Este é o primeiro passo para criar uma estratégia de
            marketing poderosa.
          </p>
        </div>

        <BrandStoryCanvas projectId={projectId} initialData={initialData} />

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Brand Archetype:</strong> Escolha um dos 12 arquétipos de marca (The Hero, The Sage, The Lover,
              etc.) que melhor representa sua marca.
            </p>
            <p>
              <strong>Brand Beliefs:</strong> Descreva os valores fundamentais e crenças que guiam sua marca.
            </p>
            <p>
              <strong>Visual Icon:</strong> Defina o ícone visual que representa sua marca (logo, símbolo, etc.).
            </p>
            <p>
              <strong>Sonic Icon:</strong> Defina o som característico da sua marca (jingle, som de notificação, etc.).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
