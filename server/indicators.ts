import {createBroadbandProvider} from './broadband';
import {createIncomeProvider,createSoilProvider} from './snapshots';
import {createSchoolsProvider} from './schools';
import type {IndicatorGroup,IndicatorBundle,MunicipalityReport} from '../src/domain/model';
import {createTerritoryProvider} from './territory';
import {createServicesProvider} from './pharmacies';
import {createNatureProvider} from './nature';
import {createAirProvider} from './air';
export interface IndicatorProvider {id:string;get(report:MunicipalityReport):Promise<IndicatorBundle>}
export type IndicatorProviders=Record<IndicatorGroup,IndicatorProvider>;
export function createIndicatorProviders(options:{readAsset?:(path:string)=>Promise<Response>;fetcher?:typeof fetch;cache?:Cache;airKey?:string}={}):IndicatorProviders{
 return {broadband:createBroadbandProvider(options.readAsset),income:createIncomeProvider(options.readAsset),soil:createSoilProvider(options.readAsset),schools:createSchoolsProvider(options.readAsset),territory:createTerritoryProvider(options.fetcher,options.cache),services:createServicesProvider(options.readAsset),nature:createNatureProvider(options.fetcher,options.cache),air:createAirProvider(options.airKey,options.fetcher,options.cache)};
}
