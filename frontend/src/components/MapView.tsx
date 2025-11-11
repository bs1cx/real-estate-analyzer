'use client';

import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { useMemo } from 'react';

type MapViewProps = {
  city?: string;
  neighbourhood?: string;
};

const fallbackCenter = { lat: 41.015137, lng: 28.97953 }; // Istanbul

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
};

export function MapView({ city, neighbourhood }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey ?? '',
  });

  const center = useMemo(() => {
    if (!city) {
      return fallbackCenter;
    }

    switch (city.toLowerCase()) {
      case 'istanbul':
        return { lat: 41.015137, lng: 28.97953 };
      case 'ankara':
        return { lat: 39.925533, lng: 32.866287 };
      case 'izmir':
        return { lat: 38.423733, lng: 27.142826 };
      default:
        return fallbackCenter;
    }
  }, [city]);

  if (!apiKey) {
    return (
      <section className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
        Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in your environment to enable the interactive map.
      </section>
    );
  }

  if (!isLoaded) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Loading map…
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Listings Map</h2>
        <span className="text-xs text-slate-500">
          {neighbourhood ?? city ?? 'No location filter'}
        </span>
      </div>
      <GoogleMap mapContainerStyle={{ width: '100%', height: '320px' }} center={center} zoom={12} options={mapOptions}>
        <MarkerF position={center} />
      </GoogleMap>
    </section>
  );
}


