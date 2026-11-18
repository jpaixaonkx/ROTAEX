import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { fullName, email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });
    }

    await resend.emails.send({
      from: 'ROTAEX Logística <onboarding@resend.dev>',
      to: email,
      subject: `Bem-vindo à ROTAEX, ${fullName}! 🚀`,
      html: `
        <div style="background:#050505;color:#ffffff;padding:32px;font-family:Arial,sans-serif;border-radius:16px;border:1px solid #FFB800;">
          <h1 style="color:#FFB800;margin-bottom:8px;">Bem-vindo à ROTAEX, ${fullName}!</h1>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.6;">
            Sua conta de entregador foi ativada com sucesso. Agora você já pode escanear pacotes por QR Code, Código de Barras ou endereço e deixar nossa Estante Inteligente otimizar suas rotas em tempo real.
          </p>
          <div style="margin-top:24px;padding:16px;background:#111111;border-left:4px solid #FFB800;border-radius:8px;">
            <strong style="color:#FFB800;">Dica de Ouro:</strong> Mantenha o GPS ativado para reordenar suas entregas automaticamente e economizar combustível.
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return NextResponse.json({ error: 'Falha no envio' }, { status: 500 });
  }
}