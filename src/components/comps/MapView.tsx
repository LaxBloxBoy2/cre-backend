'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { MarketComp } from '@/types/marketComp';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';

interface MapViewProps {
  comps: MarketComp[];
  center: { lat: number; lng: number };
  onCenterChange: (center: { lat: number; lng: number }) => void;
  onAddToUnderwriting: (compId: string) => void;
}

export function MapView({ comps, center, onCenterChange, onAddToUnderwriting }: MapViewProps) {
  const { theme } = useTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedComp, setSelectedComp] = useState<MarketComp | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.google?.maps) {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    const mapOptions: google.maps.MapOptions = {
      center: center,
      zoom: 13,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      styles: theme === 'dark' ? darkMapStyle : lightMapStyle,
    };

    const map = new google.maps.Map(mapContainerRef.current, mapOptions);
    mapRef.current = map;

    // Listen for center changes
    map.addListener('dragend', () => {
      const newCenter = map.getCenter();
      if (newCenter) {
        onCenterChange({ lat: newCenter.lat(), lng: newCenter.lng() });
      }
    });

    return () => {
      // Clean up markers
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);
    };
  }, [mapLoaded, theme]);

  // Update map theme when theme changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    mapRef.current.setOptions({
      styles: theme === 'dark' ? darkMapStyle : lightMapStyle,
    });
  }, [theme, mapLoaded]);

  // Add markers for comps
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !comps.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Create new markers
    comps.forEach(comp => {
      const marker = new google.maps.Marker({
        position: { lat: comp.latitude, lng: comp.longitude },
        map: mapRef.current,
        title: `${comp.property_type} - ${formatCurrency(comp.price || 0)}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: getMarkerColor(comp.property_type),
          fillOpacity: 0.7,
          strokeWeight: 2,
          strokeColor: theme === 'dark' ? '#ffffff' : '#000000',
        },
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedComp(comp);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    return () => {
      // Clean up markers
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [comps, mapLoaded, theme]);

  // Function to get marker color based on property type
  function getMarkerColor(propertyType: string): string {
    switch (propertyType.toLowerCase()) {
      case 'multifamily':
        return '#4CAF50'; // Green
      case 'office':
        return '#2196F3'; // Blue
      case 'retail':
        return '#FFC107'; // Amber
      case 'industrial':
        return '#FF5722'; // Deep Orange
      default:
        return '#9C27B0'; // Purple
    }
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {selectedComp && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{selectedComp.property_type}</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Location:</span> {selectedComp.city}, {selectedComp.state} {selectedComp.zipcode}</p>
                {selectedComp.price && <p><span className="font-medium">Price:</span> {formatCurrency(selectedComp.price)}</p>}
                {selectedComp.rent && <p><span className="font-medium">Rent:</span> {formatCurrency(selectedComp.rent)}/month</p>}
                {selectedComp.beds && <p><span className="font-medium">Beds:</span> {selectedComp.beds}</p>}
                {selectedComp.baths && <p><span className="font-medium">Baths:</span> {selectedComp.baths}</p>}
                {selectedComp.sqft && <p><span className="font-medium">Square Feet:</span> {selectedComp.sqft.toLocaleString()}</p>}
                <p><span className="font-medium">Source:</span> {selectedComp.source}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedComp(null)}
              >
                Close
              </Button>
              <Button 
                size="sm"
                className="bg-accent text-white hover:bg-accent/90"
                onClick={() => onAddToUnderwriting(selectedComp.id)}
              >
                Add to Underwriting
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

// Map styles
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

const lightMapStyle = [
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ visibility: 'on' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'simplified' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
];
