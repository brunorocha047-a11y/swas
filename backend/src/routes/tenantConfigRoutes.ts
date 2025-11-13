import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { z } from 'zod';

// Schema de validação para o corpo da requisição PATCH
const patchConfigSchema = z.object({
  targetTenantId: z.string().uuid("targetTenantId deve ser um UUID válido."),
  aaEmbedUrl: z.string().url("aaEmbedUrl deve ser uma URL válida.").startsWith("https://app.agencyanalytics.com/embed/", "A URL deve começar com https://app.agencyanalytics.com/embed/"),
});

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // Middleware de permissão OPB (simulado)
  const opbOnlyPreHandler = async (request: any, reply: any) => {
    // SIMULAÇÃO: Em um cenário real, o OPB seria o único usuário no Tenant principal
    // ou teria uma flag 'is_admin' no User.
    // Para esta etapa, vamos assumir que o usuário logado (request.user) é o OPB.
    // Em etapas futuras, o OPB será o único que pode configurar outros tenants.
    
    // Para o propósito desta etapa, vamos apenas garantir que o usuário está autenticado.
    if (!request.user || !request.tenantId) {
      return reply.code(403).send({ error: 'Forbidden: OPB permission required.' });
    }
  };

  // 1. Endpoint para CONFIGURAÇÃO (OPB-only)
  fastify.patch('/v1/tenant-config', { preHandler: opbOnlyPreHandler }, async (request, reply) => {
    try {
      const { targetTenantId, aaEmbedUrl } = patchConfigSchema.parse(request.body);

      // SIMULAÇÃO DE PERMISSÃO:
      // Em um cenário real, o OPB teria um Tenant ID principal e os clientes seriam sub-tenants.
      // Aqui, assumimos que o OPB está logado e tem permissão para configurar o targetTenantId.
      // Para a segurança do DB, o middleware do Prisma *não* deve ser aplicado aqui,
      // pois o OPB está atualizando o TenantConfig de *outro* tenant (o cliente).
      // Portanto, a query deve ser feita diretamente no Prisma Client *sem* o contexto de tenant.

      // 1. Verificar se o targetTenantId existe (e se o OPB tem permissão, o que é simulado aqui)
      const targetTenant = await prisma.tenant.findUnique({
        where: { id: targetTenantId },
        select: { id: true },
      });

      if (!targetTenant) {
        return reply.code(404).send({ error: 'Target Tenant not found.' });
      }

      // 2. Atualizar ou criar o TenantConfig para o targetTenantId
      // Usamos upsert para garantir que a configuração exista.
      const updatedConfig = await prisma.tenantConfig.upsert({
        where: { tenantId: targetTenantId },
        update: { aaEmbedUrl: aaEmbedUrl },
        create: {
          tenantId: targetTenantId,
          aaEmbedUrl: aaEmbedUrl,
        },
      });

      return reply.code(200).send({
        message: `TenantConfig para ${targetTenantId} atualizado com sucesso.`,
        config: updatedConfig,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation Error', details: error.errors });
      }
      request.log.error(error, 'Erro ao configurar TenantConfig');
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

    // 2. Endpoint para VISUALIZAÇÃO (Cliente logado)
  fastify.get('/v1/tenant-config', async (request, reply) => {
    try {
      // O isolamento multi-tenant do Prisma garante que só buscaremos a TenantConfig
      // que pertence ao request.tenantId.
      const tenantConfig = await prisma.tenantConfig.findUnique({
        where: {
          // O middleware do Prisma injetará automaticamente o tenantId aqui.
          // Se o desenvolvedor esquecer o where, o middleware o adicionará.
          // Se o desenvolvedor adicionar um where, o middleware o combinará com o tenantId.
          // Como TenantConfig tem um @unique em tenantId, findUnique é a operação correta.
        },
        select: {
          aaEmbedUrl: true,
        },
      });

      if (!tenantConfig) {
        return reply.code(200).send({ aaEmbedUrl: null, message: 'Configuração de performance não encontrada.' });
      }

      return reply.code(200).send({
        aaEmbedUrl: tenantConfig.aaEmbedUrl,
      });
    } catch (error) {
      request.log.error(error, 'Erro ao buscar TenantConfig');
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  done();
}
