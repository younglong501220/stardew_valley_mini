import React, { useState, useEffect, useRef } from 'react';
import { FISH_DATA } from '../data/crops';
import { FishItem } from '../types/game';
import { sounds } from '../audio/soundManager';
import { X } from 'lucide-react';

interface FishingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCatchFish: (fish: FishItem) => void;
}

export const FishingModal: React.FC<FishingModalProps> = ({
  isOpen,
  onClose,
  onCatchFish,
}) => {
  const [phase, setPhase] = useState<'waiting' | 'hooked' | 'game' | 'caught' | 'escaped'>('waiting');
  const [fishTarget, setFishTarget] = useState<FishItem>(FISH_DATA[0]);
  const [catchProgress, setCatchProgress] = useState(30); // 0 to 100
  const [barY, setBarY] = useState(150); // 0 (top) to 240 (bottom)
  const [fishY, setFishY] = useState(120);

  const isPressing = useRef(false);
  const barVel = useRef(0);
  const fishVel = useRef(0);
  const fishDestY = useRef(120);
  const progressRef = useRef(30);

  // BAR HEIGHT = 50px, TANK HEIGHT = 260px
  const BAR_HEIGHT = 50;
  const TANK_HEIGHT = 260;

  useEffect(() => {
    if (!isOpen) {
      setPhase('waiting');
      return;
    }

    // Pick random fish
    const randIndex = Math.floor(Math.random() * FISH_DATA.length);
    const chosenFish = FISH_DATA[randIndex];
    setFishTarget(chosenFish);

    // Initial cast sound
    sounds.play('splash');
    setPhase('waiting');

    // Fish bite alert after 1.2 to 2.5 seconds
    const biteTimer = setTimeout(() => {
      setPhase('hooked');
      sounds.play('bite');

      // Auto start mini-game after quick reaction
      setTimeout(() => {
        setPhase('game');
        progressRef.current = 35;
        setCatchProgress(35);
      }, 500);
    }, 1200 + Math.random() * 1500);

    return () => clearTimeout(biteTimer);
  }, [isOpen]);

  // Mini-game physics loop
  useEffect(() => {
    if (phase !== 'game') return;

    let animationFrameId: number;
    let fishMoveTimer = 0;

    const loop = () => {
      // 1. Bar physics (player control)
      if (isPressing.current) {
        barVel.current = Math.max(barVel.current - 0.7, -4.5);
      } else {
        barVel.current = Math.min(barVel.current + 0.45, 4.5);
      }

      setBarY((prev) => {
        let next = prev + barVel.current;
        if (next < 0) {
          next = 0;
          barVel.current = 0;
        }
        if (next > TANK_HEIGHT - BAR_HEIGHT) {
          next = TANK_HEIGHT - BAR_HEIGHT;
          barVel.current = 0;
        }
        return next;
      });

      // 2. Fish AI movement
      fishMoveTimer++;
      if (fishMoveTimer % 45 === 0) {
        fishDestY.current = Math.random() * (TANK_HEIGHT - 20);
      }
      setFishY((prev) => {
        const diff = fishDestY.current - prev;
        const speed = 0.05 * fishTarget.difficulty;
        return prev + diff * speed;
      });

      // 3. Catch progress check
      setBarY((currentBarY) => {
        setFishY((currentFishY) => {
          const isInside =
            currentFishY >= currentBarY - 10 &&
            currentFishY <= currentBarY + BAR_HEIGHT + 5;

          if (isInside) {
            progressRef.current = Math.min(100, progressRef.current + 0.4);
          } else {
            progressRef.current = Math.max(0, progressRef.current - 0.25);
          }
          setCatchProgress(progressRef.current);

          if (progressRef.current >= 100) {
            sounds.play('harvest');
            setPhase('caught');
            onCatchFish(fishTarget);
          } else if (progressRef.current <= 0) {
            sounds.play('chop');
            setPhase('escaped');
          }

          return currentFishY;
        });
        return currentBarY;
      });

      if (progressRef.current > 0 && progressRef.current < 100) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [phase, fishTarget, onCatchFish]);

  // Handle pointer / keypress for reel
  const handlePointerDown = () => {
    isPressing.current = true;
  };

  const handlePointerUp = () => {
    isPressing.current = false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        isPressing.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        isPressing.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none">
      <div className="stardew-wood-box w-full max-w-sm rounded-2xl overflow-hidden border-4 border-[#7d441f] p-4 flex flex-col items-center">
        {/* Title */}
        <div className="w-full flex items-center justify-between pb-2 mb-2 border-b-2 border-[#7d441f]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎣</span>
            <span className="font-bold text-[#4a2810] text-base">水塘垂釣</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#7d441f] hover:text-black p-1 rounded-full bg-[#faedcd]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase Display */}
        {phase === 'waiting' && (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="text-4xl animate-bounce">🎣</div>
            <p className="font-bold text-[#7d441f] text-sm">正在靜靜等候魚兒上鉤...</p>
            <p className="text-xs text-stone-500">（請隨時準備好按住滑鼠或空白鍵！）</p>
          </div>
        )}

        {phase === 'hooked' && (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="text-5xl font-pixel text-rose-600 animate-ping">HIT !</div>
            <p className="font-bold text-red-700 text-base">有動靜了！大魚咬餌！</p>
          </div>
        )}

        {phase === 'game' && (
          <div className="w-full flex flex-col items-center">
            <p className="text-xs text-[#6f3b14] mb-2 font-bold">
              長按滑鼠或空白鍵上升綠框，將魚保持在框內！
            </p>

            <div className="flex items-center gap-4">
              {/* Fish Water Tank */}
              <div
                onMouseDown={handlePointerDown}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchEnd={handlePointerUp}
                className="relative w-16 bg-[#1d3557] rounded-lg border-3 border-[#457b9d] overflow-hidden cursor-pointer"
                style={{ height: `${TANK_HEIGHT}px` }}
              >
                {/* Water bubbles animation effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#457b9d]/30 to-[#1d3557]" />

                {/* Player Green Fishing Bar */}
                <div
                  className="absolute left-1 right-1 bg-emerald-500/80 border-2 border-emerald-300 rounded shadow-md transition-all duration-75"
                  style={{
                    top: `${barY}px`,
                    height: `${BAR_HEIGHT}px`,
                  }}
                />

                {/* Fish icon */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-2xl transition-all duration-100"
                  style={{
                    top: `${fishY}px`,
                  }}
                >
                  🐟
                </div>
              </div>

              {/* Catch Progress Bar */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-pixel text-[#7d441f] mb-1 font-bold">
                  進度
                </span>
                <div
                  className="w-5 bg-[#3e2723] rounded-full border-2 border-[#7d441f] p-0.5 overflow-hidden flex flex-col justify-end"
                  style={{ height: `${TANK_HEIGHT}px` }}
                >
                  <div
                    className={`w-full rounded-full transition-all duration-100 ${
                      catchProgress > 70
                        ? 'bg-emerald-500'
                        : catchProgress > 30
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ height: `${catchProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Hold Button for Touch / Click */}
            <button
              onMouseDown={handlePointerDown}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchEnd={handlePointerUp}
              className="mt-3 w-full py-2.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold rounded-xl font-pixel text-xs shadow-md border-2 border-emerald-800"
            >
              長按控制捲線 🎣
            </button>
          </div>
        )}

        {phase === 'caught' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="text-5xl animate-bounce">{fishTarget.icon}</div>
            <div className="text-center">
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                {fishTarget.rarity === 'legendary'
                  ? '🌟 傳奇稀有'
                  : fishTarget.rarity === 'rare'
                  ? '⭐ 珍貴漁獲'
                  : '一般水產'}
              </span>
              <h3 className="font-bold text-lg text-[#4a2810] mt-1">
                成功釣到 {fishTarget.name}！
              </h3>
              <p className="text-xs text-emerald-700 font-bold mt-1">
                價值: {fishTarget.sellPrice} G
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 bg-[#854d0e] hover:bg-[#b45309] text-white font-bold font-pixel text-xs rounded-xl shadow-md"
            >
              收入背包
            </button>
          </div>
        )}

        {phase === 'escaped' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="text-4xl">💨</div>
            <h3 className="font-bold text-base text-rose-700">魚兒掙脫溜走了...</h3>
            <p className="text-xs text-stone-600">下一次請把綠框穩穩罩在魚兒身上！</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 bg-stone-600 hover:bg-stone-700 text-white font-bold font-pixel text-xs rounded-xl"
            >
              關閉
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
