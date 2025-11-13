import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Wrench, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

interface PilarOptimizationCardProps {
  pilar: Pilar;
  projectId: string;
  onStatusChange?: (pilarId: string, newStatus: string) => Promise<void>;
}

const STATUS_CONFIG = {
  ATIVO: {
    icon: CheckCircle,
    label: 'Ativo',
    color: 'bg-green-100 text-green-800',
    description: 'Gerando conteúdo regularmente',
  },
  OTIMIZANDO: {
    icon: Wrench,
    label: 'Otimizando',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Em teste e análise',
  },
  ELIMINADO: {
    icon: Trash2,
    label: 'Eliminado',
    color: 'bg-red-100 text-red-800',
    description: 'Não gera mais conteúdo',
  },
};

export function PilarOptimizationCard({
  pilar,
  projectId,
  onStatusChange,
}: PilarOptimizationCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const config = STATUS_CONFIG[pilar.status];
  const Icon = config.icon;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsLoading(true);
      if (onStatusChange) {
        await onStatusChange(pilar.id, newStatus);
      } else {
        // Chamada padrão para a API
        const response = await fetch(`/api/v1/pilares/${pilar.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar status');
        }
      }

      toast.success(`Pilar atualizado para ${newStatus}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estatísticas
  const totalBriefs = pilar.contentBriefs?.length || 0;
  const totalPieces = pilar.contentBriefs?.reduce(
    (sum, brief) => sum + (brief.contentPieces?.length || 0),
    0
  ) || 0;
  const approvedPieces = pilar.contentBriefs?.reduce(
    (sum, brief) =>
      sum + (brief.contentPieces?.filter((p) => p.status === 'APROVADO').length || 0),
    0
  ) || 0;

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{pilar.name}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <Badge className={config.color}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Briefings</p>
            <p className="text-2xl font-bold text-gray-900">{totalBriefs}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Peças Totais</p>
            <p className="text-2xl font-bold text-gray-900">{totalPieces}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Aprovadas</p>
            <p className="text-2xl font-bold text-green-600">{approvedPieces}</p>
          </div>
        </div>

        {/* Topic Clusters */}
        {pilar.topicClusters && pilar.topicClusters.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Tópicos</p>
            <div className="flex flex-wrap gap-2">
              {pilar.topicClusters.map((cluster) => (
                <Badge key={cluster.id} variant="outline">
                  {cluster.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {pilar.status !== 'ATIVO' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('ATIVO')}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <CheckCircle className="w-3 h-3 mr-1" />
              )}
              Repetir
            </Button>
          )}

          {pilar.status !== 'OTIMIZANDO' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('OTIMIZANDO')}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Wrench className="w-3 h-3 mr-1" />
              )}
              Otimizar
            </Button>
          )}

          {pilar.status !== 'ELIMINADO' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange('ELIMINADO')}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-3 h-3 mr-1" />
              )}
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
