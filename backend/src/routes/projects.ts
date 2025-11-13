import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import prisma from '../lib/prisma';

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // Rota para listar todos os projetos do tenant
  fastify.get('/projects', async (request, reply) => {
    // A rota NÃO precisa adicionar where: { tenantId: request.tenantId }
    // O middleware do Prisma em src/lib/prisma.ts fará isso automaticamente.
    const projects = await prisma.project.findMany({
      // O desenvolvedor só precisa se preocupar com os filtros de negócio
      where: {
        // Exemplo de filtro de negócio:
        // name: {
        //   contains: 'Magma',
        // },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });

    return {
      tenantId: request.tenantId,
      projects: projects,
      message: 'Isolamento multi-tenant garantido pelo middleware do Prisma.',
    };
  });

  // Rota para criar um novo projeto
  fastify.post('/projects', async (request, reply) => {
    const { name } = request.body as { name: string };

    // A rota NÃO precisa adicionar tenantId no payload
    // O middleware do Prisma em src/lib/prisma.ts fará isso automaticamente.
    const newProject = await prisma.project.create({
      data: {
        name: name,
        // tenantId será injetado automaticamente
      },
    });

    return reply.code(201).send({
      tenantId: request.tenantId,
      project: newProject,
      message: 'Criação de projeto com tenantId injetado automaticamente.',
    });
  });

  done();
}
