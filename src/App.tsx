import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Direction,
  FarmTile,
  PlayerState,
  Season,
  Weather,
  InventoryItem,
  DaySummaryData,
  FishItem,
  CropId,
  ShippedItemSummary,
} from './types/game';
import { CROPS_DATA, FORAGE_DATA } from './data/crops';
import { sounds } from './audio/soundManager';
import {
  FarmCanvas,
  COLS,
  ROWS,
  HOUSE_RECT,
  SHOP_BIN_POS,
  SHIPPING_BIN_POS,
  POND_RECT,
  APPLE_TREE_POS,
} from './components/FarmCanvas';
import { HUD } from './components/HUD';
import { Toolbar } from './components/Toolbar';
import { ShopModal } from './components/ShopModal';
import { FishingModal } from './components/FishingModal';
import { DaySummaryModal } from './components/DaySummaryModal';
import { GuideModal } from './components/GuideModal';
import { MobileControls } from './components/MobileControls';

// Import generated visual assets with safe zero-broken-image fallbacks
import bannerImg from './assets/images/stardew_farm_banner_1791209498535.jpg';
import farmerImg from './assets/images/farmer_portrait_1791209510531.jpg';

const SAVE_KEY = 'stardew_mini_save_v1';

// Initial default tools and starting kit
const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 'tool:hoe', type: 'hoe', name: '鐵鋤頭', count: 1, icon: '⛏️', level: 1 },
  { id: 'tool:watering_can', type: 'watering_can', name: '澆水壺', count: 1, icon: '🪣', level: 1 },
  { id: 'tool:scythe', type: 'scythe', name: '鐮刀', count: 1, icon: '🌾' },
  { id: 'tool:axe', type: 'axe', name: '斧頭', count: 1, icon: '🪓' },
  { id: 'tool:pickaxe', type: 'pickaxe', name: '十字鎬', count: 1, icon: '🔨' },
  { id: 'tool:fishing_rod', type: 'fishing_rod', name: '竹釣竿', count: 1, icon: '🎣' },
  {
    id: 'seed:parsnip',
    type: 'seed',
    name: '防風草種子',
    count: 5,
    icon: '🌱',
    cropId: 'parsnip',
  },
];

// Generate an initial interesting farm with some debris, flowers, and tillable land
const createInitialFarmGrid = (): FarmTile[][] => {
  const grid: FarmTile[][] = [];
  for (let r = 0; r < ROWS; r++) {
    grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = {
        tilled: false,
        watered: false,
        crop: null,
        obstacle: null,
        forage: null,
      };

      // Exclude special zones from random obstacles
      const inHouse =
        c >= HOUSE_RECT.x - 1 &&
        c < HOUSE_RECT.x + HOUSE_RECT.w + 1 &&
        r >= HOUSE_RECT.y - 1 &&
        r < HOUSE_RECT.y + HOUSE_RECT.h + 1;
      const inPond =
        c >= POND_RECT.x - 1 &&
        c < POND_RECT.x + POND_RECT.w + 1 &&
        r >= POND_RECT.y - 1 &&
        r < POND_RECT.y + POND_RECT.h + 1;
      const inShop =
        c >= SHOP_BIN_POS.x &&
        c < SHOP_BIN_POS.x + SHOP_BIN_POS.w &&
        r >= SHOP_BIN_POS.y &&
        r < SHOP_BIN_POS.y + SHOP_BIN_POS.h;
      const inTree = c === APPLE_TREE_POS.x && r === APPLE_TREE_POS.y;

      if (!inHouse && !inPond && !inShop && !inTree) {
        const rand = (r * 13 + c * 37) % 100;
        if (rand < 7) {
          grid[r][c].obstacle = 'weed';
        } else if (rand >= 7 && rand < 12) {
          grid[r][c].obstacle = 'branch';
        } else if (rand >= 12 && rand < 16) {
          grid[r][c].obstacle = 'rock';
        } else if (rand >= 94) {
          grid[r][c].forage = 'daffodil';
        }
      }
    }
  }
  return grid;
};

