// index.js - Ponto de entrada da aplicação Fastify

const fastify = require('fastify');
const { clerkPlugin } = require('@clerk/fastify');
const { authMiddleware } = require('./src/middleware/authMiddleware');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente do .env (ou .env.example para demonstração)
dotenv.config({ path: '.env.example' });

const app = fastify({
  logger: true,
});

// 1. Registrar o plugin do Clerk
app.register(clerkPlugin);

// 2. Registrar o middleware de autenticação como preHandler global para rotas protegidas
// Nota: Em um projeto real, você usaria um plugin para encapsular as rotas protegidas
// e aplicar o preHandler apenas a elas. Aqui, aplicamos globalmente para simplificar.
app.addHook('preHandler', async (request, reply) => {
  // Excluir rotas públicas, como webhooks ou health checks, se necessário.
  // Por enquanto, aplicamos a todas as rotas.
  await authMiddleware(request, reply, () => {});
});

// 3. Registrar as rotas (usando autoload para simular um projeto maior)
app.register(require('@fastify/autoload'), {
  dir: `${__dirname}/src/routes`,
  options: { prefix: '/api' },
  // Excluir rotas que não queremos que sejam carregadas automaticamente
  // ignorePattern: /.*(test|spec).js/,
});

// 4. Rota de health check (não protegida)
app.get('/', async (request, reply) => {
  return { status: 'ok', message: 'MAGMA-OS Backend is running' };
});

// 5. Iniciar o servidor
const start = async () => {
  try {
    await app.listen({ port: 3000 });
    app.log.info(`Server listening on ${app.server.address().port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
