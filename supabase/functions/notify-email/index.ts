import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nome, whatsapp, objetivo, data_envio } = await req.json()

    if (!nome || !whatsapp || !objetivo) {
      throw new Error('Dados incompletos')
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY não configurada')
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #ff3b30 0%, #e02f25 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 30px; }
            .field { margin-bottom: 20px; }
            .field-label { font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 6px; display: block; }
            .field-value { font-size: 16px; color: #1a1a1a; font-weight: 500; }
            .objetivo-box { background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #ff3b30; white-space: pre-wrap; }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 13px; color: #888; border-top: 1px solid #eee; }
            .btn { display: inline-block; background: #ff3b30; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Novo Lead Recebido</h1>
            </div>
            <div class="content">
              <div class="field">
                <span class="field-label">Nome</span>
                <span class="field-value">${nome}</span>
              </div>
              <div class="field">
                <span class="field-label">WhatsApp</span>
                <span class="field-value"><a href="https://wa.me/${whatsapp.replace(/\D/g, '')}" style="color: #ff3b30; text-decoration: none;">${whatsapp}</a></span>
              </div>
              <div class="field">
                <span class="field-label">Data/Hora</span>
                <span class="field-value">${new Date(data_envio).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
              </div>
              <div class="field">
                <span class="field-label">Objetivo</span>
                <div class="objetivo-box">${objetivo}</div>
              </div>
              <a href="https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(nome.split(' ')[0])}%2C%20recebi%20seu%20contato%20pelo%20site%20e%20vou%20entrar%20em%20contato%20em%20breve!" class="btn">Responder no WhatsApp</a>
            </div>
            <div class="footer">
              Enviado automaticamente do site viniciusramalho.com.br
            </div>
          </div>
        </body>
      </html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vinicius Ramalho <noreply@viniciusramalho.com.br>',
        to: ['contato@viniciusramalho.com.br'],
        subject: `🎯 Novo Lead: ${nome}`,
        html: emailHtml,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Resend error: ${JSON.stringify(result)}`)
    }

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Erro notify-email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})