export default function App() {
  // Calendar & Weather
  const [day, setDay] = useState<number>(1);
  const [season, setSeason] = useState<Season>('spring');
  const [weather, setWeather] = useState<Weather>('sunny');
  const [nextWeather, setNextWeather] = useState<Weather>('sunny');
  const [timeHour, setTimeHour] = useState<number>(6);
  const [timeMinute, setTimeMinute] = useState<number>(0);

  // Player State
  const [player, setPlayer] = useState<PlayerState>({
    x: 4,
    y: 5,
    dir: 'down',
    energy: 100,
    maxEnergy: 100,
    gold: 100,
    waterLevel: 20,
    maxWater: 20,
    selectedSlotIndex: 0,
    inventory: DEFAULT_INVENTORY,
  });

  const [maxSlots, setMaxSlots] = useState<number>(7);
  const [farmGrid, setFarmGrid] = useState<FarmTile[][]>(createInitialFarmGrid);
  const [hasApples, setHasApples] = useState<boolean>(true);
  const [shippingBin, setShippingBin] = useState<ShippedItemSummary[]>([]);

  // Farm Pet State (Ginger Cat "咪咪")
  const [pet, setPet] = useState<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    dir: Direction;
    type: 'cat' | 'dog';
    name: string;
    isSleeping: boolean;
    heartTimer: number;
  }>({
    x: 7,
    y: 5,
    targetX: 7,
    targetY: 5,
    dir: 'down',
    type: 'cat',
    name: '咪咪',
    isSleeping: false,
    heartTimer: 0,
  });
  const [petMessage, setPetMessage] = useState<string | null>(null);

  // Sound & Modals
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [isFishingOpen, setIsFishingOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [daySummaryData, setDaySummaryData] = useState<DaySummaryData | null>(null);
  const [toolEffect, setToolEffect] = useState<{ x: number; y: number; type: string } | null>(null);

  // Load saved game from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.day) setDay(parsed.day);
        if (parsed.season) setSeason(parsed.season);
        if (parsed.weather) setWeather(parsed.weather);
        if (parsed.player) setPlayer(parsed.player);
        if (parsed.farmGrid) setFarmGrid(parsed.farmGrid);
        if (parsed.maxSlots) setMaxSlots(parsed.maxSlots);
      }
    } catch {
      // Ignore corrupted save
    }
  }, []);

  // Save to LocalStorage on major state updates
  useEffect(() => {
    try {
      const dataToSave = {
        day,
        season,
        weather,
        player,
        farmGrid,
        maxSlots,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Ignore
    }
  }, [day, season, weather, player, farmGrid, maxSlots]);

  // Game clock timer
  useEffect(() => {
    if (isSummaryOpen || isShopOpen || isFishingOpen || isGuideOpen) return;

    const timer = setInterval(() => {
      setTimeMinute((prevMin) => {
        if (prevMin + 10 >= 60) {
          setTimeHour((prevH) => {
            const nextH = prevH + 1;
            // 2:00 AM Collapse!
            if (nextH >= 26 || (nextH >= 2 && prevH === 1)) {
              handleExhaustionSleep();
              return 6;
            }
            return nextH;
          });
          return 0;
        }
        return prevMin + 10;
      });
    }, 4500); // 4.5 seconds per 10 game minutes (cozy pace)

    return () => clearInterval(timer);
  }, [isSummaryOpen, isShopOpen, isFishingOpen, isGuideOpen]);

  // Pet Autonomous Wandering & Heart Timer Decay
  useEffect(() => {
    const petTimer = setInterval(() => {
      setPet((prev) => {
        const nextHeart = prev.heartTimer > 0 ? prev.heartTimer - 1 : 0;

        // Randomly transition between sleeping and awake
        let nextSleep = prev.isSleeping;
        if (prev.isSleeping) {
          if (Math.random() < 0.25) nextSleep = false;
        } else {
          if (Math.random() < 0.15) nextSleep = true;
        }

        if (nextSleep) {
          return { ...prev, isSleeping: true, heartTimer: nextHeart };
        }

        // Random wander step
        const dirs: Direction[] = ['up', 'down', 'left', 'right'];
        const chosenDir = dirs[Math.floor(Math.random() * dirs.length)];
        let nx = prev.x;
        let ny = prev.y;
        if (chosenDir === 'up') ny--;
        if (chosenDir === 'down') ny++;
        if (chosenDir === 'left') nx--;
        if (chosenDir === 'right') nx++;

        // Collision check: avoid buildings, pond, apple tree, obstacles
        const inHouse =
          nx >= HOUSE_RECT.x &&
          nx < HOUSE_RECT.x + HOUSE_RECT.w &&
          ny >= HOUSE_RECT.y &&
          ny < HOUSE_RECT.y + HOUSE_RECT.h;
        const inShop =
          nx >= SHOP_BIN_POS.x &&
          nx < SHOP_BIN_POS.x + SHOP_BIN_POS.w &&
          ny >= SHOP_BIN_POS.y &&
          ny < SHOP_BIN_POS.y + SHOP_BIN_POS.h;
        const inShipping = nx === SHIPPING_BIN_POS.x && ny === SHIPPING_BIN_POS.y;
        const inPond =
          nx >= POND_RECT.x &&
          nx < POND_RECT.x + POND_RECT.w &&
          ny >= POND_RECT.y &&
          ny < POND_RECT.y + POND_RECT.h;
        const inTree = nx === APPLE_TREE_POS.x && ny === APPLE_TREE_POS.y;
        const hasObstacle = farmGrid[ny]?.[nx]?.obstacle !== null;

        if (
          nx >= 0 &&
          nx < COLS &&
          ny >= 0 &&
          ny < ROWS &&
          !inHouse &&
          !inShop &&
          !inShipping &&
          !inPond &&
          !inTree &&
          !hasObstacle
        ) {
          return {
            ...prev,
            x: nx,
            y: ny,
            dir: chosenDir,
            isSleeping: false,
            heartTimer: nextHeart,
          };
        }

        return { ...prev, dir: chosenDir, heartTimer: nextHeart };
      });
    }, 2200);

    return () => clearInterval(petTimer);
  }, [farmGrid]);

  // Sound toggles
  const handleToggleSound = () => {
    sounds.sfxEnabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const handleToggleBGM = () => {
    const next = sounds.toggleBGM();
    setBgmEnabled(next);
  };

  // Add or stack item in player inventory
  const addItemToInventory = useCallback(
    (item: Omit<InventoryItem, 'count'>, countToAdd: number = 1) => {
      setPlayer((prev) => {
        const inv = [...prev.inventory];
        // Check for existing stack
        const existingIdx = inv.findIndex((i) => i.id === item.id);
        if (existingIdx >= 0) {
          inv[existingIdx] = {
            ...inv[existingIdx],
            count: inv[existingIdx].count + countToAdd,
          };
          return { ...prev, inventory: inv };
        }

        // Add to new slot if space allows
        if (inv.length < maxSlots) {
          inv.push({ ...item, count: countToAdd });
          return { ...prev, inventory: inv };
        }

        // Full inventory notice
        return prev;
      });
    },
    [maxSlots]
  );

  // Consume item from inventory
  const removeItemFromInventory = useCallback(
    (slotIndex: number, countToRemove: number = 1) => {
      setPlayer((prev) => {
        const inv = [...prev.inventory];
        const target = inv[slotIndex];
        if (!target) return prev;

        if (target.count > countToRemove) {
          inv[slotIndex] = {
            ...target,
            count: target.count - countToRemove,
          };
        } else {
          inv.splice(slotIndex, 1);
        }

        const newSelectedIndex =
          prev.selectedSlotIndex >= inv.length
            ? Math.max(0, inv.length - 1)
            : prev.selectedSlotIndex;

        return {
          ...prev,
          inventory: inv,
          selectedSlotIndex: newSelectedIndex,
        };
      });
    },
    []
  );

  // Eat crop or food
  const handleEatItem = (slotIndex: number) => {
    const item = player.inventory[slotIndex];
    if (!item || !item.energyRestore || item.count <= 0) return;

    sounds.play('eat');
    const restored = item.energyRestore;
    setPlayer((prev) => ({
      ...prev,
      energy: Math.min(prev.maxEnergy, prev.energy + restored),
    }));
    removeItemFromInventory(slotIndex, 1);
  };

  // Sleep and Next Day calculation
  const sleepAndNextDay = (exhausted: boolean = false) => {
    sounds.play('sleep');

    // 1. Tally Shipping Bin Revenue
    let totalEarnings = 0;
    shippingBin.forEach((item) => {
      totalEarnings += item.total;
    });

    const newGold = player.gold + totalEarnings;
    const summaryData: DaySummaryData = {
      day,
      season,
      itemsShipped: [...shippingBin],
      totalEarnings,
      newGold,
    };
    setDaySummaryData(summaryData);
    setIsSummaryOpen(true);

    // 2. Prepare Next Day State
    const nextDayNum = day + 1;
    // Advance season every 14 days for lively gameplay
    let nextSeason = season;
    if (nextDayNum > 28 && season === 'fall') {
      nextSeason = 'spring';
    } else if (nextDayNum > 14 && season === 'spring') {
      nextSeason = 'summer';
    } else if (nextDayNum > 28 && season === 'summer') {
      nextSeason = 'fall';
    }

    // 3. Crop Growth Logic
    setFarmGrid((prevGrid) => {
      const nextGrid = prevGrid.map((row) =>
        row.map((tile) => {
          const newTile = { ...tile };

          // If tile had crop and was watered, grow it!
          if (newTile.crop && newTile.watered) {
            const nextStage = newTile.crop.stage + 1;
            const isReady = nextStage >= newTile.crop.maxGrowth;
            newTile.crop = {
              ...newTile.crop,
              stage: nextStage,
              isReady,
            };
          }

          // Soil dryness: dries unless next weather is rainy
          if (nextWeather === 'rainy') {
            newTile.watered = true; // Mother Nature waters all!
          } else {
            newTile.watered = false;
          }

          // Random chance for weed or forage to spawn on empty grass
          if (!newTile.tilled && !newTile.obstacle && !newTile.forage) {
            if (Math.random() < 0.03) {
              newTile.forage = 'daffodil';
            } else if (Math.random() < 0.02) {
              newTile.obstacle = 'weed';
            }
          }

          return newTile;
        })
      );
      return nextGrid;
    });

    // 4. Apple Tree fruit respawn
    if (nextDayNum % 3 === 0) {
      setHasApples(true);
    }

    // 5. Update Player State
    setPlayer((prev) => ({
      ...prev,
      x: 12,
      y: 4, // Wake up in front of house
      dir: 'down',
      gold: newGold,
      energy: exhausted ? Math.floor(prev.maxEnergy * 0.6) : prev.maxEnergy,
      waterLevel: prev.maxWater, // refill can
    }));

    // Clear shipping bin
    setShippingBin([]);

    // Roll random weather for following day
    const willRain = Math.random() < 0.28;
    setNextWeather(willRain ? 'rainy' : 'sunny');
  };

  const handleExhaustionSleep = () => {
    sleepAndNextDay(true);
  };

  const handleStartNextDay = () => {
    setIsSummaryOpen(false);
    setDay((prev) => prev + 1);
    setWeather(nextWeather);
    setTimeHour(6);
    setTimeMinute(0);
  };

  // Refill watering can
  const handleRefillWater = () => {
    // Check if near pond
    const nearPond =
      player.x >= POND_RECT.x - 1 &&
      player.x <= POND_RECT.x + POND_RECT.w &&
      player.y >= POND_RECT.y - 1 &&
      player.y <= POND_RECT.y + POND_RECT.h;

    if (nearPond) {
      sounds.play('splash');
      setPlayer((prev) => ({
        ...prev,
        waterLevel: prev.maxWater,
      }));
    } else {
      sounds.play('chop');
    }
  };

  // Pet interaction handler with randomized sound variants and instantaneous interruption
  const handlePetInteract = () => {
    // Sound variants: purr (呼嚕聲), meow_short (短促喵叫), meow_happy (快樂叫聲), meow_sweet (甜美長喵)
    const variants: Array<{
      type: 'purr' | 'meow_short' | 'meow_happy' | 'meow_sweet';
      msg: string;
    }> = [
      {
        type: 'purr',
        msg: '❤️ 小橘貓【咪咪】舒服地瞇起雙眼，發出陣陣溫柔的呼嚕聲～ (體力 +5)',
      },
      {
        type: 'meow_short',
        msg: '❤️ 小橘貓【咪咪】短促俐落地喵了一聲，親暱地蹭了蹭你的手！ (體力 +5)',
      },
      {
        type: 'meow_happy',
        msg: '❤️ 小橘貓【咪咪】發出愉悅歡快的叫聲，尾巴高高豎起輕快跳躍！ (體力 +5)',
      },
      {
        type: 'meow_sweet',
        msg: '❤️ 小橘貓【咪咪】發出甜美綿長的撒嬌喵叫，在地上翻肚皮呼嚕！ (體力 +5)',
      },
    ];

    const pick = variants[Math.floor(Math.random() * variants.length)];

    // Play pet sound with clean audio interruption of any previous pet voice
    sounds.playPetSound(pick.type);

    setPet((prev) => ({
      ...prev,
      isSleeping: false,
      heartTimer: 45,
    }));
    setPetMessage(pick.msg);
    setTimeout(() => setPetMessage(null), 3600);

    setPlayer((prev) => ({
      ...prev,
      energy: Math.min(prev.maxEnergy, prev.energy + 5),
    }));
  };

  // Main interaction engine (works from Keyboard Space or direct Tile Click!)
  const handleInteractWithTile = (targetX: number, targetY: number) => {
    // Check if player exhausted
    if (player.energy <= 0) {
      sounds.play('chop');
      return;
    }

    // 0. Pet Check -> Pet the Cat!
    const distToPet = Math.hypot(targetX - pet.x, targetY - pet.y);
    if (distToPet <= 1.2) {
      handlePetInteract();
      return;
    }

    // 1. House Check -> Sleep
    const inHouse =
      targetX >= HOUSE_RECT.x &&
      targetX < HOUSE_RECT.x + HOUSE_RECT.w &&
      targetY >= HOUSE_RECT.y &&
      targetY < HOUSE_RECT.y + HOUSE_RECT.h;
    if (inHouse) {
      sleepAndNextDay(false);
      return;
    }

    // 2. Pierre's Shop Check
    const inShop =
      targetX >= SHOP_BIN_POS.x &&
      targetX < SHOP_BIN_POS.x + SHOP_BIN_POS.w &&
      targetY >= SHOP_BIN_POS.y &&
      targetY < SHOP_BIN_POS.y + SHOP_BIN_POS.h;
    if (inShop) {
      sounds.play('coin');
      setIsShopOpen(true);
      return;
    }

    // 3. Shipping Bin Check
    if (targetX === SHIPPING_BIN_POS.x && targetY === SHIPPING_BIN_POS.y) {
      const activeItem = player.inventory[player.selectedSlotIndex];
      if (activeItem && activeItem.sellPrice && activeItem.count > 0) {
        sounds.play('coin');
        // Ship 1 count of item
        setShippingBin((prev) => {
          const list = [...prev];
          const exist = list.find((i) => i.name === activeItem.name);
          if (exist) {
            exist.count += 1;
            exist.total = exist.count * exist.unitPrice;
          } else {
            list.push({
              name: activeItem.name,
              count: 1,
              unitPrice: activeItem.sellPrice!,
              total: activeItem.sellPrice!,
              icon: activeItem.icon,
            });
          }
          return list;
        });
        removeItemFromInventory(player.selectedSlotIndex, 1);
      } else {
        sounds.play('chop');
      }
      return;
    }

    // 4. Pond Fishing / Refill Check
    const inPond =
      targetX >= POND_RECT.x &&
      targetX < POND_RECT.x + POND_RECT.w &&
      targetY >= POND_RECT.y &&
      targetY < POND_RECT.y + POND_RECT.h;
    if (inPond) {
      const activeItem = player.inventory[player.selectedSlotIndex];
      if (activeItem?.type === 'fishing_rod') {
        setIsFishingOpen(true);
      } else {
        // Refill can
        sounds.play('splash');
        setPlayer((prev) => ({
          ...prev,
          waterLevel: prev.maxWater,
        }));
      }
      return;
    }

    // 5. Apple Tree Harvest Check
    if (targetX === APPLE_TREE_POS.x && targetY === APPLE_TREE_POS.y) {
      if (hasApples) {
        sounds.play('harvest');
        setHasApples(false);
        addItemToInventory(
          {
            id: 'item:apple',
            type: 'item',
            name: '甜蘋果',
            icon: '🍎',
            sellPrice: 40,
            energyRestore: 30,
          },
          3
        );
      }
      return;
    }

    // 6. Farm Tile Actions
    if (targetX < 0 || targetX >= COLS || targetY < 0 || targetY >= ROWS) return;

    const currentTile = farmGrid[targetY][targetX];
    const activeItem = player.inventory[player.selectedSlotIndex];
    if (!activeItem) return;

    const currentHoeLevel =
      player.inventory.find((i) => i.type === 'hoe')?.level || 1;
    const currentCanLevel =
      player.inventory.find((i) => i.type === 'watering_can')?.level || 1;

    // Pick up wild forage
    if (currentTile.forage) {
      const fDef = FORAGE_DATA[currentTile.forage];
      if (fDef) {
        sounds.play('harvest');
        addItemToInventory({
          id: `forage:${fDef.id}`,
          type: 'item',
          name: fDef.name,
          icon: '🌼',
          sellPrice: fDef.sellPrice,
          energyRestore: fDef.energyRestore,
        });
        setFarmGrid((prev) => {
          const next = [...prev.map((r) => [...r])];
          next[targetY][targetX].forage = null;
          return next;
        });
        setPlayer((prev) => ({ ...prev, energy: Math.max(0, prev.energy - 1) }));
      }
      return;
    }

    // TOOL: HOE
    if (activeItem.type === 'hoe') {
      const tilesToTill = [{ x: targetX, y: targetY }];
      if (currentHoeLevel >= 2) {
        // Copper Hoe tills 3 tiles along facing direction!
        if (player.dir === 'up') {
          tilesToTill.push({ x: targetX, y: targetY - 1 }, { x: targetX, y: targetY - 2 });
        } else if (player.dir === 'down') {
          tilesToTill.push({ x: targetX, y: targetY + 1 }, { x: targetX, y: targetY + 2 });
        } else if (player.dir === 'left') {
          tilesToTill.push({ x: targetX - 1, y: targetY }, { x: targetX - 2, y: targetY });
        } else {
          tilesToTill.push({ x: targetX + 1, y: targetY }, { x: targetX + 2, y: targetY });
        }
      }

      let tilledAny = false;
      setFarmGrid((prev) => {
        const next = [...prev.map((r) => [...r])];
        tilesToTill.forEach((t) => {
          if (
            t.x >= 0 &&
            t.x < COLS &&
            t.y >= 0 &&
            t.y < ROWS &&
            !next[t.y][t.x].tilled &&
            !next[t.y][t.x].obstacle
          ) {
            next[t.y][t.x].tilled = true;
            tilledAny = true;
          }
        });
        return next;
      });

      if (tilledAny) {
        sounds.play('till');
        setToolEffect({ x: targetX, y: targetY, type: 'till' });
        setTimeout(() => setToolEffect(null), 250);
        setPlayer((prev) => ({ ...prev, energy: Math.max(0, prev.energy - 2) }));
      }
    }

    // TOOL: WATERING CAN
    else if (activeItem.type === 'watering_can') {
      if (player.waterLevel <= 0) {
        sounds.play('chop');
        return;
      }

      const tilesToWater = [{ x: targetX, y: targetY }];
      if (currentCanLevel >= 2) {
        // Copper Can waters 3 tiles!
        if (player.dir === 'up') {
          tilesToWater.push({ x: targetX, y: targetY - 1 }, { x: targetX, y: targetY - 2 });
        } else if (player.dir === 'down') {
          tilesToWater.push({ x: targetX, y: targetY + 1 }, { x: targetX, y: targetY + 2 });
        } else if (player.dir === 'left') {
          tilesToWater.push({ x: targetX - 1, y: targetY }, { x: targetX - 2, y: targetY });
        } else {
          tilesToWater.push({ x: targetX + 1, y: targetY }, { x: targetX + 2, y: targetY });
        }
      }

      let wateredCount = 0;
      setFarmGrid((prev) => {
        const next = [...prev.map((r) => [...r])];
        tilesToWater.forEach((t) => {
          if (
            t.x >= 0 &&
            t.x < COLS &&
            t.y >= 0 &&
            t.y < ROWS &&
            next[t.y][t.x].tilled &&
            !next[t.y][t.x].watered
          ) {
            next[t.y][t.x].watered = true;
            wateredCount++;
          }
        });
        return next;
      });

      if (wateredCount > 0) {
        sounds.play('water');
        setToolEffect({ x: targetX, y: targetY, type: 'water' });
        setTimeout(() => setToolEffect(null), 250);
        setPlayer((prev) => ({
          ...prev,
          waterLevel: Math.max(0, prev.waterLevel - wateredCount),
          energy: Math.max(0, prev.energy - 2),
        }));
      }
    }

    // TOOL: SEED SOWING
    else if (activeItem.type === 'seed' && activeItem.cropId) {
      if (currentTile.tilled && !currentTile.crop && activeItem.count > 0) {
        const cropDef = CROPS_DATA[activeItem.cropId];
        if (cropDef) {
          sounds.play('seed');
          setFarmGrid((prev) => {
            const next = [...prev.map((r) => [...r])];
            next[targetY][targetX].crop = {
              id: activeItem.cropId!,
              stage: 0,
              maxGrowth: cropDef.growDays,
              isReady: false,
            };
            return next;
          });
          removeItemFromInventory(player.selectedSlotIndex, 1);
        }
      }
    }

    // TOOL: SCYTHE (HARVEST / CUT WEEDS)
    else if (activeItem.type === 'scythe') {
      // 1. Cut weeds
      if (currentTile.obstacle === 'weed') {
        sounds.play('scythe');
        setFarmGrid((prev) => {
          const next = [...prev.map((r) => [...r])];
          next[targetY][targetX].obstacle = null;
          return next;
        });
        addItemToInventory({
          id: 'item:fiber',
          type: 'item',
          name: '纖維草',
          icon: '🌿',
          sellPrice: 5,
        });
        return;
      }

      // 2. Harvest ready crops
      if (currentTile.crop && currentTile.crop.isReady) {
        const cropDef = CROPS_DATA[currentTile.crop.id];
        if (cropDef) {
          sounds.play('harvest');
          // Bonus yield logic (e.g. Potato)
          let harvestCount = 1;
          if (cropDef.bonusYieldChance && Math.random() < cropDef.bonusYieldChance) {
            harvestCount += 1;
          }

          addItemToInventory(
            {
              id: `crop:${cropDef.id}`,
              type: 'item',
              name: cropDef.name,
              icon: cropDef.id === 'pumpkin' ? '🎃' : cropDef.id === 'strawberry' ? '🍓' : '🥕',
              sellPrice: cropDef.sellPrice,
              energyRestore: cropDef.energyRestore,
            },
            harvestCount
          );

          setFarmGrid((prev) => {
            const next = [...prev.map((r) => [...r])];
            // If crop regrows (e.g. Strawberry, Blueberry, Corn, Eggplant, Cranberry)
            if (cropDef.regrowDays) {
              next[targetY][targetX].crop = {
                ...currentTile.crop!,
                stage: cropDef.growDays - cropDef.regrowDays,
                isReady: false,
              };
            } else {
              next[targetY][targetX].crop = null;
            }
            return next;
          });
        }
      }
    }

    // TOOL: AXE (CHOP BRANCHES)
    else if (activeItem.type === 'axe') {
      if (currentTile.obstacle === 'branch') {
        sounds.play('chop');
        setFarmGrid((prev) => {
          const next = [...prev.map((r) => [...r])];
          next[targetY][targetX].obstacle = null;
          return next;
        });
        addItemToInventory({
          id: 'item:wood',
          type: 'item',
          name: '木材',
          icon: '🪵',
          sellPrice: 10,
        });
        setPlayer((prev) => ({ ...prev, energy: Math.max(0, prev.energy - 2) }));
      }
    }

    // TOOL: PICKAXE (BREAK ROCKS OR UNTILL)
    else if (activeItem.type === 'pickaxe') {
      if (currentTile.obstacle === 'rock') {
        sounds.play('rock');
        setFarmGrid((prev) => {
          const next = [...prev.map((r) => [...r])];
          next[targetY][targetX].obstacle = null;
          return next;
        });
        addItemToInventory({
          id: 'item:stone',
          type: 'item',
          name: '石塊',
          icon: '🪨',
          sellPrice: 10,
        });
        setPlayer((prev) => ({ ...prev, energy: Math.max(0, prev.energy - 2) }));
      } else if (currentTile.tilled && !currentTile.crop) {
        sounds.play('till');
        setFarmGrid((prev) => {
          const next = [...prev.map((r) => [...r])];
          next[targetY][targetX].tilled = false;
          next[targetY][targetX].watered = false;
          return next;
        });
      }
    }
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't move while modal is open
      if (isShopOpen || isFishingOpen || isSummaryOpen || isGuideOpen) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Hotkey slot selection (1-9)
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= player.inventory.length) {
        setPlayer((prev) => ({ ...prev, selectedSlotIndex: num - 1 }));
        return;
      }

      // Spacebar or Enter interaction
      if (e.key === ' ' || e.key === 'Enter') {
        let targetX = player.x;
        let targetY = player.y;
        if (player.dir === 'up') targetY--;
        if (player.dir === 'down') targetY++;
        if (player.dir === 'left') targetX--;
        if (player.dir === 'right') targetX++;

        handleInteractWithTile(targetX, targetY);
        return;
      }

      // Movement
      let nextX = player.x;
      let nextY = player.y;
      let newDir = player.dir;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        nextY--;
        newDir = 'up';
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        nextY++;
        newDir = 'down';
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        nextX--;
        newDir = 'left';
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        nextX++;
        newDir = 'right';
      } else {
        return;
      }

      // Obstacle & collision check
      const hitHouse =
        nextX >= HOUSE_RECT.x &&
        nextX < HOUSE_RECT.x + HOUSE_RECT.w &&
        nextY >= HOUSE_RECT.y &&
        nextY < HOUSE_RECT.y + HOUSE_RECT.h;
      const hitShop =
        nextX >= SHOP_BIN_POS.x &&
        nextX < SHOP_BIN_POS.x + SHOP_BIN_POS.w &&
        nextY >= SHOP_BIN_POS.y &&
        nextY < SHOP_BIN_POS.y + SHOP_BIN_POS.h;
      const hitShipping = nextX === SHIPPING_BIN_POS.x && nextY === SHIPPING_BIN_POS.y;
      const hitTree = nextX === APPLE_TREE_POS.x && nextY === APPLE_TREE_POS.y;
      const hitPond =
        nextX >= POND_RECT.x &&
        nextX < POND_RECT.x + POND_RECT.w &&
        nextY >= POND_RECT.y &&
        nextY < POND_RECT.y + POND_RECT.h;
      const hitObstacle =
        farmGrid[nextY]?.[nextX]?.obstacle === 'rock' ||
        farmGrid[nextY]?.[nextX]?.obstacle === 'branch';

      if (
        nextX >= 0 &&
        nextX < COLS &&
        nextY >= 0 &&
        nextY < ROWS &&
        !hitHouse &&
        !hitShop &&
        !hitShipping &&
        !hitTree &&
        !hitPond &&
        !hitObstacle
      ) {
        setPlayer((prev) => ({
          ...prev,
          x: nextX,
          y: nextY,
          dir: newDir,
        }));
      } else {
        // Just turn facing direction
        setPlayer((prev) => ({ ...prev, dir: newDir }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    farmGrid,
    isFishingOpen,
    isGuideOpen,
    isShopOpen,
    isSummaryOpen,
    player.dir,
    player.inventory.length,
    player.x,
    player.y,
  ]);

  // Handle direct click on canvas tile (walk & interact)
  const handleTileClick = (tileX: number, tileY: number) => {
    // If adjacent or facing tile, interact directly
    const dx = Math.abs(tileX - player.x);
    const dy = Math.abs(tileY - player.y);

    if (dx <= 1 && dy <= 1) {
      // Determine facing direction
      let dir: Direction = player.dir;
      if (tileY < player.y) dir = 'up';
      else if (tileY > player.y) dir = 'down';
      else if (tileX < player.x) dir = 'left';
      else if (tileX > player.x) dir = 'right';

      setPlayer((prev) => ({ ...prev, dir }));
      handleInteractWithTile(tileX, tileY);
    } else {
      // Step towards that tile
      let nextX = player.x;
      let nextY = player.y;
      let dir: Direction = player.dir;

      if (tileX > player.x) {
        nextX++;
        dir = 'right';
      } else if (tileX < player.x) {
        nextX--;
        dir = 'left';
      } else if (tileY > player.y) {
        nextY++;
        dir = 'down';
      } else if (tileY < player.y) {
        nextY--;
        dir = 'up';
      }

      setPlayer((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(COLS - 1, nextX)),
        y: Math.max(0, Math.min(ROWS - 1, nextY)),
        dir,
      }));
    }
  };

  // Mobile virtual movement
  const handleMobileMove = (dir: Direction) => {
    let nextX = player.x;
    let nextY = player.y;
    if (dir === 'up') nextY--;
    if (dir === 'down') nextY++;
    if (dir === 'left') nextX--;
    if (dir === 'right') nextX++;

    if (nextX >= 0 && nextX < COLS && nextY >= 0 && nextY < ROWS) {
      setPlayer((prev) => ({ ...prev, x: nextX, y: nextY, dir }));
    } else {
      setPlayer((prev) => ({ ...prev, dir }));
    }
  };

  const handleMobileInteract = () => {
    let targetX = player.x;
    let targetY = player.y;
    if (player.dir === 'up') targetY--;
    if (player.dir === 'down') targetY++;
    if (player.dir === 'left') targetX--;
    if (player.dir === 'right') targetX++;
    handleInteractWithTile(targetX, targetY);
  };

  // Shop Purchases
  const handleBuySeed = (cropId: string, price: number) => {
    if (player.gold < price) return;
    const cropDef = CROPS_DATA[cropId as CropId];
    if (!cropDef) return;

    sounds.play('coin');
    setPlayer((prev) => ({ ...prev, gold: prev.gold - price }));
    addItemToInventory({
      id: `seed:${cropId}`,
      type: 'seed',
      name: `${cropDef.name}種子`,
      icon: '🌱',
      cropId: cropId as CropId,
    });
  };

  const handleUpgradeBackpack = (cost: number) => {
    if (player.gold < cost) return;
    sounds.play('coin');
    setPlayer((prev) => ({ ...prev, gold: prev.gold - cost }));
    setMaxSlots((prev) => prev + 2);
  };

  const handleUpgradeTool = (tool: 'hoe' | 'watering_can', cost: number) => {
    if (player.gold < cost) return;
    sounds.play('coin');
    setPlayer((prev) => {
      const inv = prev.inventory.map((item) => {
        if (item.type === tool) {
          return {
            ...item,
            level: 2,
            name: tool === 'hoe' ? '鍛造銅鋤頭' : '鍛造銅水壺',
          };
        }
        return item;
      });
      return {
        ...prev,
        gold: prev.gold - cost,
        inventory: inv,
        maxWater: tool === 'watering_can' ? 35 : prev.maxWater,
        waterLevel: tool === 'watering_can' ? 35 : prev.waterLevel,
      };
    });
  };

  const handleSellShopItem = (itemIdx: number, count: number, price: number) => {
    sounds.play('coin');
    setPlayer((prev) => ({ ...prev, gold: prev.gold + price }));
    removeItemFromInventory(itemIdx, count);
  };

  // Fishing Catch
  const handleCatchFish = (fish: FishItem) => {
    addItemToInventory({
      id: `fish:${fish.name}`,
      type: 'item',
      name: fish.name,
      icon: fish.icon,
      sellPrice: fish.sellPrice,
      energyRestore: 25,
    });
  };

  // Restart / Reset game
  const handleResetGame = () => {
    if (window.confirm('確定要重新開始全新的星露谷農場嗎？所有進度將重置。')) {
      localStorage.removeItem(SAVE_KEY);
      setDay(1);
      setSeason('spring');
      setWeather('sunny');
      setTimeHour(6);
      setTimeMinute(0);
      setFarmGrid(createInitialFarmGrid());
      setMaxSlots(7);
      setPlayer({
        x: 4,
        y: 5,
        dir: 'down',
        energy: 100,
        maxEnergy: 100,
        gold: 100,
        waterLevel: 20,
        maxWater: 20,
        selectedSlotIndex: 0,
        inventory: DEFAULT_INVENTORY,
      });
      setShippingBin([]);
    }
  };

  const hoeLevel = player.inventory.find((i) => i.type === 'hoe')?.level || 1;
  const canLevel = player.inventory.find((i) => i.type === 'watering_can')?.level || 1;

  return (
    <div className="min-h-screen bg-[#1b120c] text-stone-100 flex flex-col items-center justify-between p-2 md:p-4 select-none">
      {/* Top Header & Brand */}
      <header className="w-full max-w-[800px] flex items-center justify-between pb-2 mb-1 border-b border-[#7d441f]/50">
        <div className="flex items-center gap-2">
          {/* Avatar with fallback */}
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-[#b45309] bg-[#faedcd] flex items-center justify-center">
            <img
              src={farmerImg}
              alt="Farmer"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-base select-none">🧑‍🌾</span>
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg text-[#f7d070] tracking-wide flex items-center gap-1.5 drop-shadow-xs">
              <span>🌾 迷你星露谷</span>
              <span className="text-xs font-normal text-[#faedcd]/70 hidden sm:inline">
                Stardew Valley Mini
              </span>
            </h1>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="px-2.5 py-1 bg-[#4a2810] hover:bg-[#6f3b14] text-[#faedcd] rounded-lg border border-[#854d0e] flex items-center gap-1 font-bold transition-transform active:scale-95"
          >
            <span>📖</span>
            <span className="hidden sm:inline">操作說明</span>
          </button>
          <button
            onClick={() => setIsShopOpen(true)}
            className="px-2.5 py-1 bg-[#854d0e] hover:bg-[#b45309] text-white rounded-lg border border-[#b45309] flex items-center gap-1 font-bold transition-transform active:scale-95"
          >
            <span>🏪</span>
            <span>雜貨店</span>
          </button>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="w-full max-w-[800px] flex flex-col items-center">
        {/* HUD: Weather, Calendar, Clock, Energy, Water, Gold */}
        <HUD
          day={day}
          season={season}
          weather={weather}
          timeHour={timeHour}
          timeMinute={timeMinute}
          energy={player.energy}
          maxEnergy={player.maxEnergy}
          gold={player.gold}
          waterLevel={player.waterLevel}
          maxWater={player.maxWater}
          soundEnabled={soundEnabled}
          bgmEnabled={bgmEnabled}
          onToggleSound={handleToggleSound}
          onToggleBGM={handleToggleBGM}
          onOpenGuide={() => setIsGuideOpen(true)}
          onResetGame={handleResetGame}
          onCycleSeason={() => {
            sounds.play('harvest');
            setSeason((prev) => (prev === 'spring' ? 'summer' : prev === 'summer' ? 'fall' : 'spring'));
          }}
        />

        {/* Pet Message Toast */}
        {petMessage && (
          <div className="w-full max-w-[800px] mb-2 bg-[#d4a373] text-[#3e2009] px-3 py-1.5 rounded-lg border-2 border-[#7d441f] shadow-md font-bold text-xs flex items-center justify-between animate-bounce">
            <span>{petMessage}</span>
            <button
              onClick={() => setPetMessage(null)}
              className="text-[#7d441f] hover:text-black font-pixel text-[10px] ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2D Canvas Farm Viewport */}
        <FarmCanvas
          player={player}
          farmGrid={farmGrid}
          season={season}
          weather={weather}
          timeHour={timeHour}
          timeMinute={timeMinute}
          hasApples={hasApples}
          pet={pet}
          onTileClick={handleTileClick}
          toolActionEffect={toolEffect}
        />

        {/* Stardew Style Hotbar Toolbar */}
        <Toolbar
          inventory={player.inventory}
          selectedIndex={player.selectedSlotIndex}
          onSelectSlot={(idx) => setPlayer((p) => ({ ...p, selectedSlotIndex: idx }))}
          onEatItem={handleEatItem}
        />

        {/* Mobile On-Screen Controls */}
        <MobileControls
          onMove={handleMobileMove}
          onInteract={handleMobileInteract}
          onRefillWater={handleRefillWater}
        />
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-[800px] mt-2 pt-2 border-t border-[#7d441f]/30 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#faedcd]/60 gap-1">
        <div>
          提示：走到右上方木屋按空白鍵或點擊木屋可<b>睡覺換日</b>（作物成長・體力全滿）。
        </div>
        <div className="flex items-center gap-2">
          <span>WASD / 方向鍵移動</span>
          <span>·</span>
          <span>空白鍵或滑鼠點擊互動</span>
        </div>
      </footer>

      {/* Modals */}
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        gold={player.gold}
        season={season}
        inventory={player.inventory}
        maxSlots={maxSlots}
        hoeLevel={hoeLevel}
        canLevel={canLevel}
        onBuySeed={handleBuySeed}
        onUpgradeBackpack={handleUpgradeBackpack}
        onUpgradeTool={handleUpgradeTool}
        onSellItem={handleSellShopItem}
      />

      <FishingModal
        isOpen={isFishingOpen}
        onClose={() => setIsFishingOpen(false)}
        onCatchFish={handleCatchFish}
      />

      <DaySummaryModal
        isOpen={isSummaryOpen}
        data={daySummaryData}
        nextWeather={nextWeather}
        onNextDay={handleStartNextDay}
      />

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
