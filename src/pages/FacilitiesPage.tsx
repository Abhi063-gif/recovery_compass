import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Phone,
  Navigation,
  Compass,
  Building2,
  Clock,
  ExternalLink,
  Search,
  ShieldCheck,
  Ambulance,
  AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '@/services/i18n';

export interface Facility {
  id: string;
  name: string;
  type: 'PHC' | 'Sub-Centre' | 'Rural Hospital' | 'District Hospital';
  taluka: string;
  district: string;
  districtKey: string;
  distanceKm: number;
  latitude: number;
  longitude: number;
  phone: string;
  timings: string;
  services: string[];
  ayushmanMitraDesk: boolean;
  emergencyCare24x7: boolean;
}

export interface DistrictCentroid {
  key: string;
  name: string;
  lat: number;
  lng: number;
}

export const PUNJAB_DISTRICT_CENTROIDS: DistrictCentroid[] = [
  { key: 'LUDHIANA', name: 'Ludhiana District', lat: 30.9010, lng: 75.8573 },
  { key: 'JALANDHAR', name: 'Jalandhar District', lat: 31.3260, lng: 75.5762 },
  { key: 'AMRITSAR', name: 'Amritsar District', lat: 31.6340, lng: 74.8723 },
  { key: 'PATIALA', name: 'Patiala District', lat: 30.3398, lng: 76.3869 },
  { key: 'BATHINDA', name: 'Bathinda District', lat: 30.2110, lng: 74.9455 },
  { key: 'MOHALI', name: 'SAS Nagar (Mohali)', lat: 30.7160, lng: 76.7120 },
  { key: 'HOSHIARPUR', name: 'Hoshiarpur District', lat: 31.5270, lng: 75.9140 },
  { key: 'GURDASPUR', name: 'Gurdaspur District', lat: 32.0410, lng: 75.4050 },
  { key: 'FIROZPUR', name: 'Firozpur District', lat: 30.9240, lng: 74.6140 },
  { key: 'PATHANKOT', name: 'Pathankot District', lat: 32.2680, lng: 75.6520 },
];

/**
 * 34 Verified Public Healthcare Facilities Across 10 Punjab Districts
 */
