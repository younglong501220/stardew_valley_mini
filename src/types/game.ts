export type Direction = 'up' | 'down' | 'left' | 'right';

export type Season = 'spring' | 'summer' | 'fall';
export type Weather = 'sunny' | 'rainy';

export type CropId =
  | 'parsnip'
  | 'potato'
  | 'cauliflower'
  | 'strawberry'
  | 'blueberry'
  | 'melon'
  | 'corn'
  | 'pumpkin'
  | 'eggplant'
  | 'cranberry';

export interface CropConfig {
  id: CropId;
  name: string;
  season: Season[];
  growDays: number;
  seedPrice: number;
  sellPrice: number;
  energyRestore: number;
  color: string;
  stemColor: string;
  fruitShape: 'round' | 'pointed' | 'cluster' | 'head';
  regrowDays?: number; // e.g. strawberry, blueberry regrow without replanting!
  bonusYieldChance?: number; // e.g. potato has chance for +1
}

export type ForageId = 'daffodil' | 'dandelion' | 'horseradish' | 'berry' | 'mushroom';

export interface ForageConfig {
  id: ForageId;
  name: string;
  sellPrice: number;
  energyRestore: number;
  color: string;
}

export type ObstacleType = 'weed' | 'rock' | 'branch' | 'stump';

export interface FarmTile {
  tilled: boolean;
  watered: boolean;
  fertilized?: boolean;
  crop: {
    id: CropId;
    stage: number; // 0 to maxGrowth
    maxGrowth: number;
    isReady: boolean;
  } | null;
  obstacle: ObstacleType | null;
  forage: ForageId | null;
}

export type ToolType =
  | 'hoe'
  | 'watering_can'
  | 'scythe'
  | 'axe'
  | 'pickaxe'
  | 'fishing_rod'
  | 'seed'
  | 'item';

export interface InventoryItem {
  id: string; // e.g. 'tool:hoe', 'seed:parsnip', 'crop:parsnip', 'wood', etc.
  type: ToolType;
  name: string;
  count: number;
  icon: string; // Emoji / visual glyph
  cropId?: CropId;
  forageId?: ForageId;
  sellPrice?: number;
  energyRestore?: number;
  level?: number; // for upgraded tools
}

export interface PlayerState {
  x: number;
  y: number;
  dir: Direction;
  energy: number;
  maxEnergy: number;
  gold: number;
  waterLevel: number;
  maxWater: number;
  selectedSlotIndex: number;
  inventory: InventoryItem[];
}

export interface ShippedItemSummary {
  name: string;
  count: number;
  unitPrice: number;
  total: number;
  icon: string;
}

export interface DaySummaryData {
  day: number;
  season: Season;
  itemsShipped: ShippedItemSummary[];
  totalEarnings: number;
  newGold: number;
}

export interface FishItem {
  name: string;
  rarity: 'common' | 'rare' | 'legendary';
  sellPrice: number;
  difficulty: number; // 1 to 5
  icon: string;
  color: string;
}

export interface PetState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: Direction;
  type: 'cat' | 'dog';
  name: string;
  isSleeping: boolean;
  heartTimer: number; // >0 means heart bubble animation is showing
}

