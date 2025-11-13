import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';

// Schema de validação para Persona
const personaSchema = z.object({
  name: z.string().min(1, 'Nome da persona é obrigatório'),
  jtbd: z.string().min(1, 'Job-To-Be-Done é obrigatório'),
  awarenessLevel: z.number().int().min(1).max(5, 'Nível de consciência deve estar entre 1 e 5'),
  primaryMotivator: z.string().optional(),
});

// Schema de validação para o corpo da requisição POST /api/v1/mapeamento
const createMapeamentoSchema = z.object({
  projectId: z.string().uuid('projectId deve ser um UUID válido'),
  brandArchetype: z.string().optional(),
  brandBeliefs: z.string().optional(),
  visualIcon: z.string().optional(),
  sonicIcon: z.string().optional(),
  personas: z.array(personaSchema).optional(),
  competitors: z.string().optional(),
  gapAnalysis: z.string().optional(),
});

// Schema de validação para o corpo da requisição PATCH /api/v1/mapeamento
const updateMapeamentoSchema = z.object({
  projectId: z.string().uuid('projectId deve ser um UUID válido'),
  brandArchetype: z.string().optional(),
  brandBeliefs: z.string().optional(),
  visualIcon: z.string().optional(),
  sonicIcon: z.string().optional(),
  personas: z.array(personaSchema).optional(),
  competitors: z.string().optional(),
  gapAnalysis: z.string().optional(),
});

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // 1. Endpoint para CRIAR/ATUALIZAR Mapeamento (POST)
  fastify.post('/v1/mapeamento', async (request, reply) => {
    try {
      const { projectId, brandArchetype, brandBeliefs, visualIcon, sonicIcon, personas, competitors, gapAnalysis } =
        createMapeamentoSchema.parse(request.body);

      // Verificar se o projeto pertence ao tenant do usuário logado
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, tenantId: true },
      });

      if (!project) {
        return reply.code(404).send({ error: 'Projeto não encontrado.' });
      }

      // Verificar se o projeto pertence ao tenant do usuário
      if (project.tenantId !== request.tenantId) {
        return reply.code(403).send({ error: 'Acesso negado: projeto não pertence ao seu tenant.' });
      }

      // Criar ou atualizar o MagmaMapeamento
      const mapeamento = await prisma.magmaMapeamento.upsert({
        where: { projectId: projectId },
        update: {
          brandArchetype: brandArchetype,
          brandBeliefs: brandBeliefs,
          visualIcon: visualIcon,
          sonicIcon: sonicIcon,
          competitors: competitors,
          gapAnalysis: gapAnalysis,
        },
        create: {
          projectId: projectId,
          brandArchetype: brandArchetype,
          brandBeliefs: brandBeliefs,
          visualIcon: visualIcon,
          sonicIcon: sonicIcon,
          competitors: competitors,
          gapAnalysis: gapAnalysis,
        },
      });

      // Se houver personas, deletar as antigas e criar as novas
      if (personas && personas.length > 0) {
        await prisma.persona.deleteMany({
          where: { mapeamentoId: mapeamento.id },
        });

        await Promise.all(
          personas.map((persona) =>
            prisma.persona.create({
              data: {
                mapeamentoId: mapeamento.id,
                name: persona.name,
                jtbd: persona.jtbd,
                awarenessLevel: persona.awarenessLevel,
                primaryMotivator: persona.primaryMotivator,
              },
            })
          )
        );
      }

      // Recuperar o mapeamento atualizado com as personas
      const updatedMapeamento = await prisma.magmaMapeamento.findUnique({
        where: { id: mapeamento.id },
        include: { personas: true },
      });

      return reply.code(200).send({
        message: 'Mapeamento criado/atualizado com sucesso.',
        mapeamento: updatedMapeamento,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
      }
      request.log.error(error, 'Erro ao criar/atualizar mapeamento');
      return reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });

  // 2. Endpoint para RECUPERAR Mapeamento (GET)
  fastify.get('/v1/mapeamento/:projectId', async (request, reply) => {
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

      // Recuperar o mapeamento com as personas
      const mapeamento = await prisma.magmaMapeamento.findUnique({
        where: { projectId: projectId },
        include: { personas: true },
      });

      if (!mapeamento) {
        return reply.code(200).send({ mapeamento: null, message: 'Mapeamento não encontrado para este projeto.' });
      }

      return reply.code(200).send({ mapeamento: mapeamento });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
      }
      request.log.error(error, 'Erro ao recuperar mapeamento');
      return reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });

  done();
}
