export interface PackageItem {
  id: string;
  package_code: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pending' | 'delivered';
  distanceKm?: number;
  delivered_at?: string;
}

// Calcula distância exata em KM entre duas coordenadas GPS
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Reordena a estante de entregas automaticamente do mais próximo ao mais distante
export function sortSmartShelf(
  packages: PackageItem[],
  currentLat: number,
  currentLng: number
): PackageItem[] {
  return packages
    .map((pkg) => ({
      ...pkg,
      distanceKm: calculateDistance(currentLat, currentLng, pkg.lat, pkg.lng),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}