import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nome, whatsapp, objetivo, data_envio } = await req.json()

    if (!nome || !whatsapp || !objetivo) {
      throw new Error('Dados incompletos')
    }

    const webhookUrl = Deno.env.get('WEBHOOK_WHATSAPP_URL')
    if (!webhookUrl) {
      throw new Error('WEBHOOK_WHATSAPP_URL não configurada')
    }

    const telefoneLimpo = whatsapp.replace(/\D/g, '')
    const mensagem = `🎯 *Novo Lead - Vinicius Ramalho*

*Nome:* ${nome}
*WhatsApp:* ${whatsapp}
*Data:* ${new Date(data_envio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

*Objetivo:*
${objetivo}

---
Responder: https://wa.me/${telefoneLimpo}`

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: telefoneLimpo,
        message: mensagem,
      }),
    })

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${JSON.stringify(result)}`)
    }

    return new Response(
      JSON.stringify({ success: true, webhookResult: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Erro notify-whatsapp:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})