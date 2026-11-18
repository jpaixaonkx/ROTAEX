'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, UserPlus, LogIn, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LandingPage() {
  const router = useRouter();
  const [modal, setModal] = useState<'login' | 'register' | null>(null);
  const [welcomeToast, setWelcomeToast] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
  });

  // Substitua a função handleAuthSubmit por esta:
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modal === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        alert('Erro no cadastro: ' + error.message);
        return;
      }

      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: formData.fullName,
          cpf: formData.cpf,
          phone: formData.phone,
          email: formData.email,
        });

        // Dispara o e-mail real de boas-vindas
        await fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
          }),
        });

        setWelcomeToast(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        alert('E-mail ou senha inválidos: ' + error.message);
        return;
      }

      router.push('/dashboard');
    }
  };
  
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white selection:bg-amber-500 selection:text-black">
      {/* FUNDO 4D INTERATIVO (Malha espacial + Partículas Douradas e Cromadas) */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,184,0,0.14)_0%,rgba(5,5,5,0.95)_65%)]" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,184,0,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,184,0,0.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            transform: 'perspective(600px) rotateX(55deg) scale(1.6)',
            transformOrigin: 'center top',
          }}
        />
        <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 animate-pulse rounded-full bg-amber-500/10 blur-[120px]" />
      </div>

      {/* HEADER SUPERIOR */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <img
            src="/logo-rotaex.png"
            alt="ROTAEX"
            className="h-11 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,184,0,0.5)]"
          />
        </div>

        {/* Botões superiores de Acessar e Cadastro */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModal('login')}
            className="flex items-center gap-2 rounded-full border border-slate-600/60 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:border-amber-400 hover:text-amber-400"
          >
            <LogIn className="h-4 w-4" />
            Acessar
          </button>
          <button
            onClick={() => setModal('register')}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-orange-600 px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_25px_rgba(255,184,0,0.45)] transition hover:scale-105"
          >
            <UserPlus className="h-4 w-4" />
            Cadastro
          </button>
        </div>
      </header>

      {/* CENTRO 3D COM A LOGOTIPO FLUTUANTE E SOMBRAS */}
      <main className="relative z-10 flex min-h-[calc(100vh-96px)] flex-col items-center justify-center px-4 text-center">
        <div className="group relative mb-8 flex flex-col items-center">
          {/* Halo 3D atrás da Logo */}
          <div className="absolute inset-0 scale-110 rounded-full bg-gradient-to-tr from-amber-500/30 via-slate-300/10 to-orange-600/30 blur-3xl transition duration-700 group-hover:scale-125" />

          <img
            src="/logo-rotaex.png"
            alt="ROTAEX 3D"
            className="relative z-10 w-[300px] sm:w-[440px] md:w-[520px] animate-[float_5s_ease-in-out_infinite] drop-shadow-[0_28px_35px_rgba(0,0,0,0.95)] [filter:drop-shadow(0_0_25px_rgba(255,184,0,0.35))]"
          />

          {/* Sombra 3D Projetada no Chão */}
          <div className="mt-4 h-4 w-64 rounded-[100%] bg-amber-500/20 blur-xl" />
        </div>

        <h1 className="max-w-2xl bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          Sua Estante Inteligente de Entregas em Tempo Real
        </h1>
        <p className="mt-4 max-w-xl text-sm text-slate-400 sm:text-base">
          Escaneie pacotes por QR Code, Código de Barras ou endereço. O ROTAEX organiza automaticamente sua rota pela menor distância GPS para economizar combustível e multiplicar seus lucros.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setModal('register')}
            className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 py-4 text-base font-extrabold text-black shadow-[0_10px_40px_rgba(255,184,0,0.4)] transition hover:scale-105"
          >
            Começar Entregas Agora
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </main>

      {/* NOTIFICAÇÃO DE BOAS-VINDAS AO CADASTRAR */}
      {welcomeToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-amber-400/50 bg-zinc-950/95 px-6 py-4 shadow-[0_0_30px_rgba(255,184,0,0.4)] backdrop-blur-xl">
          <CheckCircle2 className="h-6 w-6 text-amber-400" />
          <div>
            <p className="text-sm font-bold text-white">Bem-vindo à ROTAEX, {formData.fullName}!</p>
            <p className="text-xs text-slate-400">
              E-mail de boas-vindas enviado para {formData.email}. Preparando seu GPS...
            </p>
          </div>
        </div>
      )}

      {/* MODAL DE LOGIN / CADASTRO */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-zinc-950 p-7 shadow-[0_0_50px_rgba(255,184,0,0.2)]">
            <button
              onClick={() => setModal(null)}
              className="absolute right-5 top-5 rounded-full bg-white/5 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <img src="/logo-rotaex.png" alt="Logo" className="h-8 w-auto" />
              <h2 className="text-xl font-bold text-white">
                {modal === 'login' ? 'Acessar Conta' : 'Cadastro de Entregador'}
              </h2>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {modal === 'register' && (
                <>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-400">Nome Completo</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold uppercase text-slate-400">CPF</label>
                      <input
                        required
                        type="text"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-slate-400">Telefone</label>
                      <input
                        required
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">E-mail</label>
                <input
                  required
                  type="email"
                  placeholder="entregador@rotaex.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Senha</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-extrabold text-black shadow-lg transition hover:brightness-110"
              >
                {modal === 'login' ? 'Entrar no Sistema' : 'Finalizar Cadastro e Ativar GPS'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}