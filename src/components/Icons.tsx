import { Sun, Mountain, Wind, TramFront, Trees } from 'lucide-react';
import type { CategoryId } from '../domain/model';
const icons = {clima:Sun,rischi:Mountain,aria:Wind,servizi:TramFront,natura:Trees};
export function CategoryIcon({id,size=24}:{id:CategoryId;size?:number}) {const Icon=icons[id]; return <Icon size={size} strokeWidth={1.6} aria-hidden="true"/>;}
