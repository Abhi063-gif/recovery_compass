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
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  type: 'PHC' | 'Sub-Centre' | 'Rural Hospital' | 'District Hospital';
  taluka: string;
  district: string;
  distanceKm: number; // dynamically computed or fallback
  latitude: number;
  longitude: number;
  phone: string;
  timings: string;
  services: string[];
  ayushmanMitraDesk: boolean;
  emergencyCare24x7: boolean;
}

const RURAL_FACILITIES: Facility[] = [
  {
    id: 'phc-koregaon',
    name: 'Primary Health Centre (PHC) Koregaon Bhima',
    type: 'PHC',
    taluka: 'Shirur',
    district: 'Pune, Maharashtra',
    distanceKm: 3.2,
    latitude: 18.6542,
    longitude: 74.0628,
    phone: '02138-234120',
    timings: '24 Hours Emergency / OPD 8:00 AM - 1:00 PM',
    services: ['OPD Consultation', 'Post-Op Wound Dressing', 'Maternal Delivery', 'DOTS TB Center', 'Essential Medicines'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sc-sanaswadi',
    name: 'Sub-Centre Sanaswadi',
    type: 'Sub-Centre',
    taluka: 'Shirur',
    district: 'Pune, Maharashtra',
    distanceKm: 5.8,
    latitude: 18.6678,
    longitude: 74.1205,
    phone: '02138-256110',
    timings: '9:00 AM - 5:00 PM (ANM Station)',
    services: ['ANM Immunization', 'Vitals & Sugar Check', 'Antenatal Checkups', 'Oral Rehydration & Paracetamol'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },
  {
    id: 'rh-shirur',
    name: 'Rural Hospital (RH) Shirur',
    type: 'Rural Hospital',
    taluka: 'Shirur',
    district: 'Pune, Maharashtra',
    distanceKm: 14.5,
    latitude: 18.8271,
    longitude: 74.3789,
    phone: '02138-222108',
    timings: '24x7 Emergency & Inpatient Care',
    services: ['Minor Surgery', 'General Surgery Follow-up', 'X-Ray & Pathology Lab', 'Blood Storage Unit', 'MJPJAY Desk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-wagholi',
    name: 'Primary Health Centre (PHC) Wagholi Rural',
    type: 'PHC',
    taluka: 'Haveli',
    district: 'Pune, Maharashtra',
    distanceKm: 8.4,
    latitude: 18.5808,
    longitude: 73.9787,
    phone: '020-27051102',
    timings: '24 Hours Emergency / OPD 8:30 AM - 2:00 PM',
    services: ['Medical Officer OPD', 'Wound Debridement', 'TB Sputum Testing', 'Free Generic Pharmacy', 'ECG'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'dh-aundh',
    name: 'District Hospital Aundh (Pune District)',
    type: 'District Hospital',
    taluka: 'Pune City',
    district: 'Pune, Maharashtra',
    distanceKm: 22.0,
    latitude: 18.5626,
    longitude: 73.8087,
    phone: '020-27282245',
    timings: '24x7 Tertiary Referral Care',
    services: ['Specialist OPD (Surgery, OBGYN, Med)', 'ICU & High Dependency Unit', 'Ayushman Bharat Golden Card Unit', 'CT Scan & Ultrasound'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
];

// Offline Haversine Formula (Calculates distance without internet)
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const FacilitiesPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>(RURAL_FACILITIES);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Using default district coordinates');

  // Request browser GPS (works offline with device GPS chip)
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });
          setLocationStatus('GPS located (Live Device Distance)');

          // Recalculate distance for each facility
          const updated = RURAL_FACILITIES.map((f) => ({
            ...f,
            distanceKm: calculateHaversineDistance(lat, lng, f.latitude, f.longitude),
          })).sort((a, b) => a.distanceKm - b.distanceKm);

          setFacilities(updated);
        },
        () => {
          setLocationStatus('GPS unavailable — showing standard Taluka facilities');
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    }
  }, []);

  const filteredFacilities = facilities.filter((f) => {
    if (selectedType === 'ALL') return true;
    return f.type === selectedType;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-card space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-700/60 text-sky-200 text-[11px] font-semibold tracking-wide uppercase border border-sky-500/30">
          <MapPin className="w-3.5 h-3.5 text-sky-300" />
          <span>Rural Care Navigation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Nearby PHCs & Public Health Facilities
        </h1>
        <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl leading-relaxed">
          Locate your nearest Primary Health Centre, Sub-Centre, or Government Hospital for wound dressing, medicine refills, and emergency care. Cached for full offline use.
        </p>

        {/* Emergency Ambulance Hotlines */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <a
            href="tel:108"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Phone className="w-3.5 h-3.5" />
            Dial 108 (Free Emergency Ambulance)
          </a>
          <a
            href="tel:102"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Phone className="w-3.5 h-3.5" />
            Dial 102 (Pregnancy / Janani Express)
          </a>
          <a
            href="tel:104"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Phone className="w-3.5 h-3.5" />
            Dial 104 (National Health Helpline)
          </a>
        </div>
      </div>

      {/* Filter and Location Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-card text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <Compass className="w-4 h-4 text-sky-600" />
          <span className="font-medium">{locationStatus}</span>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'PHC', 'Sub-Centre', 'Rural Hospital', 'District Hospital'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                selectedType === type
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Facilities' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Facility Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFacilities.map((fac) => (
          <div
            key={fac.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-card hover:border-sky-300 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 uppercase">
                    {fac.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{fac.name}</h3>
                  <p className="text-xs text-slate-500">
                    {fac.taluka} Taluka, {fac.district}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-base font-black text-slate-900">{fac.distanceKm}</span>
                  <span className="text-[11px] text-slate-400 font-bold block">km away</span>
                </div>
              </div>

              {/* Timing */}
              <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{fac.timings}</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                {fac.emergencyCare24x7 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    24x7 Emergency
                  </span>
                )}
                {fac.ayushmanMitraDesk && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Ayushman Mitra Desk
                  </span>
                )}
              </div>

              {/* Services List */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Available Services:
                </span>
                <p className="text-[11px] text-slate-600">{fac.services.join(' • ')}</p>
              </div>
            </div>

            {/* Actions: Call & Map Navigation */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <a
                href={`tel:${fac.phone}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Call Facility
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${fac.latitude},${fac.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold rounded-xl transition border border-sky-200"
              >
                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                Open in Maps
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Telemedicine Section (PRD G3) */}
      <div className="bg-indigo-50/70 rounded-3xl p-6 border border-indigo-100 space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-indigo-950">
            eSanjeevani — Free National Teleconsultation Service
          </h2>
        </div>
        <p className="text-xs text-indigo-900/80 leading-relaxed">
          If distance or transport prevents visiting the hospital, you can connect directly to a government medical officer from your mobile phone via eSanjeevani.
        </p>
        <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
          <a
            href="https://esanjeevani.mohfw.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-1.5"
          >
            Open eSanjeevani Portal <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="tel:104"
            className="px-4 py-2 bg-white text-indigo-800 font-bold rounded-xl border border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-indigo-600" />
            Speak to a Tele-Doctor (Dial 104)
          </a>
        </div>
      </div>
    </div>
  );
};
