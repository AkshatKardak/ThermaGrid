import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_STYLE_URL } from '../../config/map';

interface MapViewProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  pitch?: number;
  height?: number | string;
}

export function MapView({
  center = [72.8777, 19.076],
  zoom = 9,
  pitch = 45,
  height = '100%',
}: MapViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: ref.current,
      style: MAP_STYLE_URL,
      center,
      zoom,
      pitch,
      attributionControl: { compact: false },
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height }}
      className="rounded-xl overflow-hidden shadow-inner"
    />
  );
}
