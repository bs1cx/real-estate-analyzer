'use client';

import { useMemo } from 'react';

import { Circle, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

type MapViewProps = {
  city?: string;
  district?: string;
  neighbourhood?: string;
  listingsCount: number;
};

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  istanbul: { lat: 41.0082, lng: 28.9784 },
  ankara: { lat: 39.9334, lng: 32.8597 },
  izmir: { lat: 38.4237, lng: 27.1428 },
};

const fallbackCenter = { lat: 39.0, lng: 35.0 };

export function MapView({ city, district, neighbourhood, listingsCount }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  const loaderOptions = useMemo(
    () => ({
      id: 'google-map-script',
      googleMapsApiKey: apiKey || 'placeholder',
    }),
    [apiKey],
  );

  const { isLoaded } = useJsApiLoader(loaderOptions);

  const center = useMemo(() => {
    if (!city) return fallbackCenter;
    const cityKey = city.toLowerCase();
    return cityCoordinates[cityKey] ?? fallbackCenter;
  }, [city]);

  if (!apiKey) {
    return (
      <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-700">
        Add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to render the interactive map.
      </section>
    );
  }

  if (!isLoaded) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading map…
      </section>
    );
  }

  const label = [city, district, neighbourhood].filter(Boolean).join(' › ') || 'Turkey';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Map View</h2>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <div className="mt-4 h-80 overflow-hidden rounded-xl">
        <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={center} zoom={11}>
          <Marker position={center} />
          <Circle
            center={center}
            radius={Math.max(listingsCount, 1) * 120}
            options={{
              strokeColor: '#2563EB',
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: '#2563EB',
              fillOpacity: 0.15,
            }}
          />
        </GoogleMap>
      </div>
    </section>
  );
}

