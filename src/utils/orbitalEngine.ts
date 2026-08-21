import * as sgp4 from './sgp4';
import { SatelliteTLE, SatelliteRealtimeState, GroundStation, PassPrediction, ConjunctionRisk } from '../types/satellite';

const EARTH_RADIUS_KM = 6378.137;
const SPEED_OF_LIGHT_KM_S = 299792.458;

/**
 * Propagate a satellite TLE to a specific Date and compute observer-relative telemetry
 */
export function propagateSatellite(
  sat: SatelliteTLE,
  date: Date,
  observer: GroundStation
): SatelliteRealtimeState | null {
  try {
    const satrec = sgp4.twoline2satrec(sat.line1, sat.line2);
    if (!satrec) return null;

    const positionAndVelocity = sgp4.propagate(satrec, date);
    if (!positionAndVelocity) return null;

    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;

    if (!positionEci || !velocityEci) {
      return null;
    }

    const gmst = sgp4.gstime(date);
    const geodetic = sgp4.eciToGeodetic(positionEci, gmst);

    const latDeg = sgp4.degreesLat(geodetic.latitude);
    const lngDeg = sgp4.degreesLong(geodetic.longitude);
    const altKm = Math.max(0, geodetic.height);

    // Compute orbital velocity magnitude (km/s)
    const velKmS = Math.sqrt(
      velocityEci.x * velocityEci.x +
      velocityEci.y * velocityEci.y +
      velocityEci.z * velocityEci.z
    );
    const velKmH = velKmS * 3600;

    // Observer Geodetic Position
    const observerGd: sgp4.GeodeticLocation = {
      latitude: sgp4.degreesToRadians(observer.latitude),
      longitude: sgp4.degreesToRadians(observer.longitude),
      height: observer.altitudeMeters / 1000,
    };

    // Calculate ECF coordinates for look angles
    const positionEcf = sgp4.eciToEcf(positionEci, gmst);
    const velocityEcf = sgp4.eciToEcf(velocityEci, gmst);
    const lookAngles = sgp4.ecfToLookAngles(observerGd, positionEcf);

    const azDeg = (sgp4.radiansToDegrees(lookAngles.azimuth) + 360) % 360;
    const elDeg = sgp4.radiansToDegrees(lookAngles.elevation);
    const slantRangeKm = lookAngles.rangeSat;

    // Calculate Range Rate for Doppler Shift
    const obsPosEcf = sgp4.geodeticToEcf(observerGd);
    const rx = positionEcf.x - obsPosEcf.x;
    const ry = positionEcf.y - obsPosEcf.y;
    const rz = positionEcf.z - obsPosEcf.z;
    const rMag = Math.sqrt(rx * rx + ry * ry + rz * rz);

    // Range rate (radial velocity) = (r . v) / |r|
    const rangeRateKmS = rMag > 0 ? (rx * velocityEcf.x + ry * velocityEcf.y + rz * velocityEcf.z) / rMag : 0;

    // Doppler Shift on downlink frequency (default 437.5 MHz if none provided)
    const nominalFreqMHz = sat.freqDownlinkMHz || 437.50;
    const nominalFreqHz = nominalFreqMHz * 1e6;
    const dopplerShiftHz = -nominalFreqHz * (rangeRateKmS / SPEED_OF_LIGHT_KM_S);

    // Latency and Path Loss
    const signalLatencyMs = (slantRangeKm / SPEED_OF_LIGHT_KM_S) * 1000;
    const freeSpacePathLossDb = 20 * Math.log10(Math.max(1, slantRangeKm)) + 20 * Math.log10(nominalFreqMHz) + 32.44;

    // Footprint angle and surface radius
    const rho = Math.asin(Math.min(1, EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altKm)));
    const footprintAngleDeg = (Math.PI / 2 - rho) * (180 / Math.PI);
    const footprintRadiusKm = EARTH_RADIUS_KM * (Math.PI / 2 - rho);

    // Solar Illumination / Eclipse Calculation
    const isSunlit = checkSolarIllumination(positionEci, date);

    // Ground Track Generation (-45 min to +90 min)
    const groundTrack: Array<{ lat: number; lng: number }> = [];
    const stepMin = 3;
    for (let offset = -45; offset <= 90; offset += stepMin) {
      const trackDate = new Date(date.getTime() + offset * 60 * 1000);
      const trackGmst = sgp4.gstime(trackDate);
      const trackPosVel = sgp4.propagate(satrec, trackDate);
      if (trackPosVel && trackPosVel.position) {
        const trackGeo = sgp4.eciToGeodetic(trackPosVel.position, trackGmst);
        groundTrack.push({
          lat: sgp4.degreesLat(trackGeo.latitude),
          lng: sgp4.degreesLong(trackGeo.longitude),
        });
      }
    }

    // Keplerian parameters from satrec
    const meanMotionRevDay = satrec.no ? (satrec.no * 1440) / (2 * Math.PI) : 15.0;
    const periodMin = 1440 / meanMotionRevDay;
    const inclinationDeg = satrec.inclo ? satrec.inclo * (180 / Math.PI) : 97.4;
    const eccentricity = satrec.ecco || 0.001;
    const semiMajorAxisKm = satrec.a ? satrec.a * EARTH_RADIUS_KM : 6878;
    const apogeeKm = semiMajorAxisKm * (1 + eccentricity) - EARTH_RADIUS_KM;
    const perigeeKm = semiMajorAxisKm * (1 - eccentricity) - EARTH_RADIUS_KM;

    // Epoch age
    const epochYear = satrec.epochyr < 57 ? 2000 + satrec.epochyr : 1900 + satrec.epochyr;
    const epochDate = new Date(Date.UTC(epochYear, 0, 1));
    epochDate.setTime(epochDate.getTime() + (satrec.epochdays - 1) * 86400000);
    const epochAgeDays = Math.abs((date.getTime() - epochDate.getTime()) / 86400000);

    return {
      id: sat.id,
      noradId: sat.noradId,
      name: sat.name,
      latitude: latDeg,
      longitude: lngDeg,
      altitudeKm: altKm,
      velocityKmS: velKmS,
      velocityKmH: velKmH,
      azimuthDeg: azDeg,
      elevationDeg: elDeg,
      slantRangeKm: slantRangeKm,
      rangeRateKmS: rangeRateKmS,
      footprintRadiusKm: footprintRadiusKm,
      footprintAngleDeg: footprintAngleDeg,
      isSunlit,
      isVisibleToObserver: elDeg > 0,
      dopplerShiftHz,
      signalLatencyMs,
      freeSpacePathLossDb,
      groundTrack,
      orbitProgress: ((date.getTime() % (periodMin * 60000)) / (periodMin * 60000)),
      orbitalPeriodMin: periodMin,
      inclinationDeg,
      apogeeKm: Math.max(0, apogeeKm),
      perigeeKm: Math.max(0, perigeeKm),
      eccentricity,
      epochAgeDays,
    };
  } catch (err) {
    console.error('Error propagating satellite:', sat.name, err);
    return null;
  }
}

