import { StoryBrandForm } from '@/components/StoryBrandForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'wouter';
import { useState, useEffect } from 'react';

export default function StrategyStoryBrand() {
  const params = useParams();
  const projectId = params?.projectId || '';
  const [isLoading, setIsLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (!projectId) return;

    // Em um cenário real, você buscaria o script StoryBrand do projeto
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Estratégia - StoryBrand (7 Passos)</h1>
          <p className="text-gray-600">
            Crie uma narrativa poderosa para sua marca seguindo o framework de 7 passos do StoryBrand. Isso ajudará a
            comunicar sua mensagem de forma clara e memorável.
          </p>
        </div>

        <StoryBrandForm projectId={projectId} initialData={initialData} />

        <Card className="mt-8 bg-rose-50 border-rose-200">
          <CardHeader>
            <CardTitle className="text-lg">Os 7 Passos do StoryBrand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="flex gap-3">
              <div className="font-bold text-rose-600 min-w-6">1.</div>
              <div>
                <p className="font-semibold">Personagem:</p>
                <p>Seu cliente é o herói, não você. Defina quem é o protagonista da história.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-rose-600 min-w-6">2.</div>
              <div>
                <p className="font-semibold">Problema:</p>
                <p>Qual é o problema que o personagem enfrenta? Qual é a dor que você resolve?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-rose-600 min-w-6">3.</div>
              <div>
                <p className="font-semibold">Guia:</p>
                <p>Você é o guia experiente que ajuda o personagem a resolver o problema.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-rose-600 min-w-6">4.</div>
              <div>
                <p className="font-semibold">Plano:</p>
                <p>Qual é o plano concreto para resolver o problema? Quais são os passos?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-rose-600 min-w-6">5.</div>
              <div>
                <p className="font-semibold">Call-to-Action:</p>
                <p>O que você quer que o cliente faça? Qual é a ação que você solicita?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-rose-600 min-w-6">6.</div>
              <div>
                <p className="font-semibold">Resultado de Sucesso:</p>
                <p>O que o cliente ganha ao seguir seu plano? Qual é a vida melhor que ele terá?</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="font-bold text-rose-600 min-w-6">7.</div>
              <div>
                <p className="font-semibold">Resultado de Fracasso:</p>
                <p>O que o cliente perde se não agir? Qual é o custo de não resolver o problema?</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
