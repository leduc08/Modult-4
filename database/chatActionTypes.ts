export type ChatActionName = 'open_map' | 'open_planner' | 'open_food';

export interface ChatActionContext {
  destination: string;
  provinceId: string;
  coordinates: { lat: number; lng: number };
  days: number;
  guests: number;
  budget: number;
  style: string;
  poiIds: string[];
  foodIds: string[];
  chatContext: string;
}
