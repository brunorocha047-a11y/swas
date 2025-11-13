import { PillarEditor } from '@/components/PillarEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'wouter';
import { useState, useEffect } from 'react';

export default function StrategyPillars() {
  const params = useParams();
  const projectId = params?.projectId || '';
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchPilares = async () => {
      try {
        const response = await fetch(`/api/v1/pilares/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.pilares && data.pilares.length > 0) {
            setInitialData({ pillars: data.pilares });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar pilares:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPilares();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Estratégia - Pilares</h1>
          <p className="text-gray-600">
            Defina os pilares estratégicos da sua marca e os tópicos associados a cada um. Estes pilares serão a base
            para sua estratégia de conteúdo.
          </p>
        </div>

        <PillarEditor projectId={projectId} initialData={initialData} />

        <Card className="mt-8 bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg">O que são Pilares?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Pilares Estratégicos:</strong> São os temas principais que definem a estratégia de conteúdo da
              sua marca. Cada pilar deve representar um aspecto importante do seu negócio ou expertise.
            </p>
            <p>
              <strong>Topic Clusters:</strong> São os subtemas dentro de cada pilar. Cada cluster representa um tópico
              específico que será explorado em seus conteúdos.
            </p>
            <p>
              <strong>Exemplo:</strong> Se seu pilar é "Marketing Digital", os clusters podem ser "SEO", "Social Media",
              "Email Marketing", etc.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