/**
 * Check if satellite position is in Earth's shadow (cylindrical umbra approximation)
 */
function checkSolarIllumination(satEci: sgp4.Vec3, date: Date): boolean {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const solarLongRad = ((280.46 + 0.9856474 * dayOfYear) % 360) * (Math.PI / 180);
  const obliquityRad = 23.439 * (Math.PI / 180);

  const sunX = Math.cos(solarLongRad);
  const sunY = Math.sin(solarLongRad) * Math.cos(obliquityRad);
  const sunZ = Math.sin(solarLongRad) * Math.sin(obliquityRad);

  const satDotSun = (satEci.x * sunX + satEci.y * sunY + satEci.z * sunZ);

  if (satDotSun > 0) {
    return true; // Facing the sun
  }

  const satDistSq = satEci.x * satEci.x + satEci.y * satEci.y + satEci.z * satEci.z;
  const perpDistSq = satDistSq - satDotSun * satDotSun;
  return perpDistSq > EARTH_RADIUS_KM * EARTH_RADIUS_KM;
}

/**
 * Predict visible and radio passes over the next N hours
 */
export function predictPasses(
  sat: SatelliteTLE,
  observer: GroundStation,
  startTime: Date,
  forecastHours: number = 48,
  minElevationCutoffDeg: number = 5
): PassPrediction[] {
  const passes: PassPrediction[] = [];
  const satrec = sgp4.twoline2satrec(sat.line1, sat.line2);
  if (!satrec) return passes;

  const observerGd: sgp4.GeodeticLocation = {
    latitude: sgp4.degreesToRadians(observer.latitude),
    longitude: sgp4.degreesToRadians(observer.longitude),
    height: observer.altitudeMeters / 1000,
  };

  const stepSec = 30; // 30-second steps
  const totalSteps = (forecastHours * 3600) / stepSec;

  let inPass = false;
  let currentAos: Date | null = null;
  let aosAz: number = 0;
  let maxEl: number = -90;
  let maxElTime: Date | null = null;
  let minSlantRange: number = 999999;
  let tcaSunlit = false;

  for (let i = 0; i < totalSteps; i++) {
    const checkTime = new Date(startTime.getTime() + i * stepSec * 1000);
    const gmst = sgp4.gstime(checkTime);
    const posVel = sgp4.propagate(satrec, checkTime);

    if (posVel && posVel.position) {
      const positionEcf = sgp4.eciToEcf(posVel.position, gmst);
      const look = sgp4.ecfToLookAngles(observerGd, positionEcf);
      const elDeg = sgp4.radiansToDegrees(look.elevation);
      const azDeg = (sgp4.radiansToDegrees(look.azimuth) + 360) % 360;
      const range = look.rangeSat;

      if (elDeg >= 0) {
        if (!inPass) {
          inPass = true;
          currentAos = checkTime;
          aosAz = azDeg;
          maxEl = elDeg;
          maxElTime = checkTime;
          minSlantRange = range;
          tcaSunlit = checkSolarIllumination(posVel.position, checkTime);
        } else {
          if (elDeg > maxEl) {
            maxEl = elDeg;
            maxElTime = checkTime;
            minSlantRange = range;
            tcaSunlit = checkSolarIllumination(posVel.position, checkTime);
          }
        }
      } else if (inPass) {
        inPass = false;
        if (currentAos && maxElTime && maxEl >= minElevationCutoffDeg) {
          const losAz = azDeg;
          const duration = Math.round((checkTime.getTime() - currentAos.getTime()) / 1000);

          let passType: PassPrediction['passType'] = 'Low (<20°)';
          if (maxEl >= 45) passType = 'Overhead (>45°)';
          else if (maxEl >= 20) passType = 'Good (20°-45°)';

          const obsIsNight = isObserverInDarkness(observer.latitude, observer.longitude, maxElTime);
          let visibility: PassPrediction['visibility'] = 'Eclipsed / Radio Only';
          if (obsIsNight && tcaSunlit) {
            visibility = 'Visible (Sunlit)';
          } else if (!obsIsNight) {
            visibility = 'Daylight Pass';
          }

          passes.push({
            satelliteId: sat.id,
            satelliteName: sat.name,
            aosTime: currentAos,
            tcaTime: maxElTime,
            losTime: checkTime,
            durationSec: duration,
            maxElevationDeg: Math.round(maxEl * 10) / 10,
            aosAzimuthDeg: Math.round(aosAz),
            losAzimuthDeg: Math.round(losAz),
            tcaRangeKm: Math.round(minSlantRange),
            visibility,
            passType,
          });
        }
      }
    }
  }

  return passes;
}

