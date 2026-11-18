import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json({ error: 'Endereço vazio' }, { status: 400 });
  }

  try {
    let searchString = query;

    // 1. Se o usuário digitou um CEP (8 dígitos), converte para rua/cidade via BrasilAPI primeiro
    const cleanCep = query.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const cepRes = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
      if (cepRes.ok) {
        const cepData = await cepRes.json();
        if (cepData.location?.coordinates?.latitude && cepData.location?.coordinates?.longitude) {
          return NextResponse.json({
            lat: parseFloat(cepData.location.coordinates.latitude),
            lng: parseFloat(cepData.location.coordinates.longitude),
            label: `${cepData.street || ''}, ${cepData.neighborhood || ''} - ${cepData.city}/${cepData.state}`,
          });
        }
        searchString = `${cepData.street || ''}, ${cepData.city}, ${cepData.state}, Brasil`;
      }
    }

    // 2. Busca coordenadas via Photon (Komoot/OpenStreetMap - rápido e sem bloqueio)
    const photonRes = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(searchString)}&limit=1`
    );

    if (photonRes.ok) {
      const photonData = await photonRes.json();
      if (photonData.features && photonData.features.length > 0) {
        const [lng, lat] = photonData.features[0].geometry.coordinates;
        const props = photonData.features[0].properties;
        const label = [props.name, props.street, props.housenumber, props.city, props.state]
          .filter(Boolean)
          .join(', ');

        return NextResponse.json({ lat, lng, label: label || searchString });
      }
    }

    // 3. Fallback via Nominatim com User-Agent oficial
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&limit=1&q=${encodeURIComponent(searchString)}`,
      {
        headers: {
          'User-Agent': 'ROTAEX-Delivery-App/1.0',
        },
      }
    );

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (nomData && nomData.length > 0) {
        return NextResponse.json({
          lat: parseFloat(nomData[0].lat),
          lng: parseFloat(nomData[0].lon),
          label: nomData[0].display_name,
        });
      }
    }

    return NextResponse.json({ error: 'Endereço não encontrado' }, { status: 404 });
  } catch (error) {
    console.error('Erro na geocodificação:', error);
    return NextResponse.json({ error: 'Falha interna ao buscar coordenadas' }, { status: 500 });
  }
}