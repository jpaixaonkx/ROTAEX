'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Navigation } from 'lucide-react';
import { PackageItem } from '@/utils/routeOptimizer';

const driverIcon = new L.DivIcon({
  className: 'custom-driver-marker',
  html: `<div style="background:#FFB800;width:22px;height:22px;border-radius:50%;border:3px solid #000;box-shadow:0 0 18px #FFB800;"></div>`,
  iconSize: [22, 22],
});

const packageIcon = new L.DivIcon({
  className: 'custom-pkg-marker',
  html: `<div style="background:#E2E8F0;width:18px;height:18px;border-radius:6px;border:2px solid #FF7A00;box-shadow:0 0 12px #FF7A00;"></div>`,
  iconSize: [18, 18],
});

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onSelectLocation }: { onSelectLocation: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelectLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface LiveWorldMapProps {
  driverPos: { lat: number; lng: number };
  packages: PackageItem[];
  activeDestination?: { lat: number; lng: number; label: string } | null;
  onSelectDestination?: (dest: { lat: number; lng: number; label: string }) => void;
  compact?: boolean;
}

export default function LiveWorldMap({
  driverPos,
  packages,
  activeDestination,
  onSelectDestination,
  compact = false,
}: LiveWorldMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  useEffect(() => {
  if (!activeDestination) {
    setRouteCoords([]);
    return;
  }

  fetch(
    `https://router.project-osrm.org/route/v1/driving/${driverPos.lng},${driverPos.lat};${activeDestination.lng},${activeDestination.lat}?overview=full&geometries=geojson`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );
        setRouteCoords(coords);
      }
    })
    .catch(() => {
      // Fallback em linha reta caso falhe
      setRouteCoords([
        [driverPos.lat, driverPos.lng],
        [activeDestination.lat, activeDestination.lng],
      ]);
    });
}, [driverPos, activeDestination]);

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (data && data.length > 0 && onSelectDestination) {
        onSelectDestination({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          label: data[0].display_name,
        });
      }
    } catch (err) {
      console.error('Erro na geocodificação:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
      {!compact && (
        <form
          onSubmit={handleSearchAddress}
          className="absolute left-4 right-4 top-4 z-[1000] flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-zinc-950/90 px-4 py-3 shadow-2xl backdrop-blur-xl"
        >
          <Search className="h-5 w-5 text-amber-400" />
          <input
            type="text"
            placeholder="Pesquisar endereço, CEP ou clique no mapa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-black transition hover:bg-amber-400"
          >
            {searching ? '...' : 'Ir'}
          </button>
        </form>
      )}

      <MapContainer
        center={[driverPos.lat, driverPos.lng]}
        zoom={15}
        className="z-0 h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapRecenter lat={driverPos.lat} lng={driverPos.lng} />

        {onSelectDestination && (
          <MapClickHandler
            onSelectLocation={(lat, lng) =>
              onSelectDestination({
                lat,
                lng,
                label: `Ponto Manual (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
              })
            }
          />
        )}

        <Marker position={[driverPos.lat, driverPos.lng]} icon={driverIcon}>
          <Popup>Você está aqui (GPS em tempo real)</Popup>
        </Marker>

        {packages.map((pkg, index) => (
          <Marker key={pkg.id} position={[pkg.lat, pkg.lng]} icon={packageIcon}>
            <Popup>
              <strong>#{index + 1} - ID: {pkg.package_code}</strong>
              <br />
              {pkg.address} ({pkg.distanceKm} km)
            </Popup>
          </Marker>
        ))}

        {activeDestination && (
          <>
            <Marker position={[activeDestination.lat, activeDestination.lng]} icon={packageIcon}>
              <Popup>{activeDestination.label}</Popup>
            </Marker>
            <Polyline
                positions={
                    routeCoords.length > 0
                        ? routeCoords
                        : [
                            [driverPos.lat, driverPos.lng],
                            [activeDestination.lat, activeDestination.lng],
                          ]
                }
                pathOptions={{ color: '#FFB800', weight: 5 }}
            />
          </>
        )}
      </MapContainer>

      {!compact && activeDestination && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] flex items-center justify-between rounded-2xl border border-amber-500/40 bg-zinc-950/95 p-4 backdrop-blur-xl">
          <div className="pr-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Destino Selecionado
            </span>
            <p className="line-clamp-1 text-sm font-semibold text-white">{activeDestination.label}</p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activeDestination.lat},${activeDestination.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-xs font-extrabold text-black shadow-lg"
          >
            <Navigation className="h-4 w-4" />
            Iniciar Corrida
          </a>
        </div>
      )}
    </div>
  );
}