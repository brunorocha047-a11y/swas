import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { PilarOptimizationCard } from '@/components/PilarOptimizationCard';
import { AbTestLogForm } from '@/components/AbTestLogForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Pilar {
  id: string;
  name: string;
  status: 'ATIVO' | 'OTIMIZANDO' | 'ELIMINADO';
  topicClusters?: Array<{ id: string; name: string }>;
  contentBriefs?: Array<{
    id: string;
    title: string;
    contentPieces: Array<{ id: string; status: string }>;
  }>;
}

export default function Optimization() {
  const params = useParams();
  const projectId = params?.projectId || '';
  const [isLoading, setIsLoading] = useState(true);
  const [pilares, setPilares] = useState<Pilar[]>([]);
  const [stats, setStats] = useState({
    activeCount: 0,
    optimizingCount: 0,
    eliminatedCount: 0,
  });

  useEffect(() => {
    if (!projectId) return;
    fetchPilares();
  }, [projectId]);

  const fetchPilares = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}/pilares`);
      if (response.ok) {
        const data = await response.json();
        setPilares(data.pilares || []);
        setStats({
          activeCount: data.activeCount || 0,
          optimizingCount: data.optimizingCount || 0,
          eliminatedCount: data.eliminatedCount || 0,
        });
      } else {
        toast.error('Erro ao carregar pilares');
      }
    } catch (error) {
      toast.error('Erro ao carregar pilares');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (pilarId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/v1/pilares/${pilarId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchPilares();
        toast.success(`Pilar atualizado para ${newStatus}`);
      } else {
        toast.error('Erro ao atualizar pilar');
      }
    } catch (error) {
      toast.error('Erro ao atualizar pilar');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const activePilares = pilares.filter((p) => p.status === 'ATIVO');
  const optimizingPilares = pilares.filter((p) => p.status === 'OTIMIZANDO');
  const eliminatedPilares = pilares.filter((p) => p.status === 'ELIMINADO');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Loop de Otimização</h1>
          </div>
          <p className="text-gray-600">
            Analise o desempenho dos seus pilares estratégicos e tome decisões que impactam a
            geração de conteúdo
          </p>
        </div>

        {/* Alert de Informação */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <p className="font-semibold mb-1">Como funciona:</p>
            <p className="text-sm">
              Pilares com status <strong>ATIVO</strong> ou <strong>OTIMIZANDO</strong> continuarão
              gerando conteúdo. Pilares <strong>ELIMINADOS</strong> não gerarão mais conteúdo. Suas
              decisões aqui impactam diretamente a próxima geração de conteúdo no Módulo 3.
            </p>
          </AlertDescription>
        </Alert>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Pilares Ativos</p>
                <p className="text-4xl font-bold text-green-600">{stats.activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Em Otimização</p>
                <p className="text-4xl font-bold text-yellow-600">{stats.optimizingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Eliminados</p>
                <p className="text-4xl font-bold text-red-600">{stats.eliminatedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pilares Grid */}
        <div className="space-y-8">
          {/* Pilares Ativos */}
          {activePilares.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pilares Ativos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePilares.map((pilar) => (
                  <PilarOptimizationCard
                    key={pilar.id}
                    pilar={pilar}
                    projectId={projectId}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pilares em Otimização */}
          {optimizingPilares.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Em Otimização</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optimizingPilares.map((pilar) => (
                  <PilarOptimizationCard
                    key={pilar.id}
                    pilar={pilar}
                    projectId={projectId}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pilares Eliminados */}
          {eliminatedPilares.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Eliminados</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eliminatedPilares.map((pilar) => (
                  <PilarOptimizationCard
                    key={pilar.id}
                    pilar={pilar}
                    projectId={projectId}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* A/B Testing Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <AbTestLogForm projectId={projectId} onSuccess={fetchPilares} />
        </div>

        {/* Empty State */}
        {pilares.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-gray-600 mb-2">Nenhum pilar encontrado</p>
              <p className="text-sm text-gray-500">
                Crie pilares estratégicos no Módulo 2 para começar a otimizar
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
