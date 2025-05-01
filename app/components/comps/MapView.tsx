'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { useTheme } from 'next-themes';

// Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBFeoci6_ljioZwmHt5FAWigaLaURy4w6Y';

interface MapViewProps {
  comps: any[];
  center: { lat: number; lng: number };
  onCenterChange: (center: { lat: number; lng: number }) => void;
  onAddToUnderwriting: (compId: string) => void;
}

// Light mode map styles
const lightMapStyles = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#c9c9c9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
];

// Dark mode map styles
const darkMapStyles = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1A1D23"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1A1D23"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6b6b6b"
      }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#1F2329"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6b6b6b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6b6b6b"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#0F1117"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#6b6b6b"
      }
    ]
  }
];

export function MapView({ comps, center, onCenterChange, onAddToUnderwriting }: MapViewProps) {
  const { theme } = useTheme();
  const mapRef = useRef<google.maps.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedComp, setSelectedComp] = useState<any | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps script loaded');
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.google?.maps) {
      console.log('Google Maps already loaded');
      setMapLoaded(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    console.log('Initializing map with center:', center);
    console.log('Current theme:', theme);
    setIsLoading(true);

    try {
      // Force theme to be recognized correctly
      const isDarkMode = theme === 'dark';
      console.log('Is dark mode during initialization:', isDarkMode);

      const currentStyles = isDarkMode ? darkMapStyles : lightMapStyles;
      console.log('Using map styles for:', isDarkMode ? 'dark mode' : 'light mode');

      const mapOptions: google.maps.MapOptions = {
        center: center,
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
        styles: currentStyles,
      };

      const map = new google.maps.Map(mapContainerRef.current, mapOptions);
      mapRef.current = map;

      // Listen for center changes
      map.addListener('dragend', () => {
        const newCenter = map.getCenter();
        if (newCenter) {
          const newCenterObj = { lat: newCenter.lat(), lng: newCenter.lng() };
          console.log('Map center changed:', newCenterObj);
          onCenterChange(newCenterObj);
        }
      });

      console.log('Map initialized');
    } catch (error) {
      console.error('Error initializing map:', error);
    } finally {
      setIsLoading(false);
    }

    return () => {
      // Clean up markers
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);
    };
  }, [mapLoaded, center]); // Remove theme dependency to prevent full re-initialization

  // Update map styles when theme changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    console.log('Theme changed to:', theme);
    // Force theme to be recognized correctly
    const isDarkMode = theme === 'dark';
    console.log('Is dark mode:', isDarkMode);

    const currentStyles = isDarkMode ? darkMapStyles : lightMapStyles;
    console.log('Applying styles for:', isDarkMode ? 'dark mode' : 'light mode');

    try {
      // Apply the styles with a slight delay to ensure the map is fully loaded
      const applyStyles = () => {
        if (mapRef.current) {
          mapRef.current.setOptions({
            styles: currentStyles
          });
          console.log('Map styles updated successfully');
        }
      };

      // Apply immediately and then again after a delay to ensure it takes effect
      applyStyles();
      setTimeout(applyStyles, 100);
      setTimeout(applyStyles, 500);
    } catch (error) {
      console.error('Error updating map styles:', error);
    }
  }, [theme, mapLoaded]);

  // Force map style update when component mounts and whenever the map is idle
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const isDarkMode = theme === 'dark';
    console.log('Setting up map idle listener for theme:', isDarkMode ? 'dark' : 'light');

    const currentStyles = isDarkMode ? darkMapStyles : lightMapStyles;

    // Apply styles when map becomes idle (fully loaded)
    const idleListener = mapRef.current.addListener('idle', () => {
      console.log('Map is idle, applying theme styles');
      if (mapRef.current) {
        mapRef.current.setOptions({
          styles: currentStyles
        });
      }
    });

    // Apply initial styles
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.setOptions({
          styles: currentStyles
        });
        console.log('Initial map styles applied after timeout');
      }
    }, 1000);

    return () => {
      // Clean up listener
      if (idleListener) {
        google.maps.event.removeListener(idleListener);
      }
    };
  }, [mapLoaded, theme]);

  // Add markers for comps
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !comps.length) return;

    console.log('Adding markers for comps:', comps.length);

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Create new markers
    comps.forEach(comp => {
      try {
        // Create a custom SVG marker
        const markerColor = getMarkerColor(comp.property_type);
        const svgMarker = {
          path: 'M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z',
          fillColor: markerColor,
          fillOpacity: 0.9,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
          rotation: 0,
          scale: 2,
          anchor: new google.maps.Point(12, 22),
          labelOrigin: new google.maps.Point(12, 9)
        };

        const marker = new google.maps.Marker({
          position: { lat: comp.latitude, lng: comp.longitude },
          map: mapRef.current,
          title: `${comp.property_type} - $${comp.price?.toLocaleString() || 'N/A'}`,
          icon: svgMarker,
          animation: google.maps.Animation.DROP,
          zIndex: comp.price ? Math.floor(comp.price / 10000) : 1 // Higher priced properties appear on top
        });

        // Add hover effect
        marker.addListener('mouseover', () => {
          marker.setIcon({
            ...svgMarker,
            scale: 2.5, // Make it slightly larger on hover
            fillOpacity: 1.0
          });
        });

        marker.addListener('mouseout', () => {
          marker.setIcon(svgMarker);
        });

        // Add click listener
        marker.addListener('click', () => {
          console.log('Marker clicked:', comp);
          setSelectedComp(comp);

          // Center the map on the clicked marker with a slight offset for the info card
          if (mapRef.current) {
            mapRef.current.panTo({
              lat: comp.latitude,
              lng: comp.longitude + 0.005 // Slight offset to make room for the card
            });
          }
        });

        newMarkers.push(marker);
      } catch (error) {
        console.error('Error creating marker for comp:', comp, error);
      }
    });

    setMarkers(newMarkers);
    console.log('Added markers:', newMarkers.length);

    return () => {
      // Clean up markers
      newMarkers.forEach(marker => marker.setMap(null));
    };
  }, [comps, mapLoaded]);

  // Function to get marker color based on property type
  function getMarkerColor(propertyType: string): string {
    switch (propertyType?.toLowerCase()) {
      case 'multifamily':
        return '#00C79A'; // Teal (matches accent color)
      case 'office':
        return '#3B82F6'; // Bright Blue
      case 'retail':
        return '#F59E0B'; // Amber
      case 'industrial':
        return '#EF4444'; // Red
      default:
        return '#8B5CF6'; // Purple
    }
  }

  // Format currency
  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (isLoading && !mapLoaded) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-white dark:bg-[#1e1e1e]">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-4 mx-auto border-accent"></div>
          <p className="text-gray-800 dark:text-white">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend */}
      <div className="absolute top-4 left-4 p-3 rounded-md shadow-md z-10 opacity-95 bg-white dark:bg-[#1e1e1e] text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700">
        <div className="text-sm font-semibold mb-2">Property Types</div>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getMarkerColor('multifamily') }}></div>
            <span className="text-xs text-gray-800 dark:text-white">Multifamily</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getMarkerColor('office') }}></div>
            <span className="text-xs text-gray-800 dark:text-white">Office</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getMarkerColor('retail') }}></div>
            <span className="text-xs text-gray-800 dark:text-white">Retail</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getMarkerColor('industrial') }}></div>
            <span className="text-xs text-gray-800 dark:text-white">Industrial</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: getMarkerColor('other') }}></div>
            <span className="text-xs text-gray-800 dark:text-white">Other</span>
          </div>
        </div>
      </div>

      {selectedComp && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96">
          <Card className="shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e]" style={{ borderTopColor: getMarkerColor(selectedComp.property_type), borderTopWidth: '4px' }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl flex items-center justify-between">
                <span className="text-gray-800 dark:text-white">{selectedComp.property_type}</span>
                {selectedComp.price && (
                  <span className="text-lg font-bold" style={{ color: getMarkerColor(selectedComp.property_type) }}>
                    {formatCurrency(selectedComp.price)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-2">
                <div className="flex items-center text-sm mb-2">
                  <svg className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-800 dark:text-white">{selectedComp.city}, {selectedComp.state} {selectedComp.zipcode}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3">
                  {selectedComp.sqft && (
                    <div className="text-center p-2 bg-gray-100 dark:bg-[#111] rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Size</div>
                      <div className="font-bold text-gray-800 dark:text-white">{selectedComp.sqft.toLocaleString()} SF</div>
                    </div>
                  )}

                  {selectedComp.beds && (
                    <div className="text-center p-2 bg-gray-100 dark:bg-[#111] rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Beds</div>
                      <div className="font-bold text-gray-800 dark:text-white">{selectedComp.beds}</div>
                    </div>
                  )}

                  {selectedComp.baths && (
                    <div className="text-center p-2 bg-gray-100 dark:bg-[#111] rounded-md border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Baths</div>
                      <div className="font-bold text-gray-800 dark:text-white">{selectedComp.baths}</div>
                    </div>
                  )}
                </div>

                {selectedComp.rent && (
                  <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-[#111] rounded-md border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                    <span className="font-bold text-gray-800 dark:text-white">{formatCurrency(selectedComp.rent)}</span>
                  </div>
                )}

                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Source: {selectedComp.source} • Added: {new Date(selectedComp.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedComp(null)}
                className="border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Close
              </Button>
              <Button
                size="sm"
                style={{
                  backgroundColor: getMarkerColor(selectedComp.property_type),
                  color: 'white'
                }}
                className="hover:opacity-90 shadow-sm"
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
