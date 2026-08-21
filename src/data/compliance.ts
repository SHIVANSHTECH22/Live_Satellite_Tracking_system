export interface ComplianceItem {
  id: string;
  category: 'UN Treaty' | 'IN-SPACe / National' | 'ITU Spectrum' | 'Space Debris / IADC' | 'Geospatial Data Law';
  title: string;
  authority: string;
  summary: string;
  legalBasis: string;
  operationalImpact: string;
  complianceStatus: 'Active & Verified' | 'Mandatory Real-Time' | 'Audited';
}

export const SPACE_COMPLIANCE_REGULATIONS: ComplianceItem[] = [
  {
    id: 'un-ost-1967',
    category: 'UN Treaty',
    title: 'UN Outer Space Treaty (1967) - Articles VI, VII & VIII',
    authority: 'United Nations Committee on the Peaceful Uses of Outer Space (COPUOS)',
    summary: 'Establishes state responsibility for national space activities (whether governmental or non-governmental entities like Skyroot Aerospace), international liability for damage caused by space objects, and jurisdiction/control over registered orbital assets.',
    legalBasis: 'Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer Space, including the Moon and Other Celestial Bodies (UNGA Res 2222).',
    operationalImpact: 'All Skyroot Vikram launch objects and deployed payloads must be registered under national registries and transmitted to the UN Secretary-General.',
    complianceStatus: 'Active & Verified'
  },
  {
    id: 'un-registration-1974',
    category: 'UN Treaty',
    title: 'Convention on Registration of Objects Launched into Outer Space (1974)',
    authority: 'United Nations Office for Outer Space Affairs (UNOOSA)',
    summary: 'Requires launching States to maintain a national registry and furnish orbital parameters (nodal period, inclination, apogee, perigee, general function) to the United Nations Registry.',
    legalBasis: 'UNGA Resolution 3235 (XXIX). Mandatory for all sovereign states.',
    operationalImpact: 'This tracking platform pulls and verifies NORAD/COSPAR International Designators against UN Registration identifiers.',
    complianceStatus: 'Active & Verified'
  },
  {
    id: 'in-space-policy-2023',
    category: 'IN-SPACe / National',
    title: 'Indian Space Policy 2023 & IN-SPACe Authorization Framework',
    authority: 'IN-SPACe (Indian National Space Promotion and Authorization Centre) / DoS',
    summary: 'Authorizes Non-Government Entities (NGEs) such as Skyroot Aerospace to operate launch vehicles, satellites, and ground stations. Requires continuous telemetry sharing and Space Situational Awareness (SSA) coordination with ISRO IS4OM (ISTRAC).',
    legalBasis: 'Government of India Space Policy 2023 & IN-SPACe Guidelines for Satellite Operations.',
    operationalImpact: 'Skyroot Vikram-1 payload tracking conforms to real-time ephemeris reporting and launch safety corridors.',
    complianceStatus: 'Mandatory Real-Time'
  },
  {
    id: 'itu-radio-regs',
    category: 'ITU Spectrum',
    title: 'ITU Radio Regulations (Article 5 & Appendix 4 Frequency Allocation)',
    authority: 'International Telecommunication Union (ITU-R) / WPC (Wireless Planning & Coordination Wing, India)',
    summary: 'Governs international radio frequency spectrum allocations for Space Operation, Space Research, and Earth Exploration Satellite Service (EESS). Mandates strict non-harmful interference and Doppler compensation tracking.',
    legalBasis: 'ITU Radio Regulations 2024 Edition & National Frequency Allocation Plan (NFAP).',
    operationalImpact: 'Calculates real-time RF Doppler shifts (+/- kHz) across UHF (437 MHz), S-Band (2.2 GHz), and X-Band (8.4 GHz) downlinks to prevent co-channel interference.',
    complianceStatus: 'Active & Verified'
  },
  {
    id: 'iadc-debris-guidelines',
    category: 'Space Debris / IADC',
    title: 'IADC Space Debris Mitigation Guidelines & ISO 24113:2023',
    authority: 'Inter-Agency Space Debris Coordination Committee (IADC) / ISO TC 20/SC 14',
    summary: 'Mandates Post-Mission Disposal (PMD) ensuring LEO satellites de-orbit within 25 years (and newly recommended 5-year limit). Requires active Conjunction Assessment Risk Analysis (CARA) and collision avoidance maneuvers (COLA) when probability exceeds 1:10,000.',
    legalBasis: 'IADC-02-01 Rev 3 and UN COPUOS Space Debris Mitigation Guidelines (A/62/20).',
    operationalImpact: 'Live conjunction monitoring calculates orbital miss distances and collision risks against cataloged space debris (e.g. Fengyun-1C and Cosmos fragments).',
    complianceStatus: 'Mandatory Real-Time'
  },
  {
    id: 'india-geospatial-guidelines',
    category: 'Geospatial Data Law',
    title: 'National Geospatial Policy 2022 & Remote Sensing Data Distribution',
    authority: 'Department of Science and Technology (DST) / IN-SPACe',
    summary: 'Regulates high-resolution Earth Observation data acquisition, processing, and distribution. Ground spatial resolutions finer than 1 meter are subject to standard registration and security guidelines for sensitive terrestrial coordinates.',
    legalBasis: 'Guidelines for acquiring and producing Geospatial Data (DST OM No. SM/25/02/2020) & National Geospatial Policy 2022.',
    operationalImpact: 'Sub-satellite foot-printing displays optical swath boundaries and ground resolution classifications safely without exposing restricted target lists.',
    complianceStatus: 'Audited'
  }
];
