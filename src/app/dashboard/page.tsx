'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  QrCode,
  Barcode,
  MapPin,
  Map as MapIcon,
  User,
  BarChart3,
  Package,
  CheckCircle,
  Navigation,
  Camera,
  Plus,
  Globe,
  Car,
} from 'lucide-react';
import { PackageItem, sortSmartShelf } from '@/utils/routeOptimizer';

// Importação dinâmica do Mapa para evitar erro de SSR no Next.js
const LiveWorldMap = dynamic(() => import('@/components/LiveWorldMap'), { ssr: false });

export default function RotaexDashboard() {
  const [activeTab, setActiveTab] = useState<'rastrear' | 'maps' | 'conta' | 'dashboard'>('rastrear');

  // Localização GPS em Tempo Real
  const [driverPos, setDriverPos] = useState({ lat: -23.55052, lng: -46.633308 });
  const [gpsStatus, setGpsStatus] = useState('Sincronizando GPS...');

  // Estante Inteligente de Pacotes
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [scanMode, setScanMode] = useState<'qrcode' | 'barcode' | 'manual'>('manual');
  const [pkgCode, setPkgCode] = useState('');
  const [pkgAddress, setPkgAddress] = useState('');
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Destino no Modo Maps (Corrida)
  const [activeDestination, setActiveDestination] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  // Filtro do Dashboard
  const [periodFilter, setPeriodFilter] = useState<'dia' | 'semana' | 'mes'>('dia');

  // Dados da Conta do Entregador
  const [profile, setProfile] = useState({
    fullName: 'Entregador ROTAEX',
    email: 'entregador@rotaex.com',
    carModel: 'Fiat Fiorino Endurance',
    plateEnd: '9A42',
    avatar: '',
  });

  // Carrega dados salvos e inicia rastreamento GPS em tempo real
  useEffect(() => {
    const saved = localStorage.getItem('rotaex_user');
    if (saved) setProfile(JSON.parse(saved));

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDriverPos(newPos);
          setGpsStatus('GPS Ativo em Tempo Real');
          setPackages((prev) => sortSmartShelf(prev, newPos.lat, newPos.lng));
        },
        () => {
          setGpsStatus('GPS Simulado (Permita localização no navegador)');
        },
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Adiciona pacote escaneado e reordena automaticamente a estante
  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgCode || !pkgAddress) return;

    // Geocodifica o endereço digitado/escaneado para obter lat/lng reais
    let lat = driverPos.lat + (Math.random() - 0.5) * 0.03;
    let lng = driverPos.lng + (Math.random() - 0.5) * 0.03;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(pkgAddress)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      }
    } catch {}

    const newPkg: PackageItem = {
      id: crypto.randomUUID(),
      package_code: pkgCode.toUpperCase(),
      address: pkgAddress,
      lat,
      lng,
      status: 'pending',
    };

    const updated = sortSmartShelf([...packages, newPkg], driverPos.lat, driverPos.lng);
    setPackages(updated);
    setPkgCode('');
    setPkgAddress('');
  };

  // Marca entrega como concluída
  const handleDeliverPackage = (id: string) => {
    setPackages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'delivered', delivered_at: new Date().toISOString() } : p
      )
    );
  };

  // Upload de Foto de Perfil
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const updated = { ...profile, avatar: reader.result as string };
      setProfile(updated);
      localStorage.setItem('rotaex_user', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const pendingShelf = packages.filter((p) => p.status === 'pending');
  const deliveredList = packages.filter((p) => p.status === 'delivered');

  return (
    <div className="min-h-screen bg-[#050505] pb-28 text-white">
      {/* TOPBAR FIXA COM LOGO NO CANTO ESQUERDO SUPERIOR EM TODAS AS PÁGINAS */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#050505]/90 px-5 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img
            src="/logo-rotaex.png"
            alt="ROTAEX"
            className="h-9 w-auto object-contain drop-shadow-[0_0_10px_rgba(255,184,0,0.4)]"
          />
        </div>

        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
          <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
          {gpsStatus}
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {/* ================= ABA 1: RASTREAR & ESTANTE INTELIGENTE ================= */}
        {activeTab === 'rastrear' && (
          <div className="space-y-6">
            {/* Opções de Rastreio */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950 p-5 shadow-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-white">Escanear Pacote para Estante</h2>
                <button
                  onClick={() => setShowMiniMap(!showMiniMap)}
                  className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-400 transition hover:bg-amber-500 hover:text-black"
                >
                  <Globe className="h-4 w-4" />
                  {showMiniMap ? 'Ocultar Mapa Mundial' : 'Mapa Mundial em Tempo Real'}
                </button>
              </div>

              {/* Janela Flutuante do Mapa Mundial em Tempo Real */}
              {showMiniMap && (
                <div className="mb-5 h-72 w-full">
                  <LiveWorldMap driverPos={driverPos} packages={pendingShelf} compact />
                </div>
              )}

              {/* Seletor de Modo: QRCode, Código de Barras, Endereço Escrito */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScanMode('qrcode')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                    scanMode === 'qrcode'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('barcode')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                    scanMode === 'barcode'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Barcode className="h-4 w-4" />
                  Cód. Barras
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('manual')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                    scanMode === 'manual'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Por Escrito
                </button>
              </div>

              {scanMode !== 'manual' && (
                <div className="mb-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-500/40 bg-black/60 p-6 text-center">
                  <Camera className="mb-2 h-8 w-8 text-amber-400" />
                  <p className="text-xs text-slate-300">
                    Câmera pronta para leitura de {scanMode === 'qrcode' ? 'QR Code' : 'Código de Barras'}.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPkgCode(`RTX-${Math.floor(100000 + Math.random() * 900000)}`);
                      setPkgAddress('Av. Paulista, 1578, São Paulo');
                    }}
                    className="mt-3 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-white/20"
                  >
                    Simular Leitura Instantânea
                  </button>
                </div>
              )}

              <form onSubmit={handleAddPackage} className="grid gap-3 sm:grid-cols-3">
                <input
                  required
                  type="text"
                  placeholder="ID / Código do Pacote"
                  value={pkgCode}
                  onChange={(e) => setPkgCode(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                />
                <input
                  required
                  type="text"
                  placeholder="Endereço Completo ou CEP"
                  value={pkgAddress}
                  onChange={(e) => setPkgAddress(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-extrabold text-black shadow-lg transition hover:brightness-110"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar à Estante
                </button>
              </form>
            </div>

            {/* ESTANTE ORDENADA AUTOMATICAMENTE POR DISTÂNCIA */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-200">
                  Estante de Entregas Ordenada ({pendingShelf.length})
                </h3>
                <span className="text-xs text-amber-400">Ordenado por proximidade GPS</span>
              </div>

              {pendingShelf.length === 0 ? (
                <div className="rounded-3xl border border-white/5 bg-zinc-950/60 p-10 text-center text-sm text-slate-500">
                  Nenhum pacote na estante. Escaneie o primeiro pacote acima para organizar sua rota!
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingShelf.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-950 p-4 transition hover:border-amber-500/40 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-black text-black">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-400">
                              ID: {item.package_code}
                            </span>
                            <span className="text-xs font-semibold text-emerald-400">
                              • {item.distanceKm} km de você
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium text-white">{item.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveDestination({
                              lat: item.lat,
                              lng: item.lng,
                              label: `Pacote ${item.package_code} - ${item.address}`,
                            });
                            setActiveTab('maps');
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500 hover:text-black"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Rota
                        </button>
                        <button
                          onClick={() => handleDeliverPackage(item.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500 hover:text-black"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Entregue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA 2: MAPS (MODO CORRIDA / ENTREGA) ================= */}
        {activeTab === 'maps' && (
          <div className="h-[72vh] w-full">
            <LiveWorldMap
              driverPos={driverPos}
              packages={pendingShelf}
              activeDestination={activeDestination}
              onSelectDestination={setActiveDestination}
            />
          </div>
        )}

        {/* ================= ABA 3: CONTA DO ENTREGADOR ================= */}
        {activeTab === 'conta' && (
          <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={
                    profile.avatar ||
                    'https://ui-avatars.com/api/?name=ROTAEX&background=FFB800&color=000&bold=true'
                  }
                  alt="Perfil"
                  className="h-24 w-24 rounded-full border-2 border-amber-400 object-cover"
                />
                <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-amber-400 p-2 text-black shadow-lg hover:scale-105">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <h2 className="mt-3 text-xl font-bold text-white">{profile.fullName}</h2>
              <p className="text-xs text-slate-400">{profile.email}</p>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Nome do Entregador</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">E-mail Cadastrado</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Carro Cadastrado</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm">
                    <Car className="h-4 w-4 text-amber-400" />
                    <input
                      type="text"
                      value={profile.carModel}
                      onChange={(e) => setProfile({ ...profile, carModel: e.target.value })}
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Final da Placa</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={profile.plateEnd}
                    onChange={(e) => setProfile({ ...profile, plateEnd: e.target.value.toUpperCase() })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm font-bold text-amber-400"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  localStorage.setItem('rotaex_user', JSON.stringify(profile));
                  alert('Dados da conta atualizados com sucesso!');
                }}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-sm font-extrabold text-black"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        )}

        {/* ================= ABA 4: DASHBOARD DE ENTREGAS ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Desempenho de Entregas</h2>
              <div className="flex rounded-xl border border-white/10 bg-zinc-950 p-1">
                {(['dia', 'semana', 'mes'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setPeriodFilter(period)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase transition ${
                      periodFilter === period
                        ? 'bg-amber-400 text-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {period === 'dia' ? 'Dia' : period === 'semana' ? 'Semana' : 'Mês'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-amber-500/30 bg-zinc-950 p-6">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Entregas Concluídas ({periodFilter})
                </span>
                <p className="mt-2 text-4xl font-black text-amber-400">
                  {periodFilter === 'dia'
                    ? 18 + deliveredList.length
                    : periodFilter === 'semana'
                    ? 114 + deliveredList.length
                    : 482 + deliveredList.length}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
                <span className="text-xs font-semibold uppercase text-slate-400">Na Estante Agora</span>
                <p className="mt-2 text-4xl font-black text-white">{pendingShelf.length}</p>
              </div>
              <div className="rounded-3xl border border-emerald-500/30 bg-zinc-950 p-6">
                <span className="text-xs font-semibold uppercase text-slate-400">Economia Estimada</span>
                <p className="mt-2 text-4xl font-black text-emerald-400">
                  {periodFilter === 'dia' ? '24%' : periodFilter === 'semana' ? '27%' : '31%'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MENU INFERIOR FLUTUANTE DE ÚLTIMA GERAÇÃO */}
      <nav className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-500/30 bg-zinc-950/90 px-4 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        {[
          { id: 'rastrear', label: 'Rastrear', icon: Package },
          { id: 'maps', label: 'Maps', icon: MapIcon },
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'conta', label: 'Conta', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-[0_0_20px_rgba(255,184,0,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}