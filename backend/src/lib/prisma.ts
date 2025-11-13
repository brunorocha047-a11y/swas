import { PrismaClient } from '@prisma/client';

// Lista de modelos que requerem isolamento multi-tenant (devem ter o campo tenantId)
const tenantModels = [
  'Project',
  'MagmaMapeamento',
  'Pilar',
  'TopicCluster',
  'ContentBrief',
  'ContentPiece',
  'AnalyticsReport',
  'TenantConfig',
];

// Tipagem para o contexto de execução (vem do request.tenantId)
interface Context {
  tenantId?: string;
}

// Extensão do Prisma Client para incluir o contexto
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // 1. Verificar se o modelo requer isolamento
        if (tenantModels.includes(model)) {
          const context: Context = (global as any).context || {};
          const tenantId = context.tenantId;

          // 2. Lançar erro se tenantId não estiver definido (segurança)
          if (!tenantId) {
            throw new Error(
              `[SECURITY ERROR] Tenant ID is missing for protected model ${model} during operation ${operation}.`
            );
          }

          // 3. Aplicar filtro de tenant para operações de leitura e exclusão
          if (
            operation.startsWith('find') ||
            operation.startsWith('delete') ||
            operation.startsWith('update') ||
            operation.startsWith('count') ||
            operation.startsWith('aggregate')
          ) {
            // Adiciona o filtro tenantId ao 'where'
            args.where = {
              ...args.where,
              tenantId: tenantId,
            };
          }

          // 4. Injetar tenantId para operações de criação
          if (operation.startsWith('create')) {
            args.data = {
              ...args.data,
              tenantId: tenantId,
            };
          }
          
          // 5. Injetar tenantId para operações de update (para garantir que não atualize dados de outro tenant)
          if (operation.startsWith('update')) {
            args.where = {
              ...args.where,
              tenantId: tenantId,
            };
          }
        }

        return query(args);
      },
    },
  },
});

export default prisma;
