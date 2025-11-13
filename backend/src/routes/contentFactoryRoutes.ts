import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { generatePilarContent, generateSatelliteContent } from '../lib/ai-content-agent';
import { triggerOutboundWebhook } from '../lib/outboundWebhook';

// Schema de validação para atualização de status
const updateContentStatusSchema = z.object({
  status: z.enum(['BACKLOG', 'BRIEFING', 'IA_GERANDO', 'PILAR_EM_REVISAO', 'PILAR_APROVADO', 'SATELITE_EM_REVISAO', 'APROVADO', 'PUBLICADO']),
});

// Formatos de conteúdo satélite suportados
const SATELLITE_FORMATS = [
  'linkedin_post',
  'instagram_carousel',
  'x_thread',
  'tiktok_script',
  'email_newsletter',
  'blog_post',
  'youtube_script',
  'podcast_outline',
];

/**
 * Gera conteúdo pilar usando IA
 */
async function generatePilarContentHandler(fastify: FastifyInstance, request: any, reply: any) {
  try {
    const { id: contentPieceId } = z.object({ id: z.string().uuid() }).parse(request.params);

    // Buscar o ContentPiece
    const contentPiece = await prisma.contentPiece.findUnique({
      where: { id: contentPieceId },
      include: {
        brief: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!contentPiece) {
      return reply.code(404).send({ error: 'ContentPiece não encontrado' });
    }

    // Verificar se o projeto pertence ao tenant
    if (contentPiece.brief.project.tenantId !== request.tenantId) {
      return reply.code(403).send({ error: 'Acesso negado' });
    }

    // Buscar dados estratégicos
    const mapeamento = await prisma.magmaMapeamento.findUnique({
      where: { projectId: contentPiece.brief.projectId },
    });

    if (!mapeamento) {
      return reply.code(400).send({ error: 'Mapeamento não encontrado para o projeto' });
    }

    // Buscar o pilar associado
    const pilar = await prisma.pilar.findUnique({
      where: { id: contentPiece.brief.pilarId || '' },
    });

    // Preparar dados para geração
    const generationData = {
      brandArchetype: mapeamento.brandArchetype || 'Brand',
      brandBeliefs: mapeamento.brandBeliefs || '',
      personaName: contentPiece.brief.primaryPersona || 'Cliente',
      jtbd: 'Resolver problema estratégico',
      awarenessLevel: contentPiece.brief.awarenessLevel,
      format: contentPiece.format || 'artigo',
      primaryKeyword: contentPiece.brief.primaryKeyword || '',
      cta: contentPiece.brief.cta || 'Saiba mais',
      pilarName: pilar?.name || 'Pilar',
    };

    // Chamar IA para gerar conteúdo
    const aiDraft = await generatePilarContent(generationData);

    // Atualizar ContentPiece com o rascunho
    const updatedPiece = await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: {
        aiDraftV1: aiDraft,
        status: 'PILAR_EM_REVISAO',
      },
    });

    return reply.code(200).send({
      message: 'Conteúdo pilar gerado com sucesso',
      contentPiece: updatedPiece,
    });
  } catch (error) {
    request.log.error(error, 'Erro ao gerar conteúdo pilar');
    return reply.code(500).send({ error: 'Erro ao gerar conteúdo' });
  }
}

/**
 * Atualiza o status de um ContentPiece e dispara ações associadas
 */
