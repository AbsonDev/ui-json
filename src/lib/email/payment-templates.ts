/**
 * Email templates for payment notifications
 */

export function getPaymentFailedEmailTemplate(userName: string, planTier: string, amount: number, reason: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h1 style="color: #dc3545; margin: 0 0 10px 0;">⚠️ Falha no Pagamento</h1>
          <p style="margin: 0; color: #666;">Seu pagamento não pôde ser processado</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
          <p>Olá ${userName},</p>

          <p>Infelizmente, não conseguimos processar seu pagamento para o plano <strong>${planTier}</strong>.</p>

          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0;"><strong>Detalhes:</strong></p>
            <p style="margin: 10px 0 0 0;">Valor: $${amount.toFixed(2)}</p>
            <p style="margin: 5px 0 0 0;">Motivo: ${reason}</p>
          </div>

          <p><strong>O que fazer agora?</strong></p>
          <ol>
            <li>Verifique se há fundos suficientes em sua conta</li>
            <li>Confirme que os dados do cartão estão atualizados</li>
            <li>Tente novamente ou atualize seu método de pagamento</li>
          </ol>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/settings/billing" style="display: inline-block; background: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Atualizar Método de Pagamento
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Se você tiver dúvidas, responda este email ou entre em contato conosco.
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>UI-JSON Visualizer - Plataforma Low-Code</p>
          <p>Este é um email automático, mas você pode responder se precisar de ajuda.</p>
        </div>
      </body>
    </html>
  `
}

export function getPaymentSuccessEmailTemplate(userName: string, planTier: string, amount: number, invoiceUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #d4edda; padding: 30px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #c3e6cb;">
          <h1 style="color: #28a745; margin: 0 0 10px 0;">✅ Pagamento Confirmado</h1>
          <p style="margin: 0; color: #155724;">Seu pagamento foi processado com sucesso!</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
          <p>Olá ${userName},</p>

          <p>Recebemos seu pagamento com sucesso! Obrigado por continuar usando o UI-JSON Visualizer.</p>

          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Plano:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 500;">${planTier}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Valor pago:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 500;">$${amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceUrl}" style="display: inline-block; background: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-right: 10px;">
              Ver Fatura
            </a>
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: inline-block; background: #6c757d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Ir para Dashboard
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Seu acesso ao plano ${planTier} está garantido. Aproveite todos os recursos!
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>UI-JSON Visualizer - Plataforma Low-Code</p>
          <p>Precisa de ajuda? Responda este email.</p>
        </div>
      </body>
    </html>
  `
}

export function getSubscriptionCanceledEmailTemplate(userName: string, planTier: string, endDate: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fff3cd; padding: 30px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #ffc107;">
          <h1 style="color: #856404; margin: 0 0 10px 0;">📋 Assinatura Cancelada</h1>
          <p style="margin: 0; color: #856404;">Sua assinatura foi cancelada</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e9ecef;">
          <p>Olá ${userName},</p>

          <p>Confirmamos o cancelamento da sua assinatura do plano <strong>${planTier}</strong>.</p>

          <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0;"><strong>Você ainda tem acesso até:</strong></p>
            <p style="font-size: 24px; color: #0070f3; margin: 10px 0 0 0; font-weight: 600;">${endDate}</p>
          </div>

          <p>Após essa data, sua conta será convertida para o plano <strong>FREE</strong>.</p>

          <p><strong>Sentiremos sua falta! 😢</strong></p>
          <p>Adoraríamos saber o que podemos melhorar. Responda este email com seu feedback.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/pricing" style="display: inline-block; background: #0070f3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500;">
              Reativar Assinatura
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Obrigado por ter usado o UI-JSON Visualizer. Esperamos vê-lo de volta em breve!
          </p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>UI-JSON Visualizer - Plataforma Low-Code</p>
        </div>
      </body>
    </html>
  `
}