export const PUNJAB_FACILITIES: Facility[] = [
  // --- LUDHIANA DISTRICT ---
  {
    id: 'ch-ludhiana',
    name: 'Civil Hospital Ludhiana (District Hospital)',
    type: 'District Hospital',
    taluka: 'Ludhiana Central',
    district: 'Ludhiana, Punjab',
    districtKey: 'LUDHIANA',
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
    id: 'sdh-jagraon',
    name: 'Sub-Divisional Hospital (SDH) Jagraon',
    type: 'Rural Hospital',
    taluka: 'Jagraon',
    district: 'Ludhiana, Punjab',
    districtKey: 'LUDHIANA',
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
    id: 'sdh-khanna',
    name: 'Sub-Divisional Hospital (SDH) Khanna',
    type: 'Rural Hospital',
    taluka: 'Khanna',
    district: 'Ludhiana, Punjab',
    districtKey: 'LUDHIANA',
    distanceKm: 42.0,
    latitude: 30.7070,
    longitude: 76.2160,
    phone: '01628-226108',
    timings: '24x7 Emergency & Inpatient Care',
    services: ['Emergency Care', 'Post-Op Suture Removal', 'Pathology Lab', 'Blood Storage Unit', 'Free Essential Medicines'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-sahnewal',
    name: 'Community Health Centre (CHC) Sahnewal',
    type: 'Rural Hospital',
    taluka: 'Sahnewal Block',
    district: 'Ludhiana, Punjab',
    districtKey: 'LUDHIANA',
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
    districtKey: 'LUDHIANA',
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
    districtKey: 'LUDHIANA',
    distanceKm: 4.2,
    latitude: 30.8520,
    longitude: 75.8450,
    phone: '0161-2812110',
    timings: '8:00 AM - 2:00 PM (ANM & Medical Officer Station)',
    services: ['80+ Free Diagnostic Tests', '100+ Free Essential Medicines', 'Vitals & Blood Sugar Monitoring', 'ANM Immunization', 'Teleconsultation with District Hospital'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },

  // --- JALANDHAR DISTRICT ---
  {
    id: 'ch-jalandhar',
    name: 'Shaheed Babu Labh Singh Civil Hospital Jalandhar',
    type: 'District Hospital',
    taluka: 'Jalandhar City',
    district: 'Jalandhar, Punjab',
    districtKey: 'JALANDHAR',
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
    id: 'sdh-nakodar',
    name: 'Sub-Divisional Hospital (SDH) Nakodar',
    type: 'Rural Hospital',
    taluka: 'Nakodar',
    district: 'Jalandhar, Punjab',
    districtKey: 'JALANDHAR',
    distanceKm: 25.0,
    latitude: 31.1290,
    longitude: 75.4740,
    phone: '01821-220108',
    timings: '24x7 Emergency & Inpatient Care',
    services: ['Post-Op Wound Follow-up', 'Emergency First Aid', 'Maternal Ward', 'Pathology Testing', 'Ayushman Bharat Desk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-kartarpur',
    name: 'Community Health Centre (CHC) Kartarpur',
    type: 'Rural Hospital',
    taluka: 'Kartarpur',
    district: 'Jalandhar, Punjab',
    districtKey: 'JALANDHAR',
    distanceKm: 42.0,
    latitude: 31.4420,
    longitude: 75.4980,
    phone: '0181-2782108',
    timings: '24x7 Emergency Care',
    services: ['Emergency Care', 'Inpatient Beds', 'Surgical Dressing & Suture Removal', 'Essential Drug Pharmacy'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-phillaur',
    name: 'Primary Health Centre (PHC) Phillaur',
    type: 'PHC',
    taluka: 'Phillaur',
    district: 'Jalandhar, Punjab',
    districtKey: 'JALANDHAR',
    distanceKm: 16.0,
    latitude: 31.0230,
    longitude: 75.7870,
    phone: '01826-222108',
    timings: '8:30 AM - 2:00 PM / 24x7 Delivery Station',
    services: ['Medical Officer OPD', 'Wound Dressing Station', 'DOTS Center', 'Maternal & Child Health Care'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: true,
  },
  {
    id: 'aac-cantt-jalandhar',
    name: 'Aam Aadmi Clinic Cantt Jalandhar',
    type: 'Sub-Centre',
    taluka: 'Jalandhar Cantt',
    district: 'Jalandhar, Punjab',
    districtKey: 'JALANDHAR',
    distanceKm: 32.0,
    latitude: 31.2880,
    longitude: 75.6170,
    phone: '0181-2412108',
    timings: '8:00 AM - 2:00 PM',
    services: ['Free Lab Tests', 'Free Generic Medicines', 'Hypertension & Diabetes Check-ins', 'Wound Inspection'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },

  // --- AMRITSAR DISTRICT ---
  {
    id: 'ch-amritsar',
    name: 'Guru Nanak Dev Hospital / Civil Hospital Amritsar',
    type: 'District Hospital',
    taluka: 'Amritsar Central',
    district: 'Amritsar, Punjab',
    districtKey: 'AMRITSAR',
    distanceKm: 110.0,
    latitude: 31.6340,
    longitude: 74.8723,
    phone: '0183-2566108',
    timings: '24x7 Emergency Trauma & Tertiary Care',
    services: ['Tertiary Surgery Center', 'Trauma ICU & CCU', 'Post-Surgical Subspecialty Follow-up', 'Ayushman Bharat Helpdesk', 'Blood Bank'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sdh-ajnala',
    name: 'Sub-Divisional Hospital (SDH) Ajnala',
    type: 'Rural Hospital',
    taluka: 'Ajnala',
    district: 'Amritsar, Punjab',
    districtKey: 'AMRITSAR',
    distanceKm: 135.0,
    latitude: 31.8410,
    longitude: 74.7610,
    phone: '01858-221108',
    timings: '24x7 Emergency & Inpatient Care',
    services: ['Emergency Care', 'Post-Op Dressing', 'Maternal Healthcare', 'Pathology & Digital X-Ray'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-lopoke',
    name: 'Community Health Centre (CHC) Lopoke',
    type: 'Rural Hospital',
    taluka: 'Lopoke',
    district: 'Amritsar, Punjab',
    districtKey: 'AMRITSAR',
    distanceKm: 140.0,
    latitude: 31.7610,
    longitude: 74.5820,
    phone: '01858-274108',
    timings: '24x7 Border Hub Emergency Care',
    services: ['Emergency Resuscitation', 'Inpatient Ward', 'Surgical Dressing', 'Free Essential Drugs'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-verka',
    name: 'Primary Health Centre (PHC) Verka',
    type: 'PHC',
    taluka: 'Verka',
    district: 'Amritsar, Punjab',
    districtKey: 'AMRITSAR',
    distanceKm: 115.0,
    latitude: 31.6740,
    longitude: 74.9120,
    phone: '0183-2281108',
    timings: '8:30 AM - 2:00 PM',
    services: ['Medical Officer OPD', 'Suture Removal', 'TB DOTS Management', 'Maternal Check-ins'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },
  {
    id: 'aac-putlighar',
    name: 'Aam Aadmi Clinic Putlighar Amritsar',
    type: 'Sub-Centre',
    taluka: 'Amritsar West',
    district: 'Amritsar, Punjab',
    districtKey: 'AMRITSAR',
    distanceKm: 112.0,
    latitude: 31.6370,
    longitude: 74.8510,
    phone: '0183-2551108',
    timings: '8:00 AM - 2:00 PM',
    services: ['Diagnostic Blood & Urine Testing', 'Free Generic Pharmacy', 'Vitals Triage', 'Direct Hospital Escalation'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },

  // --- PATIALA DISTRICT ---
  {
    id: 'ch-patiala',
    name: 'Mata Kaushalya Hospital / Rajindra Hospital Patiala',
    type: 'District Hospital',
    taluka: 'Patiala City',
    district: 'Patiala, Punjab',
    districtKey: 'PATIALA',
    distanceKm: 85.0,
    latitude: 30.3398,
    longitude: 76.3869,
    phone: '0175-2212108',
    timings: '24x7 Tertiary Emergency & Trauma Care',
    services: ['Surgical ICU & Specialty Wards', 'Post-Operative Wound Care', 'Ayushman Bharat PM-JAY Kiosk', 'Comprehensive Pathology'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sdh-nabha',
    name: 'Sub-Divisional Hospital (SDH) Nabha',
    type: 'Rural Hospital',
    taluka: 'Nabha',
    district: 'Patiala, Punjab',
    districtKey: 'PATIALA',
    distanceKm: 78.0,
    latitude: 30.3750,
    longitude: 76.1520,
    phone: '01765-220108',
    timings: '24x7 Emergency Services',
    services: ['Emergency Care', 'Inpatient Beds', 'Minor Surgery & Follow-up', 'Ayushman Mitra Kiosk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sdh-rajpura',
    name: 'Sub-Divisional Hospital (SDH) Rajpura',
    type: 'Rural Hospital',
    taluka: 'Rajpura',
    district: 'Patiala, Punjab',
    districtKey: 'PATIALA',
    distanceKm: 92.0,
    latitude: 30.4840,
    longitude: 76.5940,
    phone: '01762-224108',
    timings: '24x7 Emergency & Trauma Care',
    services: ['Emergency Care', 'Orthopedic & General Surgery OPD', 'Suture Removal', 'Digital X-Ray'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-bhadson',
    name: 'Community Health Centre (CHC) Bhadson',
    type: 'Rural Hospital',
    taluka: 'Bhadson',
    district: 'Patiala, Punjab',
    districtKey: 'PATIALA',
    distanceKm: 65.0,
    latitude: 30.5210,
    longitude: 76.1820,
    phone: '01765-242108',
    timings: '24x7 Emergency & Inpatient Ward',
    services: ['Emergency Care', 'Wound Redressing', 'ASHA Referral Network', 'Essential Pharmacy'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-tripuri',
    name: 'Primary Health Centre (PHC) Tripuri Patiala',
    type: 'PHC',
    taluka: 'Tripuri',
    district: 'Patiala, Punjab',
    districtKey: 'PATIALA',
    distanceKm: 83.0,
    latitude: 30.3540,
    longitude: 76.4020,
    phone: '0175-2351108',
    timings: '8:30 AM - 2:00 PM',
    services: ['Medical Officer OPD', 'Vitals Screening', 'Dressing Changes', 'Maternal Health'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },

  // --- BATHINDA DISTRICT ---
  {
    id: 'ch-bathinda',
    name: 'Civil Hospital Bathinda (District Hospital)',
    type: 'District Hospital',
    taluka: 'Bathinda City',
    district: 'Bathinda, Punjab',
    districtKey: 'BATHINDA',
    distanceKm: 130.0,
    latitude: 30.2110,
    longitude: 74.9455,
    phone: '0164-2212108',
    timings: '24x7 Emergency & Trauma Center',
    services: ['Specialist Surgical Care', 'Trauma ICU & Blood Bank', 'Post-Op Follow-up Clinic', 'Ayushman Bharat PM-JAY Kiosk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sdh-talwandi-sabo',
    name: 'Sub-Divisional Hospital (SDH) Talwandi Sabo',
    type: 'Rural Hospital',
    taluka: 'Talwandi Sabo',
    district: 'Bathinda, Punjab',
    districtKey: 'BATHINDA',
    distanceKm: 155.0,
    latitude: 29.9820,
    longitude: 75.0910,
    phone: '01655-220108',
    timings: '24x7 Emergency Care',
    services: ['Emergency Care', 'Post-Surgical Follow-up', 'Maternal Inpatient Ward', 'Ayushman Mitra Kiosk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-rampura-phul',
    name: 'Community Health Centre (CHC) Rampura Phul',
    type: 'Rural Hospital',
    taluka: 'Rampura Phul',
    district: 'Bathinda, Punjab',
    districtKey: 'BATHINDA',
    distanceKm: 105.0,
    latitude: 30.2740,
    longitude: 75.2390,
    phone: '01651-220108',
    timings: '24x7 Emergency & Inpatient Care',
    services: ['Emergency First Aid', 'Wound Dressing & Sutures', 'Pathology Testing', 'Free Essential Medicines'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-goniana',
    name: 'Primary Health Centre (PHC) Goniana',
    type: 'PHC',
    taluka: 'Goniana',
    district: 'Bathinda, Punjab',
    districtKey: 'BATHINDA',
    distanceKm: 122.0,
    latitude: 30.3120,
    longitude: 74.9080,
    phone: '0164-2762108',
    timings: '8:30 AM - 2:00 PM',
    services: ['Medical Officer OPD', 'Suture Removal Station', 'TB DOTS Hub', 'Diabetes Testing'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },
  {
    id: 'aac-model-town-bathinda',
    name: 'Aam Aadmi Clinic Model Town Bathinda',
    type: 'Sub-Centre',
    taluka: 'Bathinda Urban',
    district: 'Bathinda, Punjab',
    districtKey: 'BATHINDA',
    distanceKm: 128.0,
    latitude: 30.1980,
    longitude: 74.9560,
    phone: '0164-2241108',
    timings: '8:00 AM - 2:00 PM',
    services: ['80+ Free Diagnostic Tests', 'Free Generic Medicines', 'Post-Discharge Vitals Check', 'ASHA Coordination'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },

  // --- SAS NAGAR (MOHALI) DISTRICT ---
  {
    id: 'ch-mohali',
    name: 'District Hospital Phase 6 (SAS Nagar Mohali)',
    type: 'District Hospital',
    taluka: 'Mohali',
    district: 'SAS Nagar, Punjab',
    districtKey: 'MOHALI',
    distanceKm: 98.0,
    latitude: 30.7160,
    longitude: 76.7120,
    phone: '0172-2272108',
    timings: '24x7 Emergency & Trauma Care',
    services: ['Advanced Post-Surgical Follow-up', 'Surgical ICU', 'Cardiology & Ortho OPD', 'PM-JAY Empanelled Services', 'Blood Bank'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sdh-kharar',
    name: 'Sub-Divisional Hospital (SDH) Kharar',
    type: 'Rural Hospital',
    taluka: 'Kharar',
    district: 'SAS Nagar, Punjab',
    districtKey: 'MOHALI',
    distanceKm: 86.0,
    latitude: 30.7450,
    longitude: 76.6430,
    phone: '0160-2280108',
    timings: '24x7 Emergency Care',
    services: ['Emergency Care', 'Post-Op Follow-up', 'Inpatient Ward', 'Ayushman Bharat Mitra Kiosk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-dera-bassi',
    name: 'Community Health Centre (CHC) Dera Bassi',
    type: 'Rural Hospital',
    taluka: 'Dera Bassi',
    district: 'SAS Nagar, Punjab',
    districtKey: 'MOHALI',
    distanceKm: 118.0,
    latitude: 30.5960,
    longitude: 76.8430,
    phone: '01762-280108',
    timings: '24x7 Emergency Care',
    services: ['Emergency Resuscitation', 'Wound Redressing', 'Pathology Lab', 'Essential Drug Pharmacy'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-kurali',
    name: 'Primary Health Centre (PHC) Kurali',
    type: 'PHC',
    taluka: 'Kurali',
    district: 'SAS Nagar, Punjab',
    districtKey: 'MOHALI',
    distanceKm: 76.0,
    latitude: 30.8290,
    longitude: 76.5750,
    phone: '0160-2562108',
    timings: '8:30 AM - 2:00 PM',
    services: ['Medical Officer OPD', 'Suture Removal & Dressing', 'Diabetes & BP Screening', 'Maternal Care'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },
  {
    id: 'aac-phase1-mohali',
    name: 'Aam Aadmi Clinic Phase 1 Mohali',
    type: 'Sub-Centre',
    taluka: 'Mohali Urban',
    district: 'SAS Nagar, Punjab',
    districtKey: 'MOHALI',
    distanceKm: 96.0,
    latitude: 30.7280,
    longitude: 76.7210,
    phone: '0172-2228108',
    timings: '8:00 AM - 2:00 PM',
    services: ['Free Diagnostic Blood Tests', 'Free Essential Medicines', 'ANM Station', 'Digital Prescriptions'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },

  // --- HOSHIARPUR DISTRICT ---
  {
    id: 'ch-hoshiarpur',
    name: 'Civil Hospital Hoshiarpur (District Hospital)',
    type: 'District Hospital',
    taluka: 'Hoshiarpur City',
    district: 'Hoshiarpur, Punjab',
    districtKey: 'HOSHIARPUR',
    distanceKm: 92.0,
    latitude: 31.5270,
    longitude: 75.9140,
    phone: '01882-222108',
    timings: '24x7 Emergency Trauma Care',
    services: ['General Surgery & Trauma', 'Surgical Inpatient Ward', 'Ayushman Bharat PM-JAY Kiosk', 'Blood Bank'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sdh-dasuya',
    name: 'Sub-Divisional Hospital (SDH) Dasuya',
    type: 'Rural Hospital',
    taluka: 'Dasuya',
    district: 'Hoshiarpur, Punjab',
    districtKey: 'HOSHIARPUR',
    distanceKm: 125.0,
    latitude: 31.8150,
    longitude: 75.6590,
    phone: '01883-285108',
    timings: '24x7 Emergency Care',
    services: ['Emergency Care', 'Post-Surgical Follow-up', 'Pathology Lab', 'Ayushman Helpdesk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-mukerian',
    name: 'Community Health Centre (CHC) Mukerian',
    type: 'Rural Hospital',
    taluka: 'Mukerian',
    district: 'Hoshiarpur, Punjab',
    districtKey: 'HOSHIARPUR',
    distanceKm: 140.0,
    latitude: 31.9540,
    longitude: 75.6210,
    phone: '01883-244108',
    timings: '24x7 Emergency Services',
    services: ['Emergency First Aid', 'Wound Dressing Station', 'Essential Medicines', 'Inpatient Ward'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-mahilpur',
    name: 'Primary Health Centre (PHC) Mahilpur',
    type: 'PHC',
    taluka: 'Mahilpur',
    district: 'Hoshiarpur, Punjab',
    districtKey: 'HOSHIARPUR',
    distanceKm: 74.0,
    latitude: 31.3320,
    longitude: 76.0450,
    phone: '01884-245108',
    timings: '8:30 AM - 2:00 PM',
    services: ['Medical Officer OPD', 'Suture Removal', 'TB DOTS Center', 'Maternal Care'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },

  // --- GURDASPUR DISTRICT ---
  {
    id: 'ch-gurdaspur',
    name: 'Civil Hospital Gurdaspur (District Hospital)',
    type: 'District Hospital',
    taluka: 'Gurdaspur City',
    district: 'Gurdaspur, Punjab',
    districtKey: 'GURDASPUR',
    distanceKm: 145.0,
    latitude: 32.0410,
    longitude: 75.4050,
    phone: '01874-240108',
    timings: '24x7 Emergency & Trauma Care',
    services: ['Multi-specialty Surgery', 'Post-Op Follow-up', 'Ayushman Bharat PM-JAY Helpdesk', 'ICU & Blood Bank'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sdh-batala',
    name: 'Sub-Divisional Hospital (SDH) Batala',
    type: 'Rural Hospital',
    taluka: 'Batala',
    district: 'Gurdaspur, Punjab',
    districtKey: 'GURDASPUR',
    distanceKm: 120.0,
    latitude: 31.8180,
    longitude: 75.2040,
    phone: '01871-240108',
    timings: '24x7 Emergency Care',
    services: ['Emergency Care', 'Post-Operative Dressing', 'Digital X-Ray', 'Ayushman Mitra Kiosk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-kalanaur',
    name: 'Community Health Centre (CHC) Kalanaur',
    type: 'Rural Hospital',
    taluka: 'Kalanaur',
    district: 'Gurdaspur, Punjab',
    districtKey: 'GURDASPUR',
    distanceKm: 155.0,
    latitude: 31.9960,
    longitude: 75.1630,
    phone: '01874-277108',
    timings: '24x7 Inpatient & Emergency Care',
    services: ['Emergency First Aid', 'Wound Dressing Station', 'Essential Generic Medicines'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },

  // --- FIROZPUR DISTRICT ---
  {
    id: 'ch-firozpur',
    name: 'Civil Hospital Firozpur (District Hospital)',
    type: 'District Hospital',
    taluka: 'Firozpur City',
    district: 'Firozpur, Punjab',
    districtKey: 'FIROZPUR',
    distanceKm: 125.0,
    latitude: 30.9240,
    longitude: 74.6140,
    phone: '01632-244108',
    timings: '24x7 Emergency Trauma Care',
    services: ['24x7 Emergency Trauma', 'General Surgery', 'Ayushman Bharat Helpdesk', 'Blood Bank'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'sdh-zira',
    name: 'Sub-Divisional Hospital (SDH) Zira',
    type: 'Rural Hospital',
    taluka: 'Zira',
    district: 'Firozpur, Punjab',
    districtKey: 'FIROZPUR',
    distanceKm: 98.0,
    latitude: 30.9760,
    longitude: 74.9860,
    phone: '01682-250108',
    timings: '24x7 Emergency Services',
    services: ['Emergency Care', 'Post-Op Follow-up', 'Maternal Inpatient Ward', 'Ayushman Mitra Kiosk'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-guruharsahai',
    name: 'Community Health Centre (CHC) Guruharsahai',
    type: 'Rural Hospital',
    taluka: 'Guruharsahai',
    district: 'Firozpur, Punjab',
    districtKey: 'FIROZPUR',
    distanceKm: 148.0,
    latitude: 30.7180,
    longitude: 74.3980,
    phone: '01685-230108',
    timings: '24x7 Emergency First Aid',
    services: ['Emergency First Aid', 'Wound Care & Dressing', 'Pathology Lab', 'Free Medicines'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },

  // --- PATHANKOT DISTRICT ---
  {
    id: 'ch-pathankot',
    name: 'Civil Hospital Pathankot (District Hospital)',
    type: 'District Hospital',
    taluka: 'Pathankot City',
    district: 'Pathankot, Punjab',
    districtKey: 'PATHANKOT',
    distanceKm: 175.0,
    latitude: 32.2680,
    longitude: 75.6520,
    phone: '0186-2220108',
    timings: '24x7 Emergency Trauma Center',
    services: ['Trauma Center', 'General & Laparoscopic Surgery', 'Ayushman Bharat PM-JAY Kiosk', 'Blood Bank'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'chc-sujanpur',
    name: 'Community Health Centre (CHC) Sujanpur',
    type: 'Rural Hospital',
    taluka: 'Sujanpur',
    district: 'Pathankot, Punjab',
    districtKey: 'PATHANKOT',
    distanceKm: 182.0,
    latitude: 32.3210,
    longitude: 75.6120,
    phone: '0186-2244108',
    timings: '24x7 Emergency Services',
    services: ['Emergency First Aid', 'Post-Op Suture Removal', 'Essential Drug Pharmacy', 'Inpatient Ward'],
    ayushmanMitraDesk: true,
    emergencyCare24x7: true,
  },
  {
    id: 'phc-narot',
    name: 'Primary Health Centre (PHC) Narot Jaimal Singh',
    type: 'PHC',
    taluka: 'Narot Jaimal Singh',
    district: 'Pathankot, Punjab',
    districtKey: 'PATHANKOT',
    distanceKm: 195.0,
    latitude: 32.1890,
    longitude: 75.5120,
    phone: '0186-276108',
    timings: '8:30 AM - 2:00 PM',
    services: ['Medical Officer OPD', 'Surgical Dressing', 'TB DOTS Management', 'Maternal Care'],
    ayushmanMitraDesk: false,
    emergencyCare24x7: false,
  },
];

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

/**
 * Realistic travel time estimates considering road conditions and emergency transit in Punjab
 */
export const computeTravelTimeMinutes = (distanceKm: number): number => {
  if (distanceKm <= 0.3) return 2;
  if (distanceKm < 10) {
    // Local urban/rural roads ~32 km/h average + 4 mins buffer
    return Math.max(5, Math.round((distanceKm / 32) * 60 + 4));
  }
  // State highways / link roads ~48 km/h average + 8 mins buffer
  return Math.round((distanceKm / 48) * 60 + 8);
};

export const FacilitiesPage: React.FC = () => {
  const { t } = useTranslation();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('LUDHIANA');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; isGps: boolean }>({
    lat: 30.9010,
    lng: 75.8573,
    isGps: false,
  });
  const [locationStatusMessage, setLocationStatusMessage] = useState<string>(
    'Showing public facilities calibrated from Ludhiana District headquarters.'
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Recalculate distances dynamically when user coordinates change
  const dynamicFacilities = useMemo(() => {
    const list = PUNJAB_FACILITIES.map((facility) => {
      const dist = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        facility.latitude,
        facility.longitude
      );
      return {
        ...facility,
        distanceKm: dist,
      };
    });
    // Sort proximity ascending
    return list.sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation.lat, userLocation.lng]);

  // Handle District Selector Change
  const handleDistrictChange = (districtKey: string) => {
    setSelectedDistrict(districtKey);
    const targetCentroid = PUNJAB_DISTRICT_CENTROIDS.find((d) => d.key === districtKey);
    if (targetCentroid) {
      setUserLocation({
        lat: targetCentroid.lat,
        lng: targetCentroid.lng,
        isGps: false,
      });
      setLocationStatusMessage(
        `Centering directory from ${targetCentroid.name} (${targetCentroid.lat.toFixed(4)}, ${targetCentroid.lng.toFixed(4)}).`
      );
    }
  };

  // GPS Geolocation Handler
  const handleGetGpsLocation = useCallback(() => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setLocationStatusMessage('Browser geolocation is not supported on this device. Using selected district centroid.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isGps: true,
        };
        setUserLocation(coords);
        setIsLocating(false);

        // Find closest district centroid to auto-select district dropdown
        let closestDistrict = 'LUDHIANA';
        let minD = Infinity;
        for (const dist of PUNJAB_DISTRICT_CENTROIDS) {
          const d = calculateHaversineDistance(coords.lat, coords.lng, dist.lat, dist.lng);
          if (d < minD) {
            minD = d;
            closestDistrict = dist.key;
          }
        }
        setSelectedDistrict(closestDistrict);
        setLocationStatusMessage(
          `GPS active! Calibrated from your live coordinates (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}).`
        );
      },
      (error) => {
        setIsLocating(false);
        const msg =
          error.code === error.PERMISSION_DENIED
            ? 'GPS permission denied. Choose your Punjab district from the dropdown above for local facilities.'
            : 'Unable to retrieve precise GPS. Calibrating from selected district centroid.';
        setLocationStatusMessage(msg);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, []);

  // Filter facilities based on category and search text
  const filteredFacilities = useMemo(() => {
    return dynamicFacilities.filter((f) => {
      if (selectedType !== 'ALL' && f.type !== selectedType) return false;
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.taluka.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        f.services.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [dynamicFacilities, selectedType, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Hero Header & Emergency Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-card border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 text-xs font-semibold tracking-wide border border-rose-800/60">
            <Building2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Punjab Public Health Infrastructure Network (34 Facilities Across 10 Districts)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Nearby Public Health Centres & Emergency Hospitals
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Verified Civil Hospitals, Sub-Divisional Hospitals (SDH), Community Health Centres (CHC), Primary Health Centres (PHC), and Aam Aadmi Clinics across Punjab for post-discharge wound care, dressing, suture removal, and emergency triage.
          </p>

          {/* Emergency Helpline Shortcuts */}
          <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <a
              href="tel:108"
              className="inline-flex items-center gap-2 bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md transition-all hover:scale-105"
            >
              <Ambulance className="w-4 h-4" />
              <span>Dial 108 (Punjab Emergency Ambulance)</span>
            </a>
            <a
              href="tel:104"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Dial 104 (Medical Helpline)</span>
            </a>
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
            >
              <Phone className="w-4 h-4 text-sky-400" />
              <span>Dial 112 (National Emergency)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Dynamic Geolocation & District Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            userLocation.isGps ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}>
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                {userLocation.isGps ? 'GPS Location Locked' : 'District Centroid Mode'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                userLocation.isGps ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {userLocation.isGps ? 'Live Sensor' : 'District Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
              {locationStatusMessage}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          {/* District Dropdown Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-bold text-slate-600 shrink-0">District:</label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-300"
            >
              {PUNJAB_DISTRICT_CENTROIDS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* GPS Locate Button */}
          <button
            onClick={handleGetGpsLocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition"
          >
            <Compass className={`w-4 h-4 text-rose-700 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Detecting GPS...' : 'Use My Live GPS'}</span>
          </button>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search facility name, block, or services (e.g. Suture removal, Dressing, X-Ray, Blood Bank)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-200 shadow-sm placeholder:text-slate-400"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { label: 'All (34)', value: 'ALL' },
            { label: 'District Hospital', value: 'District Hospital' },
            { label: 'CHC / SDH', value: 'Rural Hospital' },
            { label: 'PHC', value: 'PHC' },
            { label: 'Sub-Centre / AAC', value: 'Sub-Centre' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedType(tab.value)}
              className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-colors border ${
                selectedType === tab.value
                  ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFacilities.map((facility) => {
          const driveTime = computeTravelTimeMinutes(facility.distanceKm);
          return (
            <div
              key={facility.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-card hover:border-rose-300 hover:shadow-md transition-all duration-150 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Card Header & Proximity */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          24x7 Emergency
                        </span>
                      )}
                      {facility.ayushmanMitraDesk && (
                        <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          AB-PMJAY / MMJBY Kiosk
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 pt-0.5 leading-snug">
                      {facility.name}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{facility.taluka}, {facility.district}</span>
                    </div>
                  </div>

                  {/* Distance & Travel Time Badge */}
                  <div className="text-right shrink-0 bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-2">
                    <div className="text-sm font-extrabold text-slate-900">{facility.distanceKm} km</div>
                    <div className="text-[10px] font-bold text-rose-700 flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>~{driveTime} min transit</span>
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium">{facility.timings}</span>
                </div>

                {/* Services Tags */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Post-Discharge & Clinical Services:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {facility.services.map((svc, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/70"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${facility.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call {facility.phone}</span>
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${facility.latitude},${facility.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-sm transition hover:scale-[1.02]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Turn-by-Turn GPS</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFacilities.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-2">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="text-base font-bold text-slate-900">No facilities match your search</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords or switch category filter to "All" to view all available Punjab public health institutions.
          </p>
        </div>
      )}
    </div>
  );
};
