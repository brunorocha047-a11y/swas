import { AudienceIntelligence } from '@/components/AudienceIntelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'wouter';
import { useState, useEffect } from 'react';

export default function OnboardingAudience() {
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
          if (data.mapeamento?.personas) {
            setInitialData({ personas: data.mapeamento.personas });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar personas:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Onboarding - Audience Intelligence</h1>
          <p className="text-gray-600">
            Defina as personas do seu público-alvo. Entender quem são seus clientes é fundamental para uma estratégia
            de marketing eficaz.
          </p>
        </div>

        <AudienceIntelligence projectId={projectId} initialData={initialData} />

        <Card className="mt-8 bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg">Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Nome da Persona:</strong> Crie um nome fictício que represente esse tipo de cliente.
            </p>
            <p>
              <strong>Job-To-Be-Done:</strong> Qual é o trabalho que essa persona precisa fazer? O que ela quer
              alcançar?
            </p>
            <p>
              <strong>Nível de Consciência:</strong> 1 = Não sabe que tem um problema, 5 = Já conhece soluções
              disponíveis.
            </p>
            <p>
              <strong>Motivador Principal:</strong> O que motiva essa persona? Competição, benefício pessoal,
              inspiração?
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
