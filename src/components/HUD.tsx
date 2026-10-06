import React from 'react';
import { Season, Weather } from '../types/game';
import { SEASON_NAMES } from '../data/crops';
import {
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface HUDProps {
  day: number;
  season: Season;
  weather: Weather;
  timeHour: number;
  timeMinute: number;
  energy: number;
  maxEnergy: number;
  gold: number;
  waterLevel: number;
  maxWater: number;
  soundEnabled: boolean;
  bgmEnabled: boolean;
  onToggleSound: () => void;
  onToggleBGM: () => void;
  onOpenGuide: () => void;
  onResetGame: () => void;
  onCycleSeason?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  day,
  season,
  weather,
  timeHour,
  timeMinute,
  energy,
  maxEnergy,
  gold,
  waterLevel,
  maxWater,
  soundEnabled,
  bgmEnabled,
  onToggleSound,
  onToggleBGM,
  onOpenGuide,
  onResetGame,
  onCycleSeason,
}) => {
  const seasonInfo = SEASON_NAMES[season];
  const timeFormatted = `${timeHour.toString().padStart(2, '0')}:${timeMinute.toString().padStart(2, '0')} ${timeHour >= 12 ? 'PM' : 'AM'}`;
  const dayOfWeek = ['一', '二', '三', '四', '五', '六', '日'][(day - 1) % 7];

  const energyPercent = Math.max(0, Math.min(100, (energy / maxEnergy) * 100));
  const waterPercent = Math.max(0, Math.min(100, (waterLevel / maxWater) * 100));

  let energyColor = 'bg-emerald-500';
  if (energyPercent < 30) energyColor = 'bg-red-500 animate-pulse';
  else if (energyPercent < 60) energyColor = 'bg-amber-500';

  return (
    <div className="w-full max-w-[800px] mb-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-sm">
      {/* Top Info Bar: Calendar & Time */}
      <div className="stardew-wood-box px-3 py-2 rounded-lg flex items-center justify-between gap-4">
        {/* Date & Season */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCycleSeason}
            className="px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm transition-transform active:scale-95 cursor-pointer hover:opacity-90 flex items-center gap-1"
            style={{ backgroundColor: seasonInfo.color }}
            title="點擊切換季節 (春/夏/秋)"
          >
            <span>{seasonInfo.zh.split(' ')[0]}</span>
            <span className="text-[9px] opacity-75">↻</span>
          </button>
          <span className="font-bold text-[#3e2009] tracking-wide">
            第 {day} 天 (週{dayOfWeek})
          </span>
          <span className="text-base" title={weather === 'rainy' ? '陰雨天 (自動澆水)' : '晴朗天'}>
            {weather === 'rainy' ? '🌧️' : '☀️'}
          </span>
        </div>

        {/* Clock */}
        <div className="bg-[#4a2810] text-[#fefae0] font-pixel text-xs px-2.5 py-1.5 rounded border border-[#7d441f]">
          {timeFormatted}
        </div>
      </div>

      {/* Stats Bar: Energy, Water & Gold */}
      <div className="stardew-wood-box px-3 py-2 rounded-lg flex items-center justify-between md:justify-end gap-3 flex-1">
        {/* Energy Meter */}
        <div className="flex items-center gap-1.5">
          <span className="text-amber-800 font-bold text-xs" title="體力">⚡</span>
          <div className="w-20 md:w-24 bg-[#3e2009] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#854d0e]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${energyColor}`}
              style={{ width: `${energyPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#3e2009] tabular-nums min-w-[42px]">
            {Math.round(energy)}/{maxEnergy}
          </span>
        </div>

        {/* Water Meter */}
        <div className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold text-xs" title="水壺容量">💧</span>
          <div className="w-14 md:w-16 bg-[#3e2009] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#854d0e]">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${waterPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#3e2009] tabular-nums min-w-[28px]">
            {waterLevel}
          </span>
        </div>

        {/* Gold Counter */}
        <div className="flex items-center gap-1 bg-[#fff8e7] px-2.5 py-1 rounded border border-[#854d0e] font-pixel text-xs text-[#854d0e]">
          <span>💰</span>
          <span className="font-bold tabular-nums">{gold}</span>
          <span className="text-[10px]">G</span>
        </div>

        {/* Controls Toggles */}
        <div className="flex items-center gap-1 border-l border-[#854d0e]/40 pl-2">
          <button
            onClick={onToggleBGM}
            className={`p-1 rounded text-xs transition-colors ${
              bgmEnabled ? 'bg-amber-700 text-white' : 'bg-[#faedcd] text-[#7d441f] hover:bg-[#fff]'
            }`}
            title={bgmEnabled ? '關閉音樂' : '播放鄉村音樂'}
            aria-label="音樂開關"
          >
            <Music className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleSound}
            className={`p-1 rounded text-xs transition-colors ${
              soundEnabled ? 'bg-amber-700 text-white' : 'bg-[#faedcd] text-[#7d441f] hover:bg-[#fff]'
            }`}
            title={soundEnabled ? '靜音音效' : '開啟音效'}
            aria-label="音效開關"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onOpenGuide}
            className="p-1 rounded text-xs bg-[#faedcd] text-[#7d441f] hover:bg-[#fff] transition-colors"
            title="遊戲說明與操作"
            aria-label="說明"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetGame}
            className="p-1 rounded text-xs bg-[#faedcd] text-[#7d441f] hover:bg-rose-200 transition-colors"
            title="重新開始新遊戲"
            aria-label="重新開始"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
