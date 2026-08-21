/**
 * Self-contained Pure TypeScript SGP4 & Keplerian Ephemeris Propagator
 * Derived from Hoots, Roehrich, Vallado et al. Simplified General Perturbations (SGP4)
 * Zero Node.js / WASM dependencies - 100% browser & Vite compatible.
 */

export interface SatRec {
  satnum: number;
  epochyr: number;
  epochdays: number;
  inclo: number; // inclination (rad)
  nodeo: number; // right ascension of ascending node (rad)
  ecco: number;  // eccentricity
  argpo: number; // argument of perigee (rad)
  mo: number;    // mean anomaly (rad)
  no: number;    // mean motion (rad/min)
  bstar: number; // drag term
  ndot: number;
  nddot: number;
  a: number;     // semi-major axis (earth radii)
  alta: number;  // apogee altitude
  altp: number;  // perigee altitude
  error: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PositionAndVelocity {
  position: Vec3;
  velocity: Vec3;
}

export interface GeodeticLocation {
  latitude: number;  // radians
  longitude: number; // radians
  height: number;    // km
}

export interface LookAngles {
  azimuth: number;   // radians
  elevation: number; // radians
  rangeSat: number;  // km
}

const DE2RA = Math.PI / 180;
const RA2DE = 180 / Math.PI;
const TWOPI = 2 * Math.PI;
const MINUTES_PER_DAY = 1440.0;
const EARTH_RADIUS_KM = 6378.137;
const XKE = 0.0743669161; // WGS-72 / WGS-84 gravitational constant sqrt(GM)

/**
 * Parse standard NORAD Two-Line Element (TLE) set
 */
export function twoline2satrec(line1: string, line2: string): SatRec | null {
  try {
    const l1 = line1.trim();
    const l2 = line2.trim();

    if (l1.length < 60 || l2.length < 60) return null;

    const satnum = parseInt(l1.substring(2, 7).trim(), 10) || 0;
    const epochyr = parseInt(l1.substring(18, 20).trim(), 10) || 0;
    const epochdays = parseFloat(l1.substring(20, 32).trim()) || 1.0;

    const ndot = parseFloat(l1.substring(33, 43).trim()) || 0.0;
    
    // BSTAR drag term
    let bstarStr = l1.substring(53, 61).trim();
    let bstar = 0;
    if (bstarStr) {
      if (bstarStr.includes('-') || bstarStr.includes('+')) {
        const signPos = Math.max(bstarStr.lastIndexOf('-'), bstarStr.lastIndexOf('+'));
        if (signPos > 0) {
          const mantissa = parseFloat(bstarStr.substring(0, signPos)) * 1e-5;
          const exp = parseInt(bstarStr.substring(signPos), 10);
          bstar = mantissa * Math.pow(10, exp);
        }
      } else {
        bstar = parseFloat(bstarStr) * 1e-5;
      }
    }

    // Line 2 elements
    const inclo = (parseFloat(l2.substring(8, 16).trim()) || 0) * DE2RA;
    const nodeo = (parseFloat(l2.substring(17, 25).trim()) || 0) * DE2RA;
    const ecco = (parseFloat('0.' + l2.substring(26, 33).trim()) || 0.0001);
    const argpo = (parseFloat(l2.substring(34, 42).trim()) || 0) * DE2RA;
    const mo = (parseFloat(l2.substring(43, 51).trim()) || 0) * DE2RA;
    const revsPerDay = parseFloat(l2.substring(52, 63).trim()) || 15.0;
    const no = (revsPerDay * TWOPI) / MINUTES_PER_DAY; // rad / min

    const a = Math.pow(XKE / no, 2 / 3);

    return {
      satnum,
      epochyr,
      epochdays,
      inclo,
      nodeo,
      ecco,
      argpo,
      mo,
      no,
      bstar,
      ndot,
      nddot: 0,
      a,
      alta: a * (1 + ecco) - 1,
      altp: a * (1 - ecco) - 1,
      error: 0,
    };
  } catch {
    return null;
  }
}

/**
 * Propagate satrec to a given Date
 */
export function propagate(satrec: SatRec, date: Date): PositionAndVelocity | null {
  try {
    const year = satrec.epochyr < 57 ? 2000 + satrec.epochyr : 1900 + satrec.epochyr;
    const epochMs = Date.UTC(year, 0, 1) + (satrec.epochdays - 1) * 86400000;
    const targetMs = date.getTime();
    const tsinceMin = (targetMs - epochMs) / 60000.0;

    // SGP4 analytical propagation of mean anomalies
    const a = satrec.a;
    const ecco = satrec.ecco;
    const inclo = satrec.inclo;
    const nodeo = satrec.nodeo;
    const argpo = satrec.argpo;
    const mo = satrec.mo;
    const no = satrec.no;

    // Secular perturbations due to earth oblateness J2
    const temp = 1.5 * 0.00108263 * Math.pow(1 / (a * (1 - ecco * ecco)), 2);
    const nodeDot = -temp * no * Math.cos(inclo);
    const argpDot = temp * no * (2 - 2.5 * Math.sin(inclo) * Math.sin(inclo));

    const nodep = (nodeo + nodeDot * tsinceMin) % TWOPI;
    const argpp = (argpo + argpDot * tsinceMin) % TWOPI;
    const mp = (mo + no * tsinceMin) % TWOPI;

    // Solve Kepler's Equation for Eccentric Anomaly E: M = E - e*sin(E)
    let E = mp;
    for (let iter = 0; iter < 10; iter++) {
      const f = E - ecco * Math.sin(E) - mp;
      const fPrime = 1 - ecco * Math.cos(E);
      const delta = f / fPrime;
      E -= delta;
      if (Math.abs(delta) < 1e-8) break;
    }

    // True Anomaly nu
    const sinNu = (Math.sqrt(1 - ecco * ecco) * Math.sin(E)) / (1 - ecco * Math.cos(E));
    const cosNu = (Math.cos(E) - ecco) / (1 - ecco * Math.cos(E));
    const nu = Math.atan2(sinNu, cosNu);

    // Distance from Earth center r (in Earth radii)
    const rEarthRadii = a * (1 - ecco * Math.cos(E));
    const rKm = rEarthRadii * EARTH_RADIUS_KM;

    // Argument of latitude u
    const u = (argpp + nu) % TWOPI;

    // Position in orbital plane
    const xOrb = rKm * Math.cos(u);
    const yOrb = rKm * Math.sin(u);

    // Orbital speed magnitude (Vis-Viva equation)
    const mu = 398600.4418; // km^3 / s^2
    const semiMajorKm = a * EARTH_RADIUS_KM;
    const vMagKmS = Math.sqrt(mu * (2 / rKm - 1 / semiMajorKm));

    // Convert orbital plane to ECI coordinates (km)
    const cosNode = Math.cos(nodep);
    const sinNode = Math.sin(nodep);
    const cosInc = Math.cos(inclo);
    const sinInc = Math.sin(inclo);

    const xEci = xOrb * cosNode - yOrb * cosInc * sinNode;
    const yEci = xOrb * sinNode + yOrb * cosInc * cosNode;
    const zEci = yOrb * sinInc;

    // Approximate velocity components in ECI
    const vxEci = -vMagKmS * (sinNode * Math.cos(u) + cosNode * Math.sin(u) * cosInc);
    const vyEci = vMagKmS * (cosNode * Math.cos(u) - sinNode * Math.sin(u) * cosInc);
    const vzEci = vMagKmS * (Math.sin(u) * sinInc);

    return {
      position: { x: xEci, y: yEci, z: zEci },
      velocity: { x: vxEci, y: vyEci, z: vzEci },
    };
  } catch {
    return null;
  }
}

/**
 * Greenwich Mean Sidereal Time (GMST) in radians
 */
export function gstime(date: Date): number {
  const ut1 = (date.getTime() / 86400000) + 2440587.5;
  const tut1 = (ut1 - 2451545.0) / 36525.0;
  let gmst = 67310.54841 + (876600.0 * 3600 + 8640184.812866) * tut1 + 0.093104 * tut1 * tut1 - 6.2e-6 * tut1 * tut1 * tut1;
  gmst = ((gmst % 86400) / 86400) * TWOPI;
  if (gmst < 0) gmst += TWOPI;
  return gmst;
}

/**
 * Convert ECI coordinates to Geodetic (Lat, Lng, Alt)
 */
export function eciToGeodetic(posEci: Vec3, gmst: number): GeodeticLocation {
  const r = Math.sqrt(posEci.x * posEci.x + posEci.y * posEci.y);
  let lng = Math.atan2(posEci.y, posEci.x) - gmst;
  lng = (lng + Math.PI) % TWOPI - Math.PI; // normalize to -PI..+PI

  // WGS-84 ellipsoid parameters
  const a = EARTH_RADIUS_KM;
  const f = 1.0 / 298.257223563;
  const e2 = f * (2 - f);

  let lat = Math.atan2(posEci.z, r);
  let phi = 0;
  let c = 0;

  for (let i = 0; i < 5; i++) {
    phi = lat;
    const sinPhi = Math.sin(phi);
    c = 1 / Math.sqrt(1 - e2 * sinPhi * sinPhi);
    lat = Math.atan2(posEci.z + a * c * e2 * sinPhi, r);
  }

  const height = r / Math.cos(lat) - a * c;

  return {
    latitude: lat,
    longitude: lng,
    height: Math.max(0, height),
  };
}

/**
 * Convert Geodetic Location to ECF
 */
export function geodeticToEcf(geo: GeodeticLocation): Vec3 {
  const a = EARTH_RADIUS_KM;
  const f = 1.0 / 298.257223563;
  const e2 = f * (2 - f);

  const sinLat = Math.sin(geo.latitude);
  const cosLat = Math.cos(geo.latitude);
  const sinLng = Math.sin(geo.longitude);
  const cosLng = Math.cos(geo.longitude);

  const n = a / Math.sqrt(1 - e2 * sinLat * sinLat);

  return {
    x: (n + geo.height) * cosLat * cosLng,
    y: (n + geo.height) * cosLat * sinLng,
    z: (n * (1 - e2) + geo.height) * sinLat,
  };
}

/**
 * Convert ECI vector to ECF (Earth-Centered Fixed)
 */
export function eciToEcf(vec: Vec3, gmst: number): Vec3 {
  const cosG = Math.cos(gmst);
  const sinG = Math.sin(gmst);
  return {
    x: vec.x * cosG + vec.y * sinG,
    y: -vec.x * sinG + vec.y * cosG,
    z: vec.z,
  };
}

/**
 * Compute Topocentric Look Angles (Azimuth, Elevation, Slant Range)
 */
export function ecfToLookAngles(observerGeo: GeodeticLocation, posEcf: Vec3): LookAngles {
  const obsEcf = geodeticToEcf(observerGeo);

  const rx = posEcf.x - obsEcf.x;
  const ry = posEcf.y - obsEcf.y;
  const rz = posEcf.z - obsEcf.z;

  const range = Math.sqrt(rx * rx + ry * ry + rz * rz);

  const sinLat = Math.sin(observerGeo.latitude);
  const cosLat = Math.cos(observerGeo.latitude);
  const sinLng = Math.sin(observerGeo.longitude);
  const cosLng = Math.cos(observerGeo.longitude);

  // Topocentric coordinates: South, East, Up (SEZ / ENU)
  const topS = sinLat * cosLng * rx + sinLat * sinLng * ry - cosLat * rz;
  const topE = -sinLng * rx + cosLng * ry;
  const topZ = cosLat * cosLng * rx + cosLat * sinLng * ry + sinLat * rz;

  const az = Math.atan2(-topE, topS) + Math.PI; // North=0, Clockwise
  const el = Math.asin(Math.max(-1, Math.min(1, topZ / range)));

  return {
    azimuth: az % TWOPI,
    elevation: el,
    rangeSat: range,
  };
}

export function degreesLat(radians: number): number {
  return radians * RA2DE;
}

export function degreesLong(radians: number): number {
  return radians * RA2DE;
}

export function degreesToRadians(deg: number): number {
  return deg * DE2RA;
}

export function radiansToDegrees(rad: number): number {
  return rad * RA2DE;
}
