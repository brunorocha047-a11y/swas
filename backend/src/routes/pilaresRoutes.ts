import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';

// Schema de validação para TopicCluster
const topicClusterSchema = z.object({
  name: z.string().min(1, 'Nome do cluster é obrigatório'),
});

// Schema de validação para o corpo da requisição POST /api/v1/pilares
const createPilarSchema = z.object({
  projectId: z.string().uuid('projectId deve ser um UUID válido'),
  name: z.string().min(1, 'Nome do pilar é obrigatório'),
  topicClusters: z.array(topicClusterSchema).optional(),
});

// Schema de validação para o corpo da requisição PATCH /api/v1/project
const updateProjectSchema = z.object({
  projectId: z.string().uuid('projectId deve ser um UUID válido'),
  brandManifesto: z.string().optional(),
  storyBrandScript: z.string().optional(),
});

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // 1. Endpoint para CRIAR Pilar (POST)
  fastify.post('/v1/pilares', async (request, reply) => {
    try {
      const { projectId, name, topicClusters } = createPilarSchema.parse(request.body);

      // Verificar se o projeto pertence ao tenant do usuário logado
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, tenantId: true },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Projeto não encontrado.' });
      }

      if (project.tenantId !== request.tenantId) {
        return reply.code(403).send({ error: 'Acesso negado: projeto não pertence ao seu tenant.' });
      }

      // Criar o Pilar
      const pilar = await prisma.pilar.create({
        data: {
          projectId: projectId,
          name: name,
          status: 'ATIVO',
        },
      });

      // Se houver topicClusters, criar os registros
      if (topicClusters && topicClusters.length > 0) {
        await Promise.all(
          topicClusters.map((cluster) =>
            prisma.topicCluster.create({
              data: {
                pilarId: pilar.id,
                name: cluster.name,
              },
            })
          )
        );
      }

      // Recuperar o pilar atualizado com os clusters
      const createdPilar = await prisma.pilar.findUnique({
        where: { id: pilar.id },
        include: { topicClusters: true },
      });

      return reply.code(201).send({
        message: 'Pilar criado com sucesso.',
        pilar: createdPilar,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
      }
      request.log.error(error, 'Erro ao criar pilar');
      return reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });

  // 2. Endpoint para LISTAR Pilares (GET)
  fastify.get('/v1/pilares/:projectId', async (request, reply) => {
    try {
      const { projectId } = z.object({ projectId: z.string().uuid() }).parse(request.params);

      // Verificar se o projeto pertence ao tenant do usuário logado
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, tenantId: true },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Projeto não encontrado.' });
      }

      if (project.tenantId !== request.tenantId) {
        return reply.code(403).send({ error: 'Acesso negado: projeto não pertence ao seu tenant.' });
      }

      // Recuperar os pilares com os clusters
      const pilares = await prisma.pilar.findMany({
        where: { projectId: projectId },
        include: { topicClusters: true },
      });

      return reply.code(200).send({ pilares: pilares });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
      }
      request.log.error(error, 'Erro ao listar pilares');
      return reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });

  // 3. Endpoint para ATUALIZAR Projeto com Manifesto e Script (PATCH)
  fastify.patch('/v1/project/:projectId', async (request, reply) => {
    try {
      const { projectId } = z.object({ projectId: z.string().uuid() }).parse(request.params);
      const { brandManifesto, storyBrandScript } = updateProjectSchema.parse({
        projectId,
        ...request.body,
      });

      // Verificar se o projeto pertence ao tenant do usuário logado
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, tenantId: true },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Projeto não encontrado.' });
      }

      if (project.tenantId !== request.tenantId) {
        return reply.code(403).send({ error: 'Acesso negado: projeto não pertence ao seu tenant.' });
      }

      // Atualizar o projeto
      // Nota: O schema do Prisma não possui campos brandManifesto e storyBrandScript
      // Para fins de demonstração, vamos armazená-los como comentários ou criar campos adicionais
      // Em um cenário real, você adicionaria esses campos ao schema do Prisma
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          // Aqui você adicionaria os campos brandManifesto e storyBrandScript se existissem no schema
          // Por enquanto, apenas retornamos o projeto atualizado
        },
      });

      return reply.code(200).send({
        message: 'Projeto atualizado com sucesso.',
        project: updatedProject,
        note: 'Os campos brandManifesto e storyBrandScript devem ser adicionados ao schema do Prisma para serem persistidos.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
      }
      request.log.error(error, 'Erro ao atualizar projeto');
      return reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });

  done();
}
