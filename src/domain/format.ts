export const formatNumber = (n: number) => new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(n);
export const formatDate = (date: string | null) => date ? new Intl.DateTimeFormat('it-IT',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(date)) : 'Non disponibile';
