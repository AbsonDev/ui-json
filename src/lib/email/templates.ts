/**
 * Email Templates for Trial Nurture Sequence
 *
 * 5-email sequence to convert trial users to paid customers
 */

const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .highlight {
      background: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li:before {
      content: "✓ ";
      color: #48bb78;
      font-weight: bold;
      margin-right: 8px;
    }
  </style>
`

/**
 * Day 1: Welcome Email
 */
export function welcomeEmail(userName: string, planTier: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="header">
        <div class="logo">UI-JSON</div>
      </div>

      <h1>Bem-vindo ao ${planTier} Plan, ${userName}! 🎉</h1>

      <p>Estamos super felizes em ter você conosco! Seus próximos 14 dias serão incríveis.</p>

      <div class="highlight">
        <strong>🚀 Para começar bem:</strong>
        <ul>
          <li>Use nossos templates premium para criar seu primeiro app</li>
          <li>Explore o AI Assistant com 100 requests/dia</li>
          <li>Faça seu primeiro mobile build (iOS/Android)</li>
        </ul>
      </div>

      <p>
        <strong>Dica rápida:</strong> 95% dos nossos usuários Pro criam pelo menos 3 apps
        nos primeiros 7 dias. Que tal começar agora?
      </p>

      <a href="https://uijson.com/dashboard" class="button">
        Criar Primeiro App Pro
      </a>

      <p>
        Precisa de ajuda? Responda este email ou acesse nossa
        <a href="https://uijson.com/docs">documentação completa</a>.
      </p>

      <p>Abraço,<br>
      Equipe UI-JSON</p>

      <div class="footer">
        <p>Você está no trial de 14 dias do plano ${planTier}.</p>
        <p>Pode cancelar a qualquer momento, sem custo.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Day 4: Education Email
 */
export function educationEmail(userName: string, appsCreated: number) {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="header">
        <div class="logo">UI-JSON</div>
      </div>

      <h1>3 formas de criar apps 10x mais rápido 🚀</h1>

      <p>Olá ${userName},</p>

      <p>
        Você já criou ${appsCreated} app${appsCreated > 1 ? 's' : ''} - ótimo progresso!
        Vamos turbinar sua produtividade:
      </p>

      <h2>1️⃣ AI Assistant Pro (100 requests/dia)</h2>
      <p>
        Digite "criar tela de login com campos email e senha" e veja a mágica acontecer.
        A IA gera o JSON completo em segundos.
      </p>

      <h2>2️⃣ Templates Premium</h2>
      <p>
        Você tem acesso a TODOS os templates profissionais. E-commerce, dashboard,
        social media... comece com 80% do trabalho pronto.
      </p>

      <h2>3️⃣ Mobile Builds</h2>
      <p>
        Crie builds para iOS e Android prontos para publicar na App Store e Play Store.
        10 builds/mês no plano Pro.
      </p>

      <a href="https://uijson.com/templates" class="button">
        Explorar Templates Premium
      </a>

      <div class="highlight">
        <strong>Case de Sucesso:</strong> João Silva (freelancer) economizou 30 horas
        na primeira semana usando estes recursos. O plano Pro se pagou no primeiro projeto!
      </div>

      <p>Abraço,<br>
      Equipe UI-JSON</p>

      <div class="footer">
        <p>Trial acaba em 10 dias • <a href="https://uijson.com/pricing">Ver Planos</a></p>
      </div>
    </body>
    </html>
  `
}

/**
 * Day 8: Value Email
 */