async function updateContentStatusHandler(fastify: FastifyInstance, request: any, reply: any) {
  try {
    const { id: contentPieceId } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status } = updateContentStatusSchema.parse(request.body);

    // Buscar o ContentPiece
    const contentPiece = await prisma.contentPiece.findUnique({
      where: { id: contentPieceId },
      include: {
        brief: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!contentPiece) {
      return reply.code(404).send({ error: 'ContentPiece não encontrado' });
    }

    // Verificar se o projeto pertence ao tenant
    if (contentPiece.brief.project.tenantId !== request.tenantId) {
      return reply.code(403).send({ error: 'Acesso negado' });
    }

    // Atualizar status
    const updatedPiece = await prisma.contentPiece.update({
      where: { id: contentPieceId },
      data: { status },
    });

    // Se o status foi atualizado para APROVADO, disparar webhook de saída
    if (status === 'APROVADO') {
      // Disparar webhook assincronamente (sem aguardar)
      triggerOutboundWebhook(contentPieceId).catch((error) => {
        request.log.error(error, 'Erro ao disparar webhook de saída');
      });
    }

    // Se o status foi atualizado para PILAR_APROVADO, gerar peças satélite
    if (status === 'PILAR_APROVADO' && contentPiece.bodyText) {
      // Buscar dados para geração de satélites
      const mapeamento = await prisma.magmaMapeamento.findUnique({
        where: { projectId: contentPiece.brief.projectId },
      });

      const pilar = await prisma.pilar.findUnique({
        where: { id: contentPiece.brief.pilarId || '' },
      });

      // Gerar peças satélite assincronamente (sem aguardar)
      generateSatellitesAsync(
        contentPieceId,
        contentPiece.brief,
        contentPiece.bodyText,
        mapeamento,
        pilar
      ).catch((error) => {
        request.log.error(error, 'Erro ao gerar peças satélite');
      });
    }

    return reply.code(200).send({
      message: `Status atualizado para ${status}`,
      contentPiece: updatedPiece,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
    }
    request.log.error(error, 'Erro ao atualizar status');
    return reply.code(500).send({ error: 'Erro ao atualizar status' });
  }
}

/**
 * Gera peças satélite assincronamente
 */
async function generateSatellitesAsync(
  parentContentPieceId: string,
  brief: any,
  pilarBodyText: string,
  mapeamento: any,
  pilar: any
) {
  try {
    // Buscar o TopicCluster associado ao pilar
    const topicClusters = await prisma.topicCluster.findMany({
      where: { pilarId: pilar?.id },
    });

    const topicClusterName = topicClusters[0]?.name || 'Tópico Principal';

    // Gerar uma peça satélite para cada formato
    for (const format of SATELLITE_FORMATS) {
      try {
        const satelliteData = {
          pilarBodyText,
          format,
          topicCluster: topicClusterName,
          brandArchetype: mapeamento?.brandArchetype || 'Brand',
          cta: brief.cta || 'Saiba mais',
          toneOfVoice: brief.toneOfVoice || 'profissional',
        };

        // Gerar conteúdo satélite
        const aiDraft = await generateSatelliteContent(satelliteData);

        // Criar novo ContentPiece para o satélite
        await prisma.contentPiece.create({
          data: {
            briefId: brief.id,
            status: 'SATELITE_EM_REVISAO',
            format,
            aiDraftV1: aiDraft,
          },
        });
      } catch (error) {
        console.error(`Erro ao gerar satélite ${format}:`, error);
        // Continuar com os próximos formatos
      }
    }
  } catch (error) {
    console.error('Erro ao gerar satélites:', error);
  }
}

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // Endpoint para gerar conteúdo pilar
  fastify.post('/v1/content-pieces/:id/generate-pilar', async (request, reply) => {
    await generatePilarContentHandler(fastify, request, reply);
  });

  // Endpoint para atualizar status de conteúdo
  fastify.patch('/v1/content-pieces/:id/status', async (request, reply) => {
    await updateContentStatusHandler(fastify, request, reply);
  });

  // Endpoint para listar ContentPieces de um projeto
  fastify.get('/v1/content-pieces/:projectId', async (request, reply) => {
    try {
      const { projectId } = z.object({ projectId: z.string().uuid() }).parse(request.params);

      // Verificar se o projeto pertence ao tenant
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { tenantId: true },
      });

      if (!project || project.tenantId !== request.tenantId) {
        return reply.code(403).send({ error: 'Acesso negado' });
      }

      // Buscar ContentBriefs e ContentPieces apenas de pilares ATIVO ou OTIMIZANDO
      const briefs = await prisma.contentBrief.findMany({
        where: {
          projectId,
          pilar: {
            status: {
              in: ['ATIVO', 'OTIMIZANDO'],
            },
          },
        },
        include: {
          contentPieces: true,
          pilar: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      });

      // Log de pilares eliminados (para auditoria)
      const eliminatedPilares = await prisma.pilar.findMany({
        where: {
          projectId,
          status: 'ELIMINADO',
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (eliminatedPilares.length > 0) {
        request.log.info(`Pilares eliminados encontrados`);
      }

      return reply.code(200).send({ briefs });
    } catch (error) {
      request.log.error(error, 'Erro ao listar conteúdos');
      return reply.code(500).send({ error: 'Erro ao listar conteúdos' });
    }
  });

  done();
}
