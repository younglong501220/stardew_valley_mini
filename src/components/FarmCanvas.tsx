import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Direction, FarmTile, PlayerState, Season, Weather, PetState } from '../types/game';
import { CROPS_DATA, FORAGE_DATA } from '../data/crops';

export const TILE_SIZE = 40;
export const COLS = 16;
export const ROWS = 12;

export const HOUSE_RECT = { x: 12, y: 1, w: 3, h: 3 };
export const SHOP_BIN_POS = { x: 9, y: 1, w: 2, h: 2 }; // Pierre's Shop
export const SHIPPING_BIN_POS = { x: 11, y: 3 }; // Shipping Box
export const POND_RECT = { x: 1, y: 8, w: 4, h: 3 }; // Fishing Pond
export const APPLE_TREE_POS = { x: 2, y: 2 }; // Fruit Tree

interface FarmCanvasProps {
  player: PlayerState;
  farmGrid: FarmTile[][];
  season: Season;
  weather: Weather;
  timeHour: number;
  timeMinute: number;
  hasApples: boolean;
  pet: PetState;
  onTileClick: (x: number, y: number) => void;
  toolActionEffect?: { x: number; y: number; type: string } | null;
}

export const FarmCanvas: React.FC<FarmCanvasProps> = ({
  player,
  farmGrid,
  season,
  weather,
  timeHour,
  hasApples,
  pet,
  onTileClick,
  toolActionEffect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const frameCount = useRef(0);
  const rainDrops = useRef<{ x: number; y: number; speed: number; len: number }[]>([]);
  const seasonalParticles = useRef<
    { x: number; y: number; speedX: number; speedY: number; size: number; rot: number; color: string }[]
  >([]);

  // Initialize weather & seasonal particles
  useEffect(() => {
    rainDrops.current = Array.from({ length: 65 }, () => ({
      x: Math.random() * (COLS * TILE_SIZE),
      y: Math.random() * (ROWS * TILE_SIZE),
      speed: 6 + Math.random() * 5,
      len: 8 + Math.random() * 7,
    }));

    // Seasonal drifting particles (Spring cherry petals / Fall autumn leaves)
    const particleColors =
      season === 'spring'
        ? ['#ffb5a7', '#fcd5ce', '#f8edeb']
        : season === 'fall'
        ? ['#e85d04', '#dc2f02', '#f48c06', '#9d0208']
        : ['#ffe49e', '#ffd166'];

    seasonalParticles.current = Array.from({ length: 22 }, () => ({
      x: Math.random() * (COLS * TILE_SIZE),
      y: Math.random() * (ROWS * TILE_SIZE),
      speedX: -0.8 + Math.random() * 0.4,
      speedY: 0.6 + Math.random() * 0.9,
      size: 3 + Math.random() * 3,
      rot: Math.random() * Math.PI,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
    }));
  }, [season]);

  // Main rendering engine
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCount.current++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Ground Base & Grid with Rich Seasonal Palettes
    // Seasonal Visual Filter for Trees and Objects
    let seasonalFilter = 'none';
    if (season === 'spring') {
      seasonalFilter = 'saturate(1.15) brightness(1.04)';
    } else if (season === 'summer') {
      seasonalFilter = 'saturate(1.2) contrast(1.08)';
    } else if (season === 'fall') {
      seasonalFilter = 'sepia(0.24) saturate(1.35) hue-rotate(-12deg)';
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const tile = farmGrid[r]?.[c];
        if (!tile) continue;

        // In Pond territory
        const inPond =
          c >= POND_RECT.x &&
          c < POND_RECT.x + POND_RECT.w &&
          r >= POND_RECT.y &&
          r < POND_RECT.y + POND_RECT.h;

        if (inPond) {
          // Pond Water
          ctx.fillStyle = season === 'fall' ? '#1b4d6b' : '#1e6091';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // Water ripples
          ctx.fillStyle = '#34a0a4';
          const waveShift = Math.sin((frameCount.current + c * 10) * 0.08) * 3;
          ctx.fillRect(x + 4, y + 10 + waveShift, TILE_SIZE - 8, 3);
          ctx.fillStyle = '#168aad';
          ctx.fillRect(x + 8, y + 24 - waveShift, TILE_SIZE - 16, 2);

          // Cattail or water lily pad
          if (c === POND_RECT.x && r === POND_RECT.y) {
            ctx.fillStyle = season === 'fall' ? '#7b6d39' : '#2d6a4f';
            ctx.beginPath();
            ctx.arc(x + 15, y + 15, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = season === 'spring' ? '#ff99c8' : '#ffd166';
            ctx.fillRect(x + 13, y + 13, 4, 4);
          }
          continue;
        }

        // Base Grass Tile with Dynamic Seasonal Hue:
        // 春天：翠綠 (Lush Vibrant Spring Emerald)
        // 夏天：深綠 (Deep Rich Forest Green)
        // 秋天：金黃橘紅 (Warm Golden Amber & Orange-Red Autumn field)
        let grassBase = (r + c) % 2 === 0 ? '#48bb78' : '#38a169'; // 春天: 翠綠
        if (season === 'summer') {
          grassBase = (r + c) % 2 === 0 ? '#22543d' : '#1c4532'; // 夏天: 深綠
        } else if (season === 'fall') {
          grassBase = (r + c) % 2 === 0 ? '#d97706' : '#b45309'; // 秋天: 金黃橘紅
        }
        ctx.fillStyle = grassBase;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        // Seasonal Details on Grass
        if (season === 'spring') {
          // Spring: Wildflowers & cherry blossom petals
          if ((r * 7 + c * 13) % 11 === 0) {
            ctx.fillStyle = '#ffccd5';
            ctx.fillRect(x + 12, y + 14, 3, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 14, y + 16, 2, 2);
          } else if ((r * 11 + c * 5) % 17 === 0) {
            ctx.fillStyle = '#3a5a1f';
            ctx.fillRect(x + 24, y + 20, 2, 4);
          }
        } else if (season === 'summer') {
          // Summer: Tiny sun daisies & lush blade tufts
          if ((r * 7 + c * 13) % 11 === 0) {
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(x + 14, y + 14, 3, 3);
          } else if ((r * 11 + c * 5) % 17 === 0) {
            ctx.fillStyle = '#325816';
            ctx.fillRect(x + 20, y + 18, 3, 4);
          }
        } else if (season === 'fall') {
          // Fall: Golden fallen maple leaves & crunchy brown dry twigs
          if ((r * 7 + c * 13) % 9 === 0) {
            ctx.fillStyle = '#d9480f'; // maple red
            ctx.fillRect(x + 12, y + 14, 4, 3);
            ctx.fillStyle = '#f59f00'; // maple gold
            ctx.fillRect(x + 15, y + 16, 2, 2);
          } else if ((r * 11 + c * 5) % 13 === 0) {
            ctx.fillStyle = '#785616';
            ctx.fillRect(x + 22, y + 20, 4, 2);
          }
        }

        // Tilled Soil (Warm earth tone adjusted by season)
        if (tile.tilled) {
          const tilledDry = season === 'fall' ? '#8c501e' : '#854d0e';
          const tilledWet = season === 'fall' ? '#47250e' : '#442813';
          ctx.fillStyle = tile.watered ? tilledWet : tilledDry;
          ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);

          // Soil clod texture
          ctx.fillStyle = tile.watered ? '#301b0c' : '#6f3b14';
          ctx.fillRect(x + 5, y + 6, TILE_SIZE - 10, 2);
          ctx.fillRect(x + 5, y + 18, TILE_SIZE - 10, 2);
          ctx.fillRect(x + 5, y + 30, TILE_SIZE - 10, 2);

          // Moist wet sheen when watered
          if (tile.watered) {
            ctx.fillStyle = 'rgba(100, 180, 255, 0.28)';
            ctx.fillRect(x + 6, y + 8, 6, 4);
          }
        }

        // Crops Rendering
        if (tile.crop) {
          const cropDef = CROPS_DATA[tile.crop.id];
          const stage = tile.crop.stage;
          const isReady = tile.crop.isReady;

          if (stage === 0) {
            // Seed stage
            ctx.fillStyle = '#faedcd';
            ctx.beginPath();
            ctx.arc(x + 18, y + 22, 3, 0, Math.PI * 2);
            ctx.arc(x + 24, y + 20, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (!isReady) {
            // Sprout / Growing stage
            const sproutSize = Math.min(14, 5 + stage * 3);
            ctx.fillStyle = cropDef ? cropDef.stemColor : '#5fa738';

            // Stem
            ctx.fillRect(x + 18, y + 28 - sproutSize, 4, sproutSize);
            // Leaves
            ctx.fillStyle = '#70e000';
            ctx.beginPath();
            ctx.ellipse(x + 14, y + 28 - sproutSize, 6, 4, -0.4, 0, Math.PI * 2);
            ctx.ellipse(x + 26, y + 28 - sproutSize, 6, 4, 0.4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // MATURE CROP!
            ctx.fillStyle = cropDef.stemColor;
            ctx.fillRect(x + 18, y + 22, 4, 10);
            ctx.beginPath();
            ctx.ellipse(x + 12, y + 24, 7, 3, -0.3, 0, Math.PI * 2);
            ctx.ellipse(x + 28, y + 24, 7, 3, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Fruit Body
            ctx.fillStyle = cropDef.color;
            if (cropDef.fruitShape === 'round' || cropDef.fruitShape === 'head') {
              ctx.beginPath();
              ctx.arc(x + 20, y + 17, 10, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#2b170c';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Special Pumpkin ribs
              if (cropDef.id === 'pumpkin') {
                ctx.strokeStyle = '#d97706';
                ctx.beginPath();
                ctx.arc(x + 20, y + 17, 6, 0, Math.PI * 2);
                ctx.stroke();
              }
            } else if (cropDef.fruitShape === 'cluster') {
              // Berries cluster
              ctx.beginPath();
              ctx.arc(x + 16, y + 16, 5, 0, Math.PI * 2);
              ctx.arc(x + 24, y + 15, 5, 0, Math.PI * 2);
              ctx.arc(x + 20, y + 21, 6, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Pointed (Parsnip, Strawberry, Corn)
              ctx.beginPath();
              ctx.moveTo(x + 13, y + 12);
              ctx.lineTo(x + 27, y + 12);
              ctx.lineTo(x + 20, y + 26);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#2b170c';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            // Mature Sparkle Star
            const sparklePulse = Math.sin(frameCount.current * 0.15);
            if (sparklePulse > 0) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(x + 16, y + 10, 3, 3);
            }
          }
        }

        // Obstacles (Weed, Rock, Branch)
        if (tile.obstacle === 'weed') {
          ctx.fillStyle = season === 'fall' ? '#b5832a' : '#38b000';
          ctx.beginPath();
          ctx.arc(x + 16, y + 24, 7, 0, Math.PI * 2);
          ctx.arc(x + 24, y + 22, 6, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile.obstacle === 'rock') {
          ctx.fillStyle = '#6c757d';
          ctx.beginPath();
          ctx.ellipse(x + 20, y + 24, 9, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#adb5bd';
          ctx.fillRect(x + 16, y + 20, 5, 3);
        } else if (tile.obstacle === 'branch') {
          ctx.fillStyle = '#583101';
          ctx.fillRect(x + 12, y + 22, 16, 5);
          ctx.fillRect(x + 20, y + 18, 4, 8);
        }

        // Foragables (Daffodil, Mushroom, Berry, etc.)
        if (tile.forage) {
          const cfg = FORAGE_DATA[tile.forage];
          if (cfg) {
            ctx.fillStyle = cfg.color;
            ctx.beginPath();
            ctx.arc(x + 20, y + 20, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 18, y + 16, 3, 3);
          }
        }
      }
    }

    // 2. Draw Trees with Seasonal Foliage Palette and Object Filter
    ctx.save();
    ctx.filter = seasonalFilter;

    // A. Apple Orchard Tree
    {
      const tx = APPLE_TREE_POS.x * TILE_SIZE;
      const ty = APPLE_TREE_POS.y * TILE_SIZE;
      // Trunk
      ctx.fillStyle = '#583101';
      ctx.fillRect(tx + 14, ty + 20, 12, 24);

      // Seasonal Foliage Colors
      let foliageMain = '#2d6a4f';
      let foliageHighlight = '#40916c';
      if (season === 'spring') {
        foliageMain = '#38b000';
        foliageHighlight = '#70e000';
      } else if (season === 'summer') {
        foliageMain = '#1b4332';
        foliageHighlight = '#2d6a4f';
      } else if (season === 'fall') {
        foliageMain = '#c2410c'; // Fiery burnt orange
        foliageHighlight = '#f97316'; // Vivid orange
      }

      ctx.fillStyle = foliageMain;
      ctx.beginPath();
      ctx.arc(tx + 20, ty + 10, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = foliageHighlight;
      ctx.beginPath();
      ctx.arc(tx + 16, ty + 5, 17, 0, Math.PI * 2);
      ctx.fill();

      // Spring Cherry / Apple Blossoms
      if (season === 'spring') {
        ctx.fillStyle = '#ffccd5';
        ctx.fillRect(tx + 10, ty + 4, 4, 4);
        ctx.fillRect(tx + 24, ty + 12, 4, 4);
        ctx.fillRect(tx + 18, ty - 4, 4, 4);
      }

      // Apples
      if (hasApples) {
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.arc(tx + 11, ty + 8, 4.5, 0, Math.PI * 2);
        ctx.arc(tx + 27, ty + 13, 4.5, 0, Math.PI * 2);
        ctx.arc(tx + 18, ty + 2, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(tx + 10, ty + 7, 2, 2);
      }
    }

    // B. Decorative Corner Pine Tree (Top-Left x:0, y:0)
    {
      const px = 0;
      const py = 0;
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(px + 16, py + 26, 8, 14);

      let pineColor1 = '#134e4a';
      let pineColor2 = '#0f766e';
      if (season === 'spring') {
        pineColor1 = '#15803d';
        pineColor2 = '#22c55e';
      } else if (season === 'fall') {
        pineColor1 = '#9a3412'; // Rust-orange autumn pine
        pineColor2 = '#ea580c';
      }

      ctx.fillStyle = pineColor1;
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 28);
      ctx.lineTo(px + 20, py + 8);
      ctx.lineTo(px + 36, py + 28);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = pineColor2;
      ctx.beginPath();
      ctx.moveTo(px + 8, py + 16);
      ctx.lineTo(px + 20, py + 2);
      ctx.lineTo(px + 32, py + 16);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Draw Farmhouse (木屋)
    {
      const hx = HOUSE_RECT.x * TILE_SIZE;
      const hy = HOUSE_RECT.y * TILE_SIZE;
      const hw = HOUSE_RECT.w * TILE_SIZE;
      const hh = HOUSE_RECT.h * TILE_SIZE;

      // Wooden Walls
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(hx, hy + 20, hw, hh - 20);
      // Planks texture
      ctx.fillStyle = '#6f3b14';
      ctx.fillRect(hx, hy + 45, hw, 2);
      ctx.fillRect(hx, hy + 70, hw, 2);

      // Red Stardew Valley Gable Roof
      ctx.fillStyle = season === 'fall' ? '#9f1239' : '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(hx - 12, hy + 25);
      ctx.lineTo(hx + hw / 2, hy - 18);
      ctx.lineTo(hx + hw + 12, hy + 25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Chimney & Animated Smoke Puffs
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(hx + hw - 24, hy - 25, 14, 25);
      const smokeOffset = (frameCount.current * 0.05) % 3;
      ctx.fillStyle = 'rgba(230, 230, 230, 0.6)';
      ctx.beginPath();
      ctx.arc(hx + hw - 17, hy - 32 - smokeOffset * 8, 5 + smokeOffset * 2, 0, Math.PI * 2);
      ctx.fill();

      // Front Door
      ctx.fillStyle = '#4a2810';
      ctx.fillRect(hx + hw / 2 - 14, hy + hh - 42, 28, 42);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(hx + hw / 2 + 6, hy + hh - 22, 4, 4);

      // Window with warm lantern light
      const isNight = timeHour >= 19 || timeHour < 6;
      ctx.fillStyle = isNight ? '#ffb703' : '#a8dadc';
      ctx.fillRect(hx + 12, hy + 38, 20, 20);
      ctx.strokeStyle = '#3e2723';
      ctx.strokeRect(hx + 12, hy + 38, 20, 20);

      // House Sign
      ctx.fillStyle = '#faedcd';
      ctx.fillRect(hx + 8, hy + hh - 12, 30, 10);
      ctx.fillStyle = '#3e2723';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('🛌 休息', hx + 10, hy + hh - 4);
    }

    // 4. Draw Pierre's Shop Kiosk
    {
      const sx = SHOP_BIN_POS.x * TILE_SIZE;
      const sy = SHOP_BIN_POS.y * TILE_SIZE;

      ctx.fillStyle = '#7d441f';
      ctx.fillRect(sx, sy + 15, SHOP_BIN_POS.w * TILE_SIZE, SHOP_BIN_POS.h * TILE_SIZE - 15);

      // Striped Awning (Red & White)
      const awningW = (SHOP_BIN_POS.w * TILE_SIZE) / 4;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ef233c' : '#fefae0';
        ctx.fillRect(sx + i * awningW, sy, awningW, 16);
      }

      ctx.fillStyle = '#faedcd';
      ctx.fillRect(sx + 4, sy + 25, SHOP_BIN_POS.w * TILE_SIZE - 8, 14);
      ctx.fillStyle = '#3e2009';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('🏪 雜貨店', sx + 14, sy + 36);
    }

    // 5. Draw Shipping Bin (出貨箱)
    {
      const bx = SHIPPING_BIN_POS.x * TILE_SIZE;
      const by = SHIPPING_BIN_POS.y * TILE_SIZE;

      ctx.fillStyle = '#4a2810';
      ctx.fillRect(bx + 2, by + 8, TILE_SIZE - 4, TILE_SIZE - 12);
      ctx.strokeStyle = '#271305';
      ctx.lineWidth = 2;
      ctx.strokeRect(bx + 2, by + 8, TILE_SIZE - 4, TILE_SIZE - 12);

      ctx.fillStyle = '#d4af37';
      ctx.fillRect(bx + 4, by + 6, TILE_SIZE - 8, 6);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(bx + 16, by + 14, 8, 6);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('📦出貨', bx + 4, by + 36);
    }

    // 6. Draw Pond Boundary / Pier Wood Edge
    {
      const px = POND_RECT.x * TILE_SIZE;
      const py = POND_RECT.y * TILE_SIZE;
      const pw = POND_RECT.w * TILE_SIZE;
      const ph = POND_RECT.h * TILE_SIZE;

      ctx.strokeStyle = '#3d2613';
      ctx.lineWidth = 3;
      ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);

      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(px + pw - 6, py + 10, 14, 24);
      ctx.fillStyle = '#fefae0';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('🎣水塘', px + 6, py + ph - 8);
    }

    // Restore seasonal filter before drawing characters
    ctx.restore();

    // 7. Draw Pet (Adorable Wandering Ginger Cat)
    {
      const petPixelX = pet.x * TILE_SIZE;
      const petPixelY = pet.y * TILE_SIZE;
      const isSleeping = pet.isSleeping;
      const isHopping = pet.heartTimer > 0;
      const hopOffset = isHopping ? Math.abs(Math.sin(frameCount.current * 0.35)) * 6 : 0;

      const px = petPixelX;
      const py = petPixelY - hopOffset;

      if (isSleeping) {
        // Sleeping Curled Cat Ball
        ctx.fillStyle = '#f77f00'; // Ginger fur
        ctx.beginPath();
        ctx.ellipse(px + 20, py + 26, 12, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // White belly patch
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.arc(px + 20, py + 26, 5, 0, Math.PI * 2);
        ctx.fill();

        // Cute Sleeping closed eyes (^ ^)
        ctx.fillStyle = '#4a2810';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('^ ^', px + 15, py + 24);

        // Curled Tail
        ctx.fillStyle = '#f77f00';
        ctx.beginPath();
        ctx.arc(px + 9, py + 26, 4, 0, Math.PI * 2);
        ctx.fill();

        // Floating Zzz letters
        const zOffset = (frameCount.current * 0.05) % 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('z', px + 25 + zOffset * 3, py + 16 - zOffset * 8);
        ctx.font = 'bold 12px monospace';
        ctx.fillText('Z', px + 28 + zOffset * 4, py + 9 - zOffset * 8);
      } else {
        // Awake Active Cat
        // Body (Ginger)
        ctx.fillStyle = '#f77f00';
        ctx.fillRect(px + 12, py + 18, 16, 12);

        // White chest patch
        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(px + 14, py + 22, 6, 6);

        // White paws
        ctx.fillStyle = '#ffffff';
        const pawWiggle = (frameCount.current % 10 < 5) ? 1 : 0;
        ctx.fillRect(px + 12 + pawWiggle, py + 28, 5, 4);
        ctx.fillRect(px + 21 - pawWiggle, py + 28, 5, 4);

        // Head
        ctx.fillStyle = '#f77f00';
        ctx.fillRect(px + 10, py + 10, 15, 11);

        // Ears with pink inner
        ctx.fillStyle = '#d9480f';
        ctx.beginPath();
        ctx.moveTo(px + 10, py + 10);
        ctx.lineTo(px + 13, py + 4);
        ctx.lineTo(px + 16, py + 10);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px + 19, py + 10);
        ctx.lineTo(px + 22, py + 4);
        ctx.lineTo(px + 25, py + 10);
        ctx.closePath();
        ctx.fill();

        // Whiskers
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 7, py + 17);
        ctx.lineTo(px + 11, py + 17);
        ctx.moveTo(px + 24, py + 17);
        ctx.lineTo(px + 28, py + 17);
        ctx.stroke();

        // Eyes based on facing direction
        ctx.fillStyle = '#2ec4b6'; // Cute emerald green eyes
        if (pet.dir === 'left') {
          ctx.fillRect(px + 11, py + 14, 3, 3);
        } else if (pet.dir === 'right') {
          ctx.fillRect(px + 21, py + 14, 3, 3);
        } else {
          ctx.fillRect(px + 13, py + 14, 3, 3);
          ctx.fillRect(px + 19, py + 14, 3, 3);
        }

        // Swishing animated tail
        const tailAngle = Math.sin(frameCount.current * 0.15) * 6;
        ctx.strokeStyle = '#f77f00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px + 27, py + 24);
        ctx.quadraticCurveTo(px + 32, py + 18 + tailAngle, px + 33, py + 12 + tailAngle);
        ctx.stroke();
      }

      // Heart Bubble Animation when petted!
      if (pet.heartTimer > 0) {
        const floatUp = (40 - pet.heartTimer) * 0.6;
        const heartPulse = 1 + Math.sin(frameCount.current * 0.3) * 0.2;

        ctx.save();
        ctx.translate(px + 18, py - 5 - floatUp);
        ctx.scale(heartPulse, heartPulse);

        // Heart Emoji / Glyphs
        ctx.font = '16px sans-serif';
        ctx.fillText('❤️', -8, 0);

        // Mini yellow sparkles
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-12, -10, 3, 3);
        ctx.fillRect(8, -8, 3, 3);
        ctx.restore();
      }

      // Tiny Name Tag on hover
      if (hoveredTile && hoveredTile.x === Math.round(pet.x) && hoveredTile.y === Math.round(pet.y)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(px + 4, py - 12, 32, 11);
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('🐱 ' + pet.name, px + 6, py - 3);
      }
    }

    // 8. Interactive Aiming Cursor
    let aimX = player.x;
    let aimY = player.y;
    if (player.dir === 'up') aimY--;
    if (player.dir === 'down') aimY++;
    if (player.dir === 'left') aimX--;
    if (player.dir === 'right') aimX++;

    if (aimX >= 0 && aimX < COLS && aimY >= 0 && aimY < ROWS) {
      const pulse = 0.5 + Math.sin(frameCount.current * 0.15) * 0.3;
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(aimX * TILE_SIZE + 2, aimY * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }

    // Mouse Hover cursor
    if (hoveredTile) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        hoveredTile.x * TILE_SIZE + 1,
        hoveredTile.y * TILE_SIZE + 1,
        TILE_SIZE - 2,
        TILE_SIZE - 2
      );
    }

    // 9. Tool Action Effects
    if (toolActionEffect) {
      const effX = toolActionEffect.x * TILE_SIZE + 20;
      const effY = toolActionEffect.y * TILE_SIZE + 20;

      if (toolActionEffect.type === 'water') {
        ctx.fillStyle = '#00b4d8';
        for (let i = 0; i < 5; i++) {
          const offX = (Math.random() - 0.5) * 24;
          const offY = (Math.random() - 0.5) * 24;
          ctx.beginPath();
          ctx.arc(effX + offX, effY + offY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (toolActionEffect.type === 'till') {
        ctx.fillStyle = '#6f3b14';
        for (let i = 0; i < 4; i++) {
          const offX = (Math.random() - 0.5) * 20;
          const offY = (Math.random() - 0.5) * 20;
          ctx.fillRect(effX + offX, effY + offY, 3, 3);
        }
      }
    }

    // 10. Draw Farmer Character
    {
      const px = player.x * TILE_SIZE;
      const py = player.y * TILE_SIZE;

      // Feet / Boots
      const legOffset = (frameCount.current % 12 < 6) ? 1 : -1;
      ctx.fillStyle = '#3a200e';
      ctx.fillRect(px + 10 + legOffset, py + 32, 7, 6);
      ctx.fillRect(px + 23 - legOffset, py + 32, 7, 6);

      // Overalls (Denim Blue)
      ctx.fillStyle = '#1d3557';
      ctx.fillRect(px + 10, py + 18, 20, 15);
      ctx.fillStyle = '#457b9d';
      ctx.fillRect(px + 12, py + 16, 4, 10);
      ctx.fillRect(px + 24, py + 16, 4, 10);

      // Shirt (Red Flannel)
      ctx.fillStyle = '#e63946';
      ctx.fillRect(px + 12, py + 12, 16, 7);

      // Face
      ctx.fillStyle = '#ffe0b2';
      ctx.fillRect(px + 12, py + 6, 16, 9);

      // Farmer Straw Hat
      ctx.fillStyle = '#f4a261';
      ctx.fillRect(px + 4, py + 2, 32, 5);
      ctx.fillRect(px + 10, py - 4, 20, 6);
      ctx.fillStyle = '#e76f51';
      ctx.fillRect(px + 10, py + 1, 20, 2);

      // Eyes according to direction
      ctx.fillStyle = '#000';
      if (player.dir === 'down') {
        ctx.fillRect(px + 15, py + 10, 3, 3);
        ctx.fillRect(px + 22, py + 10, 3, 3);
      } else if (player.dir === 'left') {
        ctx.fillRect(px + 13, py + 10, 3, 3);
      } else if (player.dir === 'right') {
        ctx.fillRect(px + 24, py + 10, 3, 3);
      }
    }

    // 11. Seasonal Floating Atmosphere Particles (Spring cherry petals / Fall maple leaves)
    seasonalParticles.current.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.6, p.rot, 0, Math.PI * 2);
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;
      p.rot += 0.02;

      if (p.y > ROWS * TILE_SIZE) {
        p.y = -10;
        p.x = Math.random() * (COLS * TILE_SIZE + 40);
      }
      if (p.x < -10) {
        p.x = COLS * TILE_SIZE + 10;
      }
    });

    // 12. Ambient Day / Night / Sunset Lighting Overlay
    let ambientColor: string | null = null;
    if (timeHour >= 6 && timeHour < 8) {
      ambientColor = 'rgba(255, 183, 3, 0.12)';
    } else if (timeHour >= 17 && timeHour < 20) {
      ambientColor = 'rgba(230, 81, 0, 0.22)';
    } else if (timeHour >= 20 || timeHour < 5) {
      ambientColor = 'rgba(15, 23, 42, 0.48)';
    }

    if (ambientColor) {
      ctx.fillStyle = ambientColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Seasonal Ambient Color Grading Scrim
    let seasonalWash: string | null = null;
    if (season === 'spring') {
      seasonalWash = 'rgba(255, 192, 203, 0.05)'; // Soft springtime blossom glow
    } else if (season === 'summer') {
      seasonalWash = 'rgba(254, 240, 138, 0.06)'; // High summer golden sun warmth
    } else if (season === 'fall') {
      seasonalWash = 'rgba(234, 88, 12, 0.12)'; // Cozy golden-hour autumn warmth
    }
    if (seasonalWash) {
      ctx.fillStyle = seasonalWash;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 13. Rain Weather Effect
    if (weather === 'rainy') {
      ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
      ctx.lineWidth = 1.5;
      rainDrops.current.forEach((drop) => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - 2, drop.y + drop.len);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x -= 1;
        if (drop.y > ROWS * TILE_SIZE) {
          drop.y = -10;
          drop.x = Math.random() * (COLS * TILE_SIZE + 50);
        }
      });
    }
  }, [
    farmGrid,
    hasApples,
    hoveredTile,
    pet,
    player,
    season,
    timeHour,
    toolActionEffect,
    weather,
  ]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const clickY = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

    if (clickX >= 0 && clickX < COLS && clickY >= 0 && clickY < ROWS) {
      onTileClick(clickX, clickY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const tileX = Math.floor(((e.clientX - rect.left) * scaleX) / TILE_SIZE);
    const tileY = Math.floor(((e.clientY - rect.top) * scaleY) / TILE_SIZE);

    if (tileX >= 0 && tileX < COLS && tileY >= 0 && tileY < ROWS) {
      setHoveredTile({ x: tileX, y: tileY });
    } else {
      setHoveredTile(null);
    }
  };

  return (
    <div className="relative border-4 border-[#6f3b14] rounded-2xl overflow-hidden shadow-2xl bg-[#5c8b39] flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={COLS * TILE_SIZE}
        height={ROWS * TILE_SIZE}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredTile(null)}
        className="block cursor-pointer select-none max-w-full h-auto"
        style={{
          imageRendering: 'pixelated',
          aspectRatio: `${COLS * TILE_SIZE} / ${ROWS * TILE_SIZE}`,
        }}
      />
    </div>
  );
};
