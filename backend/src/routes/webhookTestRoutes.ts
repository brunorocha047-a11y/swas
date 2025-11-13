import { FastifyInstance, FastifyPluginOptions, FastifyDone } from 'fastify';
import { z } from 'zod';
import { testWebhookConnection } from '../lib/outboundWebhook';

const testWebhookSchema = z.object({
  webhookUrl: z
    .string()
    .url('URL inválida')
    .refine(
      (url) =>
        url.startsWith('https://hooks.zapier.com/') || url.startsWith('https://hooks.make.com/'),
      'URL deve ser um webhook válido do Zapier ou Make'
    ),
});

export default function (fastify: FastifyInstance, opts: FastifyPluginOptions, done: FastifyDone) {
  // Endpoint para testar conexão com webhook
  fastify.post('/v1/webhook/test', async (request, reply) => {
    try {
      const { webhookUrl } = testWebhookSchema.parse(request.body);

      const success = await testWebhookConnection(webhookUrl);

      if (success) {
        return reply.code(200).send({
          message: 'Conexão com webhook testada com sucesso',
          success: true,
        });
      } else {
        return reply.code(400).send({
          message: 'Falha ao conectar com o webhook',
          success: false,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Erro de validação', details: error.errors });
      }
      request.log.error(error, 'Erro ao testar webhook');
      return reply.code(500).send({ error: 'Erro ao testar webhook' });
    }
  });

  done();
}
