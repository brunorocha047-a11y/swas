import { Anthropic } from '@anthropic-ai/sdk';

// Inicializar cliente Anthropic (usando variável de ambiente ANTHROPIC_API_KEY)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Interface para os dados necessários para gerar conteúdo pilar
 */
export interface PilarContentGenerationData {
  brandArchetype: string;
  brandBeliefs: string;
  personaName: string;
  jtbd: string;
  awarenessLevel: number;
  format: string;
  primaryKeyword: string;
  cta: string;
  pilarName: string;
}

/**
 * Interface para os dados necessários para gerar peças satélite
 */
export interface SatelliteContentGenerationData {
  pilarBodyText: string;
  format: string;
  topicCluster: string;
  brandArchetype: string;
  cta: string;
  toneOfVoice: string;
}

/**
 * Gera o prompt dinâmico para criação de conteúdo pilar
 */
function buildPilarPrompt(data: PilarContentGenerationData): string {
  return `Você é um estrategista de conteúdo especializado em ${data.brandArchetype}.

Escreva um ${data.format} para a persona: "${data.personaName}" (JTBD: "${data.jtbd}").

Nível de consciência: ${data.awarenessLevel}/5.

Objetivo: gerar autoridade e educar.

Tome como base o Brand Manifesto: "${data.brandBeliefs}".

Use tom de voz ${data.brandArchetype} e inclua a palavra-chave "${data.primaryKeyword}".

CTA: "${data.cta}".

[NÃO inclua marcações, explicações ou metadados. Apenas o conteúdo final.]`;
}

/**
 * Gera o prompt dinâmico para criação de peças satélite
 */
function buildSatellitePrompt(data: SatelliteContentGenerationData): string {
  return `Baseado neste conteúdo pilar aprovado:

"${data.pilarBodyText}"

Crie uma versão otimizada para o formato ${data.format}.

Foque no ponto-chave: "${data.topicCluster}".

Mantenha o mesmo tom de voz (${data.toneOfVoice}) e CTA: "${data.cta}".

[NÃO inclua marcações, explicações ou metadados. Apenas o conteúdo final.]`;
}

/**
 * Chama a API da Anthropic (Claude 3.5 Sonnet) para gerar conteúdo pilar
 */
export async function generatePilarContent(data: PilarContentGenerationData): Promise<string> {
  try {
    const prompt = buildPilarPrompt(data);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extrair o texto da resposta
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Resposta da IA não contém texto');
    }

    return textContent.text;
  } catch (error) {
    console.error('Erro ao gerar conteúdo pilar:', error);
    throw new Error(`Falha ao gerar conteúdo pilar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Chama a API da Anthropic (Claude 3.5 Sonnet) para gerar peças satélite
 */
export async function generateSatelliteContent(data: SatelliteContentGenerationData): Promise<string> {
  try {
    const prompt = buildSatellitePrompt(data);

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extrair o texto da resposta
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Resposta da IA não contém texto');
    }

    return textContent.text;
  } catch (error) {
    console.error('Erro ao gerar conteúdo satélite:', error);
    throw new Error(`Falha ao gerar conteúdo satélite: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
