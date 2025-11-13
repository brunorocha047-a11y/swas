import prisma from './prisma';

/**
 * Busca o registro do usuário no banco de dados com base no clerkUserId.
 * @param clerkUserId O ID do usuário fornecido pelo Clerk.
 * @returns O objeto User do Prisma ou null.
 */
export async function getAuthUser(clerkUserId: string) {
  // Nota: A tabela User não é isolada por tenant, pois é o ponto de entrada
  // para descobrir o tenantId do usuário.
  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: clerkUserId,
    },
    select: {
      id: true,
      email: true,
      tenantId: true,
      clerkUserId: true,
    },
  });

  return user;
}
