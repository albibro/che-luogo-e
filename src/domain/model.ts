export type CategoryId = 'clima' | 'rischi' | 'aria' | 'servizi' | 'natura' | 'demografia' | 'territorio' | 'scuole' | 'economia' | 'case' | 'sicurezza' | 'connettivita';
export type DataKind = 'observed' | 'derived' | 'forecast';
export type Reliability = 'high' | 'medium' | 'low' | 'not-assessed';
export interface SourceReview {
  id: string; name: string; publisher: string; url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'configuration-required';
  license: { name: string | null; url: string | null; commercialUse: 'allowed' | 'forbidden' | 'unverified'; attribution: string | null };
  reviewedAt: string | null; coverage: string; granularity: string; limitations: string[];
}
export interface Municipality { id: string; slug: string; name: string; region: string; province: string; istatCode: string | null; centroid: [number, number] | null }
export interface IndicatorDefinition {
  id: string; category: CategoryId; name: string; unit: string; description: string;
  plannedMethod: string; comparability: string; providerGroup?: IndicatorGroup; unavailableReason?:string;
}
export interface Observation {
  id: string; municipalityId: string; indicatorId: string; sourceId: string; kind: DataKind;
  // The source value is never replaced with a score or an imputed value.
  value: number | null; unit: string; missingReason: string | null;
  period: { from: string; to: string } | null;
  retrievedAt: string; sourceUpdatedAt: string | null;
  spatial: { level: 'municipality' | 'point' | 'grid' | 'province' | 'bounding-box'; resolution: string; coveragePercent: number | null };
  reliability: { level: Reliability; reason: string };
  methodVersion: string | null; methodDescription?:string; lineage: string[];
  raw: { payload: unknown; originalUrl: string | null; checksum: string | null };
}
export interface Assessment {
  indicatorId: string; observationIds: string[]; score: number | null;
  label: string; methodVersion: string | null; explanation: string;
}
export interface MunicipalityReport { municipality: Municipality; observations: Observation[]; assessments: Assessment[]; mode: 'live'; provenance: RegistryStatus; original: Record<string, unknown>; boundary:BoundarySummary|null; boundaryMissingReason:string|null }
export interface DataProvider {
  id: string; mode: 'live';
  searchMunicipalities(query: string, signal?: AbortSignal): Promise<Municipality[]>;
  getMunicipality(slug: string, signal?: AbortSignal): Promise<MunicipalityReport | null>;
  getSources(signal?: AbortSignal): Promise<SourceReview[]>;
  getStatus(signal?: AbortSignal): Promise<RegistryStatus>;
  getClimate?(slug:string,signal?:AbortSignal):Promise<ClimateResponse>;
  getIndicators?(slug:string,group:IndicatorGroup,signal?:AbortSignal):Promise<IndicatorBundle>;
  getBoundary(slug:string,signal?:AbortSignal):Promise<BoundaryResponse|null>;
}
export function assertObservation(observation: Observation): void {
  if (!observation.sourceId || !observation.retrievedAt || !observation.spatial.resolution) throw new Error('Provenienza incompleta');
  if (observation.value === null && !observation.missingReason) throw new Error('Il dato mancante richiede una motivazione');
  if (observation.value !== null && !Number.isFinite(observation.value)) throw new Error('Valore non valido');
  if (observation.value !== null && observation.missingReason) throw new Error('Valore presente e motivazione di assenza incompatibili');
  if (['derived', 'forecast'].includes(observation.kind) && !observation.methodVersion) throw new Error('Metodo richiesto');
  if (observation.kind === 'derived' && !observation.lineage.length) throw new Error('Input di elaborazione richiesti');
}

export interface RegistryStatus {
 sourceId:string; sourceUrl:string; referenceDate:string; retrievedAt:string; sourceUpdatedAt:string|null;
 count:number; sha256:string; license:string; licenseUrl:string; attribution:string; methodVersion:string;
 spatialResolution:string; reliability:{level:string;reason:string};
}

export interface BoundarySummary {
 sourceId:string; referenceDate:string; retrievedAt:string; sourceUpdatedAt:string|null;
 originalUrl:string; originalSha256:string; license:string; licenseUrl:string;
 methodVersion:string; sourceCrs:string; outputCrs:string; simplification:string; warning:string;
 reliability:{level:string;reason:string};
 centroid:[number,number]; mapCenter:[number,number]; bbox:[number,number,number,number];
 originalName:string; sha256:string; originalAttributes:Record<string,unknown>;
}
export interface BoundaryFeature {
 type:'Feature';id:string;properties:{istatCode:string;sourceId:string;referenceDate:string;kind:'derived';methodVersion:string};
 geometry:{type:'Polygon';coordinates:number[][][]}|{type:'MultiPolygon';coordinates:number[][][][]};
}
export interface BoundaryResponse {feature:BoundaryFeature;provenance:BoundarySummary}

export interface ClimateResponse {sourceId:string;year:number;cell:[number,number];observations:Observation[];original:{payload:unknown;text:string;url:string;checksum:string;retrievedAt:string}}
export type IndicatorGroup='territory'|'services'|'nature'|'air'|'income'|'soil'|'schools'|'broadband';
export interface OriginalResponse {payload:unknown;text:string;url:string;checksum:string;retrievedAt:string}
export interface IndicatorBundle {sourceId:string;sourceName:string;status:'ready'|'configuration-required';message:string;observations:Observation[];original:OriginalResponse|null;entries?:{id:string;title:string;description:string}[]}
