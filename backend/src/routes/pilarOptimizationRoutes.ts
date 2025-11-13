import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';

// Schema de validação para atualização de status de pilar
const updatePilarStatusSchema = z.object({
  status: z.enum(['ATIVO', 'OTIMIZANDO', 'ELIMINADO']),
});

// Schema de validação para log de teste A/B
const createAbTestLogSchema = z.object({
  hypothesis: z.string().min(1, 'Hipótese é obrigatória'),
  setup: z.string().optional(),
  result: z.string().optional(),
});

/**
 * Atualiza o status de um pilar
 */
async function updatePilarStatusHandler(fastify: FastifyInstance, request: any, reply: any) {
  try {
    const { id: pilarId } = z.object({ id: z.string().uuid() }).parse(request.params);
    const { status } = updatePilarStatusSchema.parse(request.body);

    // Buscar o pilar
    const pilar = await prisma.pilar.findUnique({
      where: { id: pilarId },
      include: {
        project: true,
      },
    });

    if (!pilar) {
      return reply.code(404).send({ error: 'Pilar não encontrado' });
    }

    // Verificar se o projeto pertence ao tenant
    if (pilar.project.tenantId !== request.tenantId) {
      return reply.code(403).send({ error: 'Acesso negado' });
    }

    // Verificar se o usuário é OPB (simplificado - em produção, usar role/permission)
    // Por enquanto, apenas verificamos se o usuário está autenticado
    if (!request.user) {
      return reply.code(401).send({ error: 'Não autenticado' });
    }

    // Atualizar o status do pilar
    const updatedPilar = await prisma.pilar.update({
      where: { id: pilarId },
      data: { status },
    });

    return reply.code(200).send({
      message: `Status do pilar atualizado para ${status}`,
      pilar: updatedPilar,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
    }
    request.log.error(error, 'Erro ao atualizar status do pilar');
    return reply.code(500).send({ error: 'Erro ao atualizar status' });
  }
}

/**
 * Cria um log de teste A/B
 */
async function createAbTestLogHandler(fastify: FastifyInstance, request: any, reply: any) {
  try {
    const { projectId } = z.object({ projectId: z.string().uuid() }).parse(request.params);
    const { hypothesis, setup, result } = createAbTestLogSchema.parse(request.body);

    // Verificar se o projeto pertence ao tenant
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { tenantId: true },
    });

    if (!project || project.tenantId !== request.tenantId) {
      return reply.code(403).send({ error: 'Acesso negado' });
    }

    // Criar o log de teste A/B
    const abTestLog = await prisma.abTestLog.create({
      data: {
        projectId,
        hypothesis,
        setup,
        result,
      },
    });

    return reply.code(201).send({
      message: 'Log de teste A/B criado com sucesso',
      abTestLog,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
    }
    request.log.error(error, 'Erro ao criar log de teste A/B');
    return reply.code(500).send({ error: 'Erro ao criar log' });
  }
}

/**
 * Lista todos os pilares do projeto com seus status
 */
async function listPilarsByProjectHandler(fastify: FastifyInstance, request: any, reply: any) {
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

    // Buscar todos os pilares do projeto
    const pilares = await prisma.pilar.findMany({
      where: { projectId },
      include: {
        topicClusters: true,
        contentBriefs: {
          select: {
            id: true,
            title: true,
            contentPieces: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return reply.code(200).send({
      pilares,
      totalCount: pilares.length,
      activeCount: pilares.filter((p) => p.status === 'ATIVO').length,
      optimizingCount: pilares.filter((p) => p.status === 'OTIMIZANDO').length,
      eliminatedCount: pilares.filter((p) => p.status === 'ELIMINADO').length,
    });
  } catch (error) {
    request.log.error(error, 'Erro ao listar pilares');
    return reply.code(500).send({ error: 'Erro ao listar pilares' });
  }
}

/**
 * Lista logs de testes A/B do projeto
 */
async function listAbTestLogsHandler(fastify: FastifyInstance, request: any, reply: any) {
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

    // Buscar logs de testes A/B
    const abTestLogs = await prisma.abTestLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.code(200).send({
      abTestLogs,
      totalCount: abTestLogs.length,
    });
  } catch (error) {
    request.log.error(error, 'Erro ao listar logs de testes A/B');
    return reply.code(500).send({ error: 'Erro ao listar logs' });
  }
}

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // Endpoint para atualizar status de pilar
  fastify.patch('/v1/pilares/:id', async (request, reply) => {
    await updatePilarStatusHandler(fastify, request, reply);
  });

  // Endpoint para criar log de teste A/B
  fastify.post('/v1/projects/:projectId/ab-tests', async (request, reply) => {
    await createAbTestLogHandler(fastify, request, reply);
  });

  // Endpoint para listar pilares do projeto
  fastify.get('/v1/projects/:projectId/pilares', async (request, reply) => {
    await listPilarsByProjectHandler(fastify, request, reply);
  });

  // Endpoint para listar logs de testes A/B
  fastify.get('/v1/projects/:projectId/ab-tests', async (request, reply) => {
    await listAbTestLogsHandler(fastify, request, reply);
  });

  done();
}
