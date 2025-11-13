import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const checkoutSchema = z.object({
  companyName: z.string().min(1, 'Nome da empresa é obrigatório'),
  email: z.string().email('Email inválido'),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface PricingPlan {
  name: string;
  price: number;
  description: string;
  features: string[];
  priceId: string;
  popular?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Starter',
    price: 99,
    description: 'Perfeito para agências iniciantes',
    priceId: 'price_starter',
    features: [
      'Até 3 projetos',
      'Geração de conteúdo com IA',
      'Até 10 pilares por projeto',
      'Suporte por email',
    ],
  },
  {
    name: 'Professional',
    price: 299,
    description: 'Para agências em crescimento',
    priceId: 'price_professional',
    popular: true,
    features: [
      'Projetos ilimitados',
      'Geração avançada de conteúdo',
      'Pilares e tópicos ilimitados',
      'Integração com Zapier',
      'Analytics dashboard',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Enterprise',
    price: 999,
    description: 'Para grandes agências',
    priceId: 'price_enterprise',
    features: [
      'Tudo no Professional',
      'API customizada',
      'Integração com Buffer/ContentStudio',
      'Suporte dedicado 24/7',
      'Treinamento customizado',
      'SLA garantido',
    ],
  },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(PRICING_PLANS[1]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      companyName: '',
      email: '',
    },
  });

  const handleCheckout = async (data: CheckoutFormData) => {
    if (!selectedPlan) {
      toast.error('Por favor, selecione um plano');
      return;
    }

    try {
      setIsLoading(true);

      // Chamar API para criar sessão de checkout
      const response = await fetch('/api/v1/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          companyName: data.companyName,
          email: data.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar sessão de checkout');
      }

      const { sessionId } = await response.json();

      // Redirecionar para Stripe Checkout
      const stripe = (window as any).Stripe;
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId });
      } else {
        toast.error('Stripe não carregou corretamente');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Planos Simples e Transparentes</h1>
        <p className="text-xl text-gray-600 mb-8">
          Escolha o plano perfeito para sua agência e comece a transformar sua estratégia de
          conteúdo
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`cursor-pointer transition-all ${
                selectedPlan?.name === plan.name
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-lg'
              } ${plan.popular ? 'md:scale-105' : ''}`}
              onClick={() => setSelectedPlan(plan)}
            >
              <CardHeader>
                {plan.popular && (
                  <div className="mb-2">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="text-5xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-2">/mês</span>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={selectedPlan?.name === plan.name ? 'default' : 'outline'}
                >
                  Selecionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Checkout Form */}
        {selectedPlan && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Finalizar Compra</CardTitle>
              <CardDescription>
                Preencha seus dados para começar com o plano {selectedPlan.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCheckout)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Empresa ou Projeto</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Agência XYZ, Projeto ABC"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Este será o nome do seu tenant no MAGMA-OS
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Você receberá um email de confirmação e acesso ao MAGMA-OS
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Plano:</span>
                      <span className="font-semibold">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor mensal:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${selectedPlan.price}
                      </span>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Ir para Checkout'
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Você será redirecionado para o Stripe para completar o pagamento de forma segura
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Perguntas Frequentes</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Posso mudar de plano depois?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. A mudança entra em
                vigor no próximo ciclo de cobrança.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Há período de teste?</h3>
              <p className="text-gray-600">
                Sim, oferecemos 14 dias de teste gratuito. Sem necessidade de cartão de crédito.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                O que acontece após o pagamento?
              </h3>
              <p className="text-gray-600">
                Após confirmar o pagamento, você será redirecionado para começar seu onboarding
                estratégico. Receberá também um email com instruções de acesso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
