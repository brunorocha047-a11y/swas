import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface ContentPiece {
  id: string;
  status: string;
  format?: string;
  aiDraftV1?: string;
  bodyText?: string;
  brief: {
    title: string;
    primaryKeyword?: string;
  };
}

interface ContentBrief {
  id: string;
  title: string;
  contentPieces: ContentPiece[];
}

interface ContentKanbanProps {
  projectId: string;
}

const STATUS_COLUMNS = [
  { key: 'BACKLOG', label: 'Backlog' },
  { key: 'BRIEFING', label: 'Briefing' },
  { key: 'PILAR_EM_REVISAO', label: 'Pilar em Revisão' },
  { key: 'PILAR_APROVADO', label: 'Pilar Aprovado' },
  { key: 'SATELITE_EM_REVISAO', label: 'Satélite em Revisão' },
  { key: 'APROVADO', label: 'Aprovado' },
];

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: 'bg-gray-100 text-gray-800',
  BRIEFING: 'bg-blue-100 text-blue-800',
  PILAR_EM_REVISAO: 'bg-yellow-100 text-yellow-800',
  PILAR_APROVADO: 'bg-green-100 text-green-800',
  SATELITE_EM_REVISAO: 'bg-purple-100 text-purple-800',
  APROVADO: 'bg-emerald-100 text-emerald-800',
  PUBLICADO: 'bg-slate-100 text-slate-800',
};

export function ContentKanban({ projectId }: ContentKanbanProps) {
  const [briefs, setBriefs] = useState<ContentBrief[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentPiece | null>(null);

  useEffect(() => {
    fetchContentPieces();
  }, [projectId]);

  const fetchContentPieces = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/content-pieces/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setBriefs(data.briefs || []);
      } else {
        toast.error('Erro ao carregar conteúdos');
      }
    } catch (error) {
      toast.error('Erro ao carregar conteúdos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePilar = async (contentPieceId: string) => {
    try {
      setGeneratingId(contentPieceId);
      const response = await fetch(`/api/v1/content-pieces/${contentPieceId}/generate-pilar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success('Conteúdo pilar gerado com sucesso!');
        await fetchContentPieces();
      } else {
        toast.error('Erro ao gerar conteúdo pilar');
      }
    } catch (error) {
      toast.error('Erro ao gerar conteúdo pilar');
      console.error(error);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleUpdateStatus = async (contentPieceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/v1/content-pieces/${contentPieceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Status atualizado para ${newStatus}`);
        await fetchContentPieces();
      } else {
        toast.error('Erro ao atualizar status');
      }
    } catch (error) {
      toast.error('Erro ao atualizar status');
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

  // Reorganizar conteúdos por status
  const contentByStatus: Record<string, ContentPiece[]> = {};
  STATUS_COLUMNS.forEach((col) => {
    contentByStatus[col.key] = [];
  });

  briefs.forEach((brief) => {
    brief.contentPieces.forEach((piece) => {
      if (contentByStatus[piece.status]) {
        contentByStatus[piece.status].push(piece);
      }
    });
  });

  return (
    <div className="w-full h-full bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Factory - Kanban</h1>
        <p className="text-gray-600">Gerencie a produção de conteúdo com IA e aprovação manual</p>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-6 min-w-max">
          {STATUS_COLUMNS.map((column) => (
            <div key={column.key} className="flex-shrink-0 w-80">
              <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
                {/* Column Header */}
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">{column.label}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {contentByStatus[column.key].length} itens
                  </p>
                </div>

                {/* Column Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {contentByStatus[column.key].length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">Nenhum conteúdo</p>
                    </div>
                  ) : (
                    contentByStatus[column.key].map((piece) => (
                      <Card
                        key={piece.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedContent(piece)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="font-medium text-sm text-gray-900 flex-1">
                                {piece.brief.title}
                              </p>
                              <Badge className={STATUS_COLORS[piece.status] || 'bg-gray-100'}>
                                {piece.status}
                              </Badge>
                            </div>

                            {piece.format && (
                              <p className="text-xs text-gray-500">{piece.format}</p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                              {piece.status === 'BACKLOG' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGeneratePilar(piece.id);
                                  }}
                                  disabled={generatingId === piece.id}
                                  className="flex-1 text-xs"
                                >
                                  {generatingId === piece.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Zap className="w-3 h-3 mr-1" />
                                  )}
                                  Gerar
                                </Button>
                              )}

                              {piece.status === 'PILAR_EM_REVISAO' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(piece.id, 'PILAR_APROVADO');
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Aprovar
                                </Button>
                              )}

                              {piece.status === 'SATELITE_EM_REVISAO' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(piece.id, 'APROVADO');
                                  }}
                                  className="flex-1 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Aprovar
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedContent(piece);
                                }}
                                className="text-xs"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Preview Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedContent.brief.title}</CardTitle>
                  <CardDescription>{selectedContent.format}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedContent(null)}
                  className="text-xl"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedContent.aiDraftV1 && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-2">Rascunho da IA</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedContent.aiDraftV1}
                  </div>
                </div>
              )}

              {selectedContent.bodyText && (
                <div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-2">Conteúdo Aprovado</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedContent.bodyText}
                  </div>
                </div>
              )}

              {!selectedContent.aiDraftV1 && !selectedContent.bodyText && (
                <p className="text-sm text-gray-500">Nenhum conteúdo disponível</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
