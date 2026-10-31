import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Navigation,
  Compass,
  Building2,
  Stethoscope,
  Clock,
  Shield,
  Activity,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useTranslation } from '@/services/i18n';

interface Facility {
  id: string;
  name: string;
  type: 'PHC' | 'Sub-Centre' | 'Rural Hospital' | 'District Hospital';
  taluka: string;
  district: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  phone: string;
  timings: string;
  services: string[];
  ayushmanMitraDesk: boolean;
  emergencyCare24x7: boolean;
}

/**
 * Punjab Public Healthcare Facilities Network
 * Centered around Ludhiana, Jalandhar, and SAS Nagar (Mohali) districts
 */
const PUNJAB_FACILITIES: Facility[] = [
  {
    id: 'ch-ludhiana',
    name: 'Civil Hospital Ludhiana (District Hospital)',
    type: 'District Hospital',
    taluka: 'Ludhiana Central',
    district: 'Ludhiana, Punjab',
    distanceKm: 2.4,
    latitude: 30.9010,
    longitude: 75.8573,
    phone: '0161-2444108',
    timings: '24 Hours Emergency / OPD 8:00 AM - 2:00 PM',
    services: ['24x7 Emergency Trauma', 'General & Laparoscopic Surgery', 'ICU & Blood Bank', 'Post-Op Wound Dressing', 'Ayushman Bharat PM-JAY / AB-MMJBY Kiosk', 'Free Generic Pharmacy'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-sahnewal',
    name: 'Community Health Centre (CHC) Sahnewal',
    type: 'Rural Hospital',
    taluka: 'Sahnewal Block',
    district: 'Ludhiana, Punjab',
    distanceKm: 6.8,
    latitude: 30.8460,
    longitude: 75.9870,
    phone: '0161-2844102',
    timings: '24x7 Emergency & Inpatient Care',
    services: ['Emergency First Aid', 'Surgical Wound Follow-up', 'X-Ray & Pathology Lab', 'Inpatient Ward', 'Free Essential Medicines', 'ASHA Escalation Center'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-dehlon',
    name: 'Primary Health Centre (PHC) Dehlon',
    type: 'PHC',
    taluka: 'Dehlon Block',
    district: 'Ludhiana, Punjab',
    distanceKm: 9.1,
    latitude: 30.7620,
    longitude: 75.8750,
    phone: '0161-2856210',
    timings: '24 Hours Emergency / OPD 8:30 AM - 2:00 PM',
    services: ['Medical Officer OPD', 'Post-Op Suture Removal', 'DOTS TB Center', 'Diabetes & BP Screening', 'Maternal Care (JSSK)'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'aac-gill',
    name: 'Aam Aadmi Clinic / Sub-Centre Gill Village',
    type: 'Sub-Centre',
    taluka: 'Gill Block',
    district: 'Ludhiana, Punjab',
    distanceKm: 4.2,
    latitude: 30.8520,
    longitude: 75.8450,
    phone: '0161-2812110',
    timings: '8:00 AM - 2:00 PM (ANM & Medical Officer Station)',
    services: ['80+ Free Diagnostic Tests', '100+ Free Essential Medicines', 'Vitals & Blood Sugar Monitoring', 'ANM Immunization', 'Teleconsultation with District Hospital'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },
  {
    id: 'sdh-jagraon',
    name: 'Sub-Divisional Hospital (SDH) Jagraon',
    type: 'Rural Hospital',
    taluka: 'Jagraon',
    district: 'Ludhiana, Punjab',
    distanceKm: 18.5,
    latitude: 30.7850,
    longitude: 75.4780,
    phone: '01624-222108',
    timings: '24x7 Emergency Care',
    services: ['Minor Surgery', 'Post-Op Follow-up', 'Maternal Delivery (JSSK)', 'X-Ray & ECG', 'Ayushman Bharat Helpdesk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'ch-jalandhar',
    name: 'Shaheed Babu Labh Singh Civil Hospital Jalandhar',
    type: 'District Hospital',
    taluka: 'Jalandhar City',
    district: 'Jalandhar, Punjab',
    distanceKm: 28.0,
    latitude: 31.3260,
    longitude: 75.5762,
    phone: '0181-2224108',
    timings: '24 Hours Emergency / OPD 8:00 AM - 2:00 PM',
    services: ['Multi-specialty Surgical Care', 'Trauma ICU & Dialysis', 'Comprehensive Lab Services', 'Ayushman Bharat Mitra Kiosk', 'Emergency Ambulance Dispatch'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'ch-mohali',
    name: 'Civil Hospital Phase 6 (SAS Nagar Mohali)',
    type: 'District Hospital',
    taluka: 'Mohali',
    district: 'SAS Nagar, Punjab',
    distanceKm: 34.0,
    latitude: 30.7160,
    longitude: 76.7120,
    phone: '0172-2272108',
    timings: '24x7 Emergency & Trauma Care',
    services: ['Advanced Post-Surgical Follow-up', 'Surgical ICU', 'Cardiology & Ortho OPD', 'PM-JAY Empanelled Services'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
];

export const FacilitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const [facilities, setFacilities] = useState<Facility[]>(PUNJAB_FACILITIES);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('GPS is not supported by your browser. Showing Punjab health network.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(coords);
        setIsLocating(false);

        // Update distance dynamically
        const updated = PUNJAB_FACILITIES.map((f) => ({
          ...f,
          distanceKm: calculateDistance(coords.lat, coords.lng, f.latitude, f.longitude),
        })).sort((a, b) => a.distanceKm - b.distanceKm);

        setFacilities(updated);
      },
      (error) => {
        setIsLocating(false);
        setLocationError('Unable to retrieve current GPS. Displaying standard Punjab regional facilities.');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const filteredFacilities = facilities.filter((f) => {
    if (selectedType !== 'ALL' && f.type !== selectedType) return false;
    if (searchQuery.trim() === '') return true;
    return (
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.taluka.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Refined Hero Header */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 sm:p-8 shadow-card border border-navy-700 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-800 text-brand-red text-xs font-semibold tracking-wide border border-navy-600">
            <Building2 className="w-3.5 h-3.5" />
            <span>Punjab Public Health Infrastructure</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Nearby PHCs & Public Health Facilities
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Discover verified Primary Health Centres, Aam Aadmi Clinics, Community Health Centres, and Civil Hospitals across Punjab for post-discharge wound care, dressing, suture removal, and emergency escalations.
          </p>

          {/* Emergency Helpline Shortcuts */}
          <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href="tel:108"
              className="inline-flex items-center gap-2 bg-clinical-red hover:bg-red-700 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-button shadow-sm transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>Dial 108 (Ambulance)</span>
            </a>
            <a
              href="tel:104"
              className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs sm:text-sm font-medium px-4 py-2 rounded-button border border-navy-600 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Dial 104 (Punjab Medical Helpline)</span>
            </a>
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs sm:text-sm font-medium px-4 py-2 rounded-button border border-navy-600 transition-colors"
            >
              <Phone className="w-4 h-4 text-blue-400" />
              <span>Dial 112 (National Emergency)</span>
            </a>
          </div>
        </div>
      </div>

      {/* GPS Location Status Bar */}
      <div className="bg-white border border-surface-border rounded-xl p-4 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-navy-900 flex-shrink-0">
            <MapPin className="w-5 h-5 text-brand-red" />
          </div>
          <div>
            <div className="text-xs font-semibold text-navy-900">
              {userLocation ? 'Location Active (GPS Locked)' : 'Location Mode: Regional Punjab Directory'}
            </div>
            <div className="text-xs text-content-secondary">
              {locationError
                ? locationError
                : userLocation
                ? `Distances calibrated from your location (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
                : 'Showing standard facilities around Ludhiana, Sahnewal, Jalandhar & Mohali blocks.'}
            </div>
          </div>
        </div>
        <button
          onClick={handleGetLocation}
          disabled={isLocating}
          className="rc-btn-secondary text-xs px-3.5 py-1.5 w-full sm:w-auto"
        >
          <Compass className={`w-4 h-4 text-navy-900 ${isLocating ? 'animate-spin' : ''}`} />
          <span>{isLocating ? 'Calculating GPS...' : 'Use My Current Location'}</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            placeholder="Search facility name, block, or service (e.g. Suture removal, Dressing, X-Ray)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-surface-border rounded-input focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red shadow-subtle placeholder:text-content-muted"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { label: 'All Facilities', value: 'ALL' },
            { label: 'PHC', value: 'PHC' },
            { label: 'Sub-Centre / AAC', value: 'Sub-Centre' },
            { label: 'CHC / Rural Hospital', value: 'Rural Hospital' },
            { label: 'District Hospital', value: 'District Hospital' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedType(tab.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedType === tab.value
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-white border border-surface-border text-navy-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFacilities.map((facility) => (
          <div
            key={facility.id}
            className="rc-card p-5 hover:border-slate-300 transition-all duration-150 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        facility.type === 'District Hospital'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : facility.type === 'Rural Hospital'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : facility.type === 'PHC'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {facility.type}
                    </span>
                    {facility.emergencyCare24x7 && (
                      <span className="text-[10px] font-medium bg-red-50 text-clinical-red border border-red-200 px-1.5 py-0.5 rounded">
                        24x7 Emergency
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-navy-900 pt-1">
                    {facility.name}
                  </h3>
                  <div className="text-xs text-content-secondary flex items-center gap-1.5 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-content-muted flex-shrink-0" />
                    <span>{facility.taluka}, {facility.district}</span>
                  </div>
                </div>

                {/* Distance Badge */}
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-navy-900">{facility.distanceKm} km</div>
                  <div className="text-[10px] text-content-muted">approx</div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="text-xs text-navy-800 bg-surface-subtle p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-content-muted flex-shrink-0" />
                <span>{facility.timings}</span>
              </div>

              {/* Services Tags */}
              <div className="space-y-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-content-muted">
                  Available Care & Facilities:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {facility.services.map((svc, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-slate-100 text-navy-800 px-2 py-0.5 rounded border border-slate-200/60"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between gap-2">
              <a
                href={`tel:${facility.phone}`}
                className="rc-btn-secondary text-xs py-1.5 flex-1"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call {facility.phone}</span>
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rc-btn-primary text-xs py-1.5 flex-1"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filteredFacilities.length === 0 && (
        <div className="bg-white border border-surface-border rounded-2xl p-8 text-center space-y-2">
          <Building2 className="w-10 h-10 text-content-muted mx-auto" />
          <h4 className="text-base font-semibold text-navy-900">No facilities match your search</h4>
          <p className="text-xs text-content-secondary max-w-md mx-auto">
            Try adjusting your search keywords or switch category filter to "All Facilities" to view all available Punjab public health centres.
          </p>
        </div>
      )}
    </div>
  );
};
