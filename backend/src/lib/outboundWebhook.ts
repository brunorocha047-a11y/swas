import prisma from './prisma';

/**
 * Interface para o payload do webhook de saída
 */
export interface OutboundWebhookPayload {
  event: string;
  tenantId: string;
  contentPieceId: string;
  format: string;
  bodyText: string;
  scheduledFor?: string;
  targetPlatform?: string;
}

/**
 * Valida se a URL é um webhook válido do Zapier ou Make
 */
function isValidWebhookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validDomains = ['hooks.zapier.com', 'hooks.make.com'];
    return validDomains.some((domain) => urlObj.hostname.includes(domain)) && urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Realiza uma tentativa de envio do webhook com tratamento de erro
 */
async function sendWebhookAttempt(url: string, payload: OutboundWebhookPayload): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MAGMA-OS/1.0',
      },
      body: JSON.stringify(payload),
      timeout: 10000, // 10 segundos de timeout
    });

    if (response.ok) {
      console.log(`[Webhook] Sucesso ao enviar para ${url}. Status: ${response.status}`);
      return true;
    } else {
      console.warn(`[Webhook] Falha ao enviar para ${url}. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`[Webhook] Erro ao enviar para ${url}:`, error);
    return false;
  }
}

/**
 * Implementa retry com backoff exponencial
 */
async function sendWebhookWithRetry(
  url: string,
  payload: OutboundWebhookPayload,
  maxRetries: number = 3
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Webhook] Tentativa ${attempt}/${maxRetries} para ${url}`);

    const success = await sendWebhookAttempt(url, payload);
    if (success) {
      return true;
    }

    // Backoff exponencial: 2^(attempt-1) segundos
    if (attempt < maxRetries) {
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      console.log(`[Webhook] Aguardando ${delayMs}ms antes da próxima tentativa...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

/**
 * Verifica se um webhook já foi enviado para este ContentPiece (idempotência)
 */
async function hasWebhookBeenSent(contentPieceId: string): Promise<boolean> {
  try {
    // Buscar logs de webhook na tabela (se existir)
    // Por enquanto, verificamos se o status é PUBLICADO
    const contentPiece = await prisma.contentPiece.findUnique({
      where: { id: contentPieceId },
      select: { status: true },
    });

    return contentPiece?.status === 'PUBLICADO';
  } catch (error) {
    console.error('Erro ao verificar idempotência:', error);
    return false;
  }
}

/**
 * Função principal: dispara o webhook de saída para o Zapier
 */
export async function triggerOutboundWebhook(contentPieceId: string): Promise<boolean> {
  try {
    // 1. Verificar idempotência
    if (await hasWebhookBeenSent(contentPieceId)) {
      console.log(`[Webhook] ContentPiece ${contentPieceId} já foi publicado. Ignorando.`);
      return true;
    }

    // 2. Buscar o ContentPiece
    const contentPiece = await prisma.contentPiece.findUnique({
      where: { id: contentPieceId },
      include: {
        brief: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!contentPiece) {
      console.error(`[Webhook] ContentPiece ${contentPieceId} não encontrado`);
      return false;
    }

    if (contentPiece.status !== 'APROVADO') {
      console.warn(`[Webhook] ContentPiece ${contentPieceId} não está em status APROVADO`);
      return false;
    }

    // 3. Buscar a configuração do tenant (Zapier Webhook URL)
    const tenantConfig = await prisma.tenantConfig.findUnique({
      where: { tenantId: contentPiece.brief.project.tenantId },
    });

    if (!tenantConfig?.zapierPublishWebhookUrl) {
      console.warn(
        `[Webhook] Nenhum Zapier Webhook URL configurado para o tenant ${contentPiece.brief.project.tenantId}`
      );
      return false;
    }

    // 4. Validar a URL
    if (!isValidWebhookUrl(tenantConfig.zapierPublishWebhookUrl)) {
      console.error(
        `[Webhook] URL de webhook inválida: ${tenantConfig.zapierPublishWebhookUrl}`
      );
      return false;
    }

    // 5. Preparar o payload
    const payload: OutboundWebhookPayload = {
      event: 'content.approved',
      tenantId: contentPiece.brief.project.tenantId,
      contentPieceId: contentPieceId,
      format: contentPiece.format || 'unknown',
      bodyText: contentPiece.bodyText || contentPiece.aiDraftV1 || '',
      scheduledFor: new Date().toISOString(),
      targetPlatform: contentPiece.format?.split('_')[0] || 'unknown', // ex: linkedin_post -> linkedin
    };

    // 6. Enviar webhook com retry
    const success = await sendWebhookWithRetry(tenantConfig.zapierPublishWebhookUrl, payload);

    if (success) {
      // 7. Atualizar status para PUBLICADO
      await prisma.contentPiece.update({
        where: { id: contentPieceId },
        data: { status: 'PUBLICADO' },
      });

      console.log(`[Webhook] ContentPiece ${contentPieceId} publicado com sucesso`);
      return true;
    } else {
      console.error(`[Webhook] Falha ao enviar webhook para ${contentPieceId} após 3 tentativas`);
      return false;
    }
  } catch (error) {
    console.error(`[Webhook] Erro geral ao disparar webhook:`, error);
    return false;
  }
}

/**
 * Função auxiliar para testar a conexão com o webhook (sem enviar conteúdo real)
 */
export async function testWebhookConnection(webhookUrl: string): Promise<boolean> {
  if (!isValidWebhookUrl(webhookUrl)) {
    console.error(`[Webhook] URL de webhook inválida: ${webhookUrl}`);
    return false;
  }

  const testPayload: OutboundWebhookPayload = {
    event: 'test',
    tenantId: 'test-tenant',
    contentPieceId: 'test-piece',
    format: 'test',
    bodyText: 'Teste de conexão com webhook',
  };

  return await sendWebhookAttempt(webhookUrl, testPayload);
}
