import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

const checkoutSessionSchema = z.object({
  priceId: z.string().min(1, 'priceId é obrigatório'),
  companyName: z.string().min(1, 'Nome da empresa é obrigatório'),
  email: z.string().email('Email inválido'),
});

type CheckoutSessionData = z.infer<typeof checkoutSessionSchema>;

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // Endpoint para criar sessão de checkout
  fastify.post('/v1/stripe/checkout-session', async (request, reply) => {
    try {
      const { priceId, companyName, email } = checkoutSessionSchema.parse(request.body);

      // Criar sessão de checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'https://magma-os.vercel.app'}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'https://magma-os.vercel.app'}/pricing`,
        customer_email: email,
        client_reference_id: companyName,
        metadata: {
          companyName,
        },
      });

      return reply.code(200).send({
        sessionId: session.id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
      }

      console.error('[Stripe Checkout] Erro ao criar sessão:', error);
      return reply.code(500).send({ error: 'Erro ao criar sessão de checkout' });
    }
  });

  done();
}
