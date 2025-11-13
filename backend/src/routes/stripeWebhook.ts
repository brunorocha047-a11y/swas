import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import Stripe from 'stripe';
import { provisionNewTenant } from '../lib/provisioning';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

/**
 * Valida a assinatura do webhook do Stripe
 */
function validateStripeSignature(
  body: string,
  signature: string,
  secret: string
): Stripe.Event | null {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    return event;
  } catch (error) {
    console.error('[Stripe Webhook] Erro ao validar assinatura:', error);
    return null;
  }
}

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // Endpoint público para webhook do Stripe
  // IMPORTANTE: Este endpoint não deve ter autenticação
  fastify.post('/v1/webhooks/stripe', async (request, reply) => {
    try {
      const signature = request.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        console.error('[Stripe Webhook] Assinatura ou secret ausentes');
        return reply.code(400).send({ error: 'Assinatura ou secret ausentes' });
      }

      // Validar assinatura
      const event = validateStripeSignature(request.rawBody || '', signature, webhookSecret);

      if (!event) {
        return reply.code(400).send({ error: 'Assinatura inválida' });
      }

      console.log(`[Stripe Webhook] Evento recebido: ${event.type} (${event.id})`);

      // Retornar 200 OK imediatamente
      reply.code(200).send({ received: true });

      // Processar evento assincronamente
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log(`[Stripe Webhook] Processando checkout.session.completed: ${session.id}`);

        // Extrair dados do evento
        const checkoutEvent = {
          id: session.id,
          customer_email: session.customer_email || '',
          customer_name: session.customer_details?.name || undefined,
          client_reference_id: session.client_reference_id || undefined,
          customer: session.customer as string | undefined,
        };

        // Disparar provisionamento (assincronamente, sem aguardar)
        provisionNewTenant(checkoutEvent)
          .then((result) => {
            if (result.success) {
              console.log(`[Stripe Webhook] Provisionamento bem-sucedido: ${result.tenantId}`);
            } else {
              console.error(`[Stripe Webhook] Provisionamento falhou: ${result.error}`);
            }
          })
          .catch((error) => {
            console.error(`[Stripe Webhook] Erro ao provisionar tenant:`, error);
          });
      } else {
        console.log(`[Stripe Webhook] Evento ignorado: ${event.type}`);
      }
    } catch (error) {
      console.error('[Stripe Webhook] Erro geral:', error);
      return reply.code(500).send({ error: 'Erro ao processar webhook' });
    }
  });

  done();
}
