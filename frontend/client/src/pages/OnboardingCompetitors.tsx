import { CompetitiveLandscape } from '@/components/CompetitiveLandscape';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'wouter';
import { useState, useEffect } from 'react';

export default function OnboardingCompetitors() {
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
          setInitialData({
            competitors: data.mapeamento?.competitors,
            gapAnalysis: data.mapeamento?.gapAnalysis,
          });
        }
      } catch (error) {
        console.error('Erro ao buscar competitive landscape:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Onboarding - Competitive Landscape</h1>
          <p className="text-gray-600">
            Analise seus concorrentes e identifique as lacunas no mercado. Isso ajudará a posicionar sua marca de forma
            única.
          </p>
        </div>

        <CompetitiveLandscape projectId={projectId} initialData={initialData} />

        <Card className="mt-8 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg">Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Concorrentes:</strong> Liste seus principais concorrentes e descreva o que os diferencia. Qual é
              a proposta de valor de cada um?
            </p>
            <p>
              <strong>Gap Analysis:</strong> Identifique as lacunas no mercado. O que seus concorrentes não estão
              fazendo? Qual é a oportunidade?
            </p>
            <p>
              <strong>Posicionamento:</strong> Como você pode se diferenciar? Qual é sua vantagem competitiva única?
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
