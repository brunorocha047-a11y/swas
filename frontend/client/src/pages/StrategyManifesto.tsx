import { ManifestoEditor } from '@/components/ManifestoEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'wouter';
import { useState, useEffect } from 'react';

export default function StrategyManifesto() {
  const params = useParams();
  const projectId = params?.projectId || '';
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (!projectId) return;

    // Em um cenário real, você buscaria o manifesto do projeto
    // Por enquanto, apenas carregamos com dados vazios
    setIsLoading(false);
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Estratégia - Brand Manifesto</h1>
          <p className="text-gray-600">
            Escreva o manifesto que define os valores, a missão e a visão da sua marca. Um manifesto forte comunica o
            propósito da sua marca de forma clara e inspiradora.
          </p>
        </div>

        <ManifestoEditor projectId={projectId} initialData={initialData} />

        <Card className="mt-8 bg-indigo-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg">Elementos de um Bom Manifesto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div>
              <p className="font-semibold">Missão:</p>
              <p>Por que sua marca existe? Qual é o propósito fundamental?</p>
            </div>
            <div>
              <p className="font-semibold">Visão:</p>
              <p>Qual é o futuro que você quer criar? Onde você quer chegar?</p>
            </div>
            <div>
              <p className="font-semibold">Valores:</p>
              <p>Quais são os princípios que guiam suas decisões e ações?</p>
            </div>
            <div>
              <p className="font-semibold">Diferencial:</p>
              <p>O que torna sua marca única e diferente dos concorrentes?</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
