import type { DataProvider, SourceReview } from '../domain/model';
import { httpProvider } from './http';
export function assertSourceApproved(source: SourceReview): void {
 if(source.status !== 'approved' || !source.reviewedAt || !source.url || !source.license.url || source.license.commercialUse !== 'allowed') throw new Error(`Fonte non autorizzata: ${source.id}`);
}
export function createProvider(id:string):DataProvider {
 if(id==='http')return httpProvider;
 throw new Error(`Provider non configurato: ${id}`);
}
