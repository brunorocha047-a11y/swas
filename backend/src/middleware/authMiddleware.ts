import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { getAuthUser } from '../lib/clerk';

// Estendendo a interface do Request para incluir as propriedades injetadas
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
    tenantId?: string;
  }
}

/**
 * Middleware de autenticação e injeção de contexto multi-tenant.
 * 1. Valida o token JWT do Clerk.
 * 2. Extrai o clerkUserId.
 * 3. Consulta o DB para obter o tenantId.
 * 4. Injeta user e tenantId no request.
 * 5. Injeta tenantId no contexto global para o middleware do Prisma.
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  try {
    // O @clerk/fastify já deve ter validado o token e injetado o auth.userId
    const clerkAuth = request.auth;

    if (!clerkAuth || !clerkAuth.userId) {
      return reply.code(401).send({ error: 'Unauthorized: Missing or invalid token.' });
    }

    const clerkUserId = clerkAuth.userId;

    // Consulta o banco de dados para obter o tenantId
    const user = await getAuthUser(clerkUserId);

    if (!user) {
      // O usuário está autenticado no Clerk, mas não está provisionado no nosso DB.
      // Isso pode ser um 403 se o provisionamento for obrigatório.
      // Para este cenário, vamos considerar 403 Forbidden.
      return reply.code(403).send({ error: 'Forbidden: User not provisioned in the system.' });
    }

    // 4. Injeta user e tenantId no request
    request.user = { id: user.id, email: user.email };
    request.tenantId = user.tenantId;

    // 5. Injeta tenantId no contexto global para o middleware do Prisma
    // Nota: Em um ambiente de produção real, o contexto deve ser injetado de forma
    // mais segura e isolada por requisição (ex: usando AsyncLocalStorage ou um plugin Fastify).
    // Para fins de demonstração e simplicidade, usaremos o global.context.
    (global as any).context = { tenantId: user.tenantId };

    done();
  } catch (error) {
    request.log.error(error, 'Erro no middleware de autenticação');
    return reply.code(500).send({ error: 'Internal Server Error during authentication.' });
  }
}
