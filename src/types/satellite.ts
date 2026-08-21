export interface SatelliteTLE {
  id: string;
  name: string;
  noradId: number;
  intlDesignator: string;
  line1: string;
  line2: string;
  category: 'skyroot' | 'isro' | 'station' | 'earth_obs' | 'communications' | 'weather' | 'debris' | 'custom';
  operator: string;
  country: string;
  launchDate: string;
  purpose: string;
  massKg?: number;
  freqDownlinkMHz?: number;
  freqUplinkMHz?: number;
  rfBand?: 'VHF' | 'UHF' | 'S-Band' | 'X-Band' | 'Ku-Band' | 'Ka-Band';
  callsign?: string;
  status: 'operational' | 'decaying' | 'decommissioned' | 'debris';
  licenseStatus: 'IN-SPACe Authorized' | 'UN Registered' | 'FCC Approved' | 'ITU Coordinated' | 'Experimental';
  unRegistrationCode?: string;
  perigeeKm?: number;
  apogeeKm?: number;
  inclinationDeg?: number;
  periodMin?: number;
}

export interface GroundStation {
  id: string;
  name: string;
  code: string;
  country: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  isUserLocation?: boolean;
}

export interface SatelliteRealtimeState {
  id: string;
  noradId: number;
  name: string;
  latitude: number; // degrees -90 to +90
  longitude: number; // degrees -180 to +180
  altitudeKm: number;
  velocityKmS: number;
  velocityKmH: number;
  azimuthDeg: number; // relative to observer (0-360)
  elevationDeg: number; // relative to observer (-90 to +90)
  slantRangeKm: number; // 3D distance to observer
  rangeRateKmS: number; // rate of change in distance (for Doppler)
  footprintRadiusKm: number;
  footprintAngleDeg: number;
  isSunlit: boolean;
  isVisibleToObserver: boolean;
  dopplerShiftHz: number;
  signalLatencyMs: number;
  freeSpacePathLossDb: number;
  groundTrack: Array<{ lat: number; lng: number }>;
  orbitProgress: number; // 0 to 1
  orbitalPeriodMin: number;
  inclinationDeg: number;
  apogeeKm: number;
  perigeeKm: number;
  eccentricity: number;
  epochAgeDays: number;
}

export interface PassPrediction {
  satelliteId: string;
  satelliteName: string;
  aosTime: Date; // Acquisition of Signal (Rise)
  tcaTime: Date; // Time of Closest Approach (Culmination)
  losTime: Date; // Loss of Signal (Set)
  durationSec: number;
  maxElevationDeg: number;
  aosAzimuthDeg: number;
  losAzimuthDeg: number;
  tcaRangeKm: number;
  visibility: 'Visible (Sunlit)' | 'Daylight Pass' | 'Eclipsed / Radio Only';
  passType: 'Overhead (>45°)' | 'Good (20°-45°)' | 'Low (<20°)';
}

export interface ConjunctionRisk {
  id: string;
  primarySat: SatelliteTLE;
  secondaryObject: {
    name: string;
    noradId: number;
    type: 'Debris' | 'Payload' | 'Rocket Body';
  };
  tcaEpoch: Date;
  missDistanceKm: number;
  radialDistanceKm: number;
  crossTrackDistanceKm: number;
  collisionProbability: number; // e.g. 1.2e-5
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedManeuver?: string;
}
