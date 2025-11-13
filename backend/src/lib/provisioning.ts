import prisma from './prisma';
import { clerkClient } from '@clerk/fastify';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Interface para dados do evento Stripe
 */
export interface StripeCheckoutEvent {
  id: string;
  customer_email: string;
  customer_name?: string;
  client_reference_id?: string;
  customer?: string;
}

/**
 * Função principal de provisionamento de novo tenant
 */
export async function provisionNewTenant(event: StripeCheckoutEvent): Promise<{
  success: boolean;
  tenantId?: string;
  error?: string;
}> {
  const sessionId = event.id;

  try {
    // Etapa 0: Verificar idempotência
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (existingEvent) {
      console.log(`[Provisioning] Evento ${sessionId} já foi processado`);
      return { success: true, tenantId: existingEvent.tenantId };
    }

    // Etapa A: Criar o Tenant
    console.log(`[Provisioning] Criando tenant para ${event.customer_email}`);
    const tenant = await prisma.tenant.create({
      data: {
        name: event.client_reference_id || `Tenant ${event.customer_email}`,
        stripeCustomerId: event.customer || '',
      },
    });

    console.log(`[Provisioning] Tenant criado: ${tenant.id}`);

    // Etapa B: Criar o Usuário no Clerk
    console.log(`[Provisioning] Criando usuário no Clerk`);
    let clerkUserId: string;

    try {
      const clerkUser = await clerkClient.users.createUser({
        emailAddress: [event.customer_email],
        firstName: event.customer_name || 'Cliente',
        publicMetadata: {
          tenantId: tenant.id,
        },
      });

      clerkUserId = clerkUser.id;
      console.log(`[Provisioning] Usuário Clerk criado: ${clerkUserId}`);
    } catch (clerkError) {
      console.error(`[Provisioning] Erro ao criar usuário no Clerk:`, clerkError);
      throw new Error('Falha ao criar usuário no Clerk');
    }

    // Etapa B2: Salvar o usuário no banco de dados
    console.log(`[Provisioning] Salvando usuário no banco de dados`);
    const user = await prisma.user.create({
      data: {
        clerkUserId,
        email: event.customer_email,
        tenantId: tenant.id,
      },
    });

    console.log(`[Provisioning] Usuário salvo: ${user.id}`);

    // Etapa C: Criar o Projeto Inicial
    console.log(`[Provisioning] Criando projeto inicial`);
    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        name: 'Ciclo MAGMA Inicial',
        startDate: new Date(),
      },
    });

    console.log(`[Provisioning] Projeto criado: ${project.id}`);

    // Etapa D: Enviar Email de Boas-Vindas
    console.log(`[Provisioning] Enviando email de boas-vindas`);
    const onboardingUrl = `${process.env.FRONTEND_URL || 'https://magma-os.vercel.app'}/onboarding/brand?email=${encodeURIComponent(event.customer_email)}&projectId=${project.id}`;

    try {
      await resend.emails.send({
        from: 'noreply@magma-os.com',
        to: event.customer_email,
        subject: 'Bem-vindo ao MAGMA-OS! 🚀',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Bem-vindo ao MAGMA-OS!</h1>
            <p>Olá ${event.customer_name || 'Cliente'},</p>
            <p>Sua conta foi criada com sucesso! 🎉</p>
            <p>Agora você está pronto para começar seu Onboarding Estratégico e transformar sua estratégia de conteúdo.</p>
            <p style="margin-top: 30px;">
              <a href="${onboardingUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Começar Onboarding
              </a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              Se você não criou esta conta, por favor ignore este email.
            </p>
          </div>
        `,
      });

      console.log(`[Provisioning] Email enviado para ${event.customer_email}`);
    } catch (emailError) {
      console.error(`[Provisioning] Erro ao enviar email:`, emailError);
      // Não falhar o provisionamento se o email falhar
    }

    // Etapa E: Registrar Idempotência
    console.log(`[Provisioning] Registrando evento para idempotência`);
    await prisma.stripeEvent.create({
      data: {
        stripeSessionId: sessionId,
        tenantId: tenant.id,
        status: 'PROVISIONED',
      },
    });

    console.log(`[Provisioning] Provisionamento concluído com sucesso para ${tenant.id}`);

    return {
      success: true,
      tenantId: tenant.id,
    };
  } catch (error) {
    console.error(`[Provisioning] Erro durante provisionamento:`, error);

    // Registrar erro para retry posterior
    try {
      await prisma.stripeEvent.create({
        data: {
          stripeSessionId: sessionId,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        },
      });
    } catch (logError) {
      console.error(`[Provisioning] Erro ao registrar falha:`, logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Função para reprocessar eventos que falharam
 */
export async function retryFailedProvisioningEvents(): Promise<void> {
  try {
    const failedEvents = await prisma.stripeEvent.findMany({
      where: { status: 'FAILED' },
      take: 10, // Processar até 10 eventos por vez
    });

    console.log(`[Provisioning] Encontrados ${failedEvents.length} eventos com falha`);

    for (const event of failedEvents) {
      try {
        // Aqui você precisaria recuperar os dados originais do evento
        // Por enquanto, apenas registramos a tentativa
        console.log(`[Provisioning] Tentando reprocessar evento ${event.stripeSessionId}`);

        // Atualizar status para indicar que foi tentado novamente
        await prisma.stripeEvent.update({
          where: { stripeSessionId: event.stripeSessionId },
          data: {
            retryCount: (event.retryCount || 0) + 1,
          },
        });
      } catch (error) {
        console.error(`[Provisioning] Erro ao reprocessar evento:`, error);
      }
    }
  } catch (error) {
    console.error(`[Provisioning] Erro ao buscar eventos com falha:`, error);
  }
}