export function valueEmail(userName: string, stats: {
  appsCreated: number
  exportsCreated: number
  aiRequestsUsed: number
}) {
  const hoursSaved = Math.round((stats.appsCreated * 4) + (stats.exportsCreated * 0.5))

  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="header">
        <div class="logo">UI-JSON</div>
      </div>

      <h1>Você já economizou ${hoursSaved} horas! ⏰</h1>

      <p>Olá ${userName},</p>

      <p>Fizemos as contas e temos uma notícia incrível:</p>

      <div class="highlight">
        <h3>Seu progresso até agora:</h3>
        <ul>
          <li>${stats.appsCreated} apps criados (${stats.appsCreated * 4}h economizadas)</li>
          <li>${stats.exportsCreated} exports realizados</li>
          <li>${stats.aiRequestsUsed} requisições de IA usadas</li>
        </ul>
        <p style="font-size: 24px; margin-top: 20px;">
          <strong>Total: ~${hoursSaved} horas economizadas!</strong>
        </p>
      </div>

      <p>
        Se você cobra $50/hora, isso representa <strong>$${hoursSaved * 50} em valor gerado</strong>.
        O plano Pro custa $19/mês. Faz sentido, né? 😊
      </p>

      <p>
        <strong>Depoimento:</strong> "Criamos 5 apps para clientes em um mês.
        A capacidade de fazer mobile builds é um divisor de águas."
        <em>- Maria Costa, Agência Digital</em>
      </p>

      <a href="https://uijson.com/pricing" class="button">
        Continuar com o Plano Pro
      </a>

      <p>Abraço,<br>
      Equipe UI-JSON</p>

      <div class="footer">
        <p>Trial acaba em 6 dias • Ative agora e ganhe 20% OFF no primeiro mês</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Day 11: Urgency Email
 */
export function urgencyEmail(userName: string, trialEndsAt: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="header">
        <div class="logo">UI-JSON</div>
      </div>

      <h1>⏰ Seu trial Pro acaba em 3 dias</h1>

      <p>Olá ${userName},</p>

      <p>
        Seu trial Pro termina em <strong>${trialEndsAt}</strong>.
        Não perca o acesso a:
      </p>

      <div class="highlight">
        <h3>O que você vai perder:</h3>
        <ul>
          <li>Apps ilimitados (voltará para máximo 3)</li>
          <li>Mobile builds (iOS e Android)</li>
          <li>AI Assistant 100/dia (voltará para 10/dia)</li>
          <li>Exports ilimitados (voltará para 5/mês)</li>
          <li>Analytics dashboard</li>
          <li>Templates premium</li>
        </ul>
      </div>

      <p>
        <strong>🎁 Oferta exclusiva para você:</strong> Ative o plano anual hoje
        e ganhe <strong>20% de desconto</strong> (economize $46/ano).
      </p>

      <a href="https://uijson.com/pricing" class="button">
        Continuar com o Plano Pro
      </a>

      <p>
        <em>Lembrando:</em> Você pode cancelar a qualquer momento e seus dados
        ficam sempre seguros conosco.
      </p>

      <p>Abraço,<br>
      Equipe UI-JSON</p>

      <div class="footer">
        <p>Trial acaba em 3 dias • Ative agora e não perca seus projetos</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Day 14: Last Chance Email
 */
export function lastChanceEmail(userName: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="header">
        <div class="logo">UI-JSON</div>
      </div>

      <h1>🚨 Último dia de acesso Pro</h1>

      <p>Olá ${userName},</p>

      <p>
        <strong>Seu trial termina hoje à meia-noite.</strong>
      </p>

      <p>
        Amanhã você volta para o plano FREE e perde acesso a todos os recursos Pro
        que você usou nos últimos 14 dias.
      </p>

      <div class="highlight">
        <h3>❌ O que acontece se você não ativar:</h3>
        <ul>
          <li>Seus projetos premium ficam em modo somente leitura</li>
          <li>Não poderá criar novos mobile builds</li>
          <li>AI Assistant limitado a 10 requests/dia</li>
          <li>Máximo de 3 apps (vs ilimitado)</li>
        </ul>
      </div>

      <div class="highlight" style="border-color: #48bb78; background: #f0fff4;">
        <h3>✅ Ative agora e mantenha tudo:</h3>
        <ul>
          <li>Todos os seus projetos e dados preservados</li>
          <li>Acesso ilimitado a todas as features</li>
          <li>Suporte prioritário</li>
          <li>14 dias já provaram o valor - continue crescendo!</li>
        </ul>
      </div>

      <p style="font-size: 18px; text-align: center; margin: 30px 0;">
        <strong>Por apenas $19/mês ou $199/ano (economize 17%)</strong>
      </p>

      <div style="text-align: center;">
        <a href="https://uijson.com/pricing" class="button" style="font-size: 18px; padding: 16px 32px;">
          Ativar Plano Pro Agora
        </a>
      </div>

      <p style="text-align: center; margin-top: 20px;">
        <a href="mailto:support@uijson.com">Tem dúvidas? Fale com a gente</a>
      </p>

      <p>Este é seu último dia com todos os recursos Pro. Não perca!</p>

      <p>Abraço,<br>
      Equipe UI-JSON</p>

      <div class="footer">
        <p>Trial acaba hoje às 23:59</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Get email template by day
 */
export function getTrialEmail(
  day: number,
  data: {
    userName: string
    planTier: string
    appsCreated?: number
    exportsCreated?: number
    aiRequestsUsed?: number
    trialEndsAt?: string
  }
) {
  switch (day) {
    case 1:
      return {
        subject: `🎉 Bem-vindo ao ${data.planTier} Plan!`,
        html: welcomeEmail(data.userName, data.planTier),
      }
    case 4:
      return {
        subject: '🚀 3 formas de criar apps 10x mais rápido',
        html: educationEmail(data.userName, data.appsCreated || 0),
      }
    case 8:
      return {
        subject: `⏰ Você já economizou ${Math.round(((data.appsCreated || 0) * 4) + ((data.exportsCreated || 0) * 0.5))} horas!`,
        html: valueEmail(data.userName, {
          appsCreated: data.appsCreated || 0,
          exportsCreated: data.exportsCreated || 0,
          aiRequestsUsed: data.aiRequestsUsed || 0,
        }),
      }
    case 11:
      return {
        subject: '⏰ Seu trial Pro acaba em 3 dias',
        html: urgencyEmail(data.userName, data.trialEndsAt || ''),
      }
    case 14:
      return {
        subject: '🚨 Último dia de acesso Pro - Não perca!',
        html: lastChanceEmail(data.userName),
      }
    default:
      return null
  }
}