/**
 * Check if observer station is in night/darkness
 */
function isObserverInDarkness(latDeg: number, lngDeg: number, date: Date): boolean {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = -23.45 * Math.cos(((360 / 365) * (dayOfYear + 10) * Math.PI) / 180);
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const solarTime = (utcHours + lngDeg / 15 + 24) % 24;
  const hourAngle = (solarTime - 12) * 15;

  const latRad = (latDeg * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  const haRad = (hourAngle * Math.PI) / 180;

  const sinSunEl = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const sunElDeg = (Math.asin(sinSunEl) * 180) / Math.PI;

  return sunElDeg < -6;
}

/**
 * Compute Conjunction Assessment (CARA) risk between active satellites and debris
 */
export function computeConjunctionRisks(
  catalog: SatelliteTLE[],
  date: Date
): ConjunctionRisk[] {
  const activeSats = catalog.filter((s) => s.category === 'skyroot' || s.category === 'isro' || s.category === 'station');
  const debrisSats = catalog.filter((s) => s.category === 'debris');
  const risks: ConjunctionRisk[] = [];

  for (const active of activeSats) {
    const activeSatrec = sgp4.twoline2satrec(active.line1, active.line2);
    if (!activeSatrec) continue;

    const activePosVel = sgp4.propagate(activeSatrec, date);
    if (!activePosVel || !activePosVel.position) continue;

    for (const debris of debrisSats) {
      const debrisSatrec = sgp4.twoline2satrec(debris.line1, debris.line2);
      if (!debrisSatrec) continue;

      const debrisPosVel = sgp4.propagate(debrisSatrec, date);
      if (!debrisPosVel || !debrisPosVel.position) continue;

      const dx = activePosVel.position.x - debrisPosVel.position.x;
      const dy = activePosVel.position.y - debrisPosVel.position.y;
      const dz = activePosVel.position.z - debrisPosVel.position.z;
      const missDistKm = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const rActive = Math.sqrt(
        activePosVel.position.x ** 2 + activePosVel.position.y ** 2 + activePosVel.position.z ** 2
      );
      const rDebris = Math.sqrt(
        debrisPosVel.position.x ** 2 + debrisPosVel.position.y ** 2 + debrisPosVel.position.z ** 2
      );
      const radialDistKm = Math.abs(rActive - rDebris);

      let riskLevel: ConjunctionRisk['riskLevel'] = 'LOW';
      let collisionProbability = 1e-7;
      let recommendedManeuver = undefined;

      if (missDistKm < 15) {
        riskLevel = 'CRITICAL';
        collisionProbability = 4.8e-3;
        recommendedManeuver = 'Immediate +0.5 m/s In-Track Delta-V Burn via Raman Thruster';
      } else if (missDistKm < 60) {
        riskLevel = 'HIGH';
        collisionProbability = 1.2e-4;
        recommendedManeuver = 'Prepare COLA Burn & Request ISRO IS4OM Tracking Pass';
      } else if (missDistKm < 180) {
        riskLevel = 'MEDIUM';
        collisionProbability = 3.5e-6;
        recommendedManeuver = 'Enhanced Radar Tracking & Orbital Ephemeris Refinement';
      }

      if (missDistKm < 450) {
        risks.push({
          id: `cara-${active.id}-${debris.id}`,
          primarySat: active,
          secondaryObject: {
            name: debris.name,
            noradId: debris.noradId,
            type: debris.massKg && debris.massKg > 100 ? 'Rocket Body' : 'Debris',
          },
          tcaEpoch: new Date(date.getTime() + 18 * 60 * 1000),
          missDistanceKm: Math.round(missDistKm * 10) / 10,
          radialDistanceKm: Math.round(radialDistKm * 10) / 10,
          crossTrackDistanceKm: Math.round(Math.sqrt(Math.max(0, missDistKm ** 2 - radialDistKm ** 2)) * 10) / 10,
          collisionProbability,
          riskLevel,
          recommendedManeuver,
        });
      }
    }
  }

  return risks.sort((a, b) => a.missDistanceKm - b.missDistanceKm);
}
