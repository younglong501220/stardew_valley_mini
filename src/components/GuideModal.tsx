import React from 'react';
import { X, Sparkles, BookOpen } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none">
      <div className="stardew-wood-box w-full max-w-lg max-h-[85vh] rounded-2xl overflow-hidden border-4 border-[#7d441f] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-[#4a2810] text-[#fefae0] px-4 py-3 flex items-center justify-between border-b-2 border-[#7d441f]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-300" />
            <h2 className="font-bold text-base">農場生活手冊 (How to Play)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#fefae0] hover:text-white p-1 rounded-full bg-[#7d441f]/50 hover:bg-[#7d441f]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-[#4a2810] bg-[#faedcd]/40 leading-relaxed">
          {/* Controls */}
          <div className="bg-[#faedcd] border border-[#854d0e] rounded-xl p-3">
            <h3 className="font-bold text-sm text-[#854d0e] mb-2 flex items-center gap-1.5">
              <span>🎮</span> 基礎控制
            </h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <b>移動：</b><kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px]">W</kbd>
                <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px] ml-1">A</kbd>
                <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px] ml-1">S</kbd>
                <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px] ml-1">D</kbd>
                或方向鍵 <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px]">↑</kbd>
                <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px] ml-1">↓</kbd>
                <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px] ml-1">←</kbd>
                <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px] ml-1">→</kbd>
              </li>
              <li>
                <b>互動 / 使用工具：</b><kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px]">空白鍵 Space</kbd>，或<b>直接以滑鼠/手指點擊地塊</b>！
              </li>
              <li>
                <b>切換道具：</b>按鍵盤數字鍵 <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px]">1</kbd> 至 <kbd className="bg-[#6f3b14] text-white px-1.5 py-0.5 rounded text-[10px]">9</kbd>，或點擊下方快捷欄。
              </li>
            </ul>
          </div>

          {/* Farming Cycle */}
          <div className="bg-[#faedcd] border border-[#854d0e] rounded-xl p-3">
            <h3 className="font-bold text-sm text-[#854d0e] mb-2 flex items-center gap-1.5">
              <span>🌾</span> 農作耕種四部曲
            </h3>
            <ol className="space-y-1.5 list-decimal list-inside">
              <li>
                <b>開墾：</b>拿著<b>[鋤頭]</b>對著草地開墾成耕地。
              </li>
              <li>
                <b>播種：</b>選取<b>[種子]</b>對耕地播種。
              </li>
              <li>
                <b>澆水：</b>拿著<b>[水壺]</b>對種子地塊澆水（泥土會轉變為濕潤深色）。如果水壺沒水了，走到左下角<b>水塘旁</b>按空白鍵即可重新裝滿！
              </li>
              <li>
                <b>採收：</b>換日後作物成長至成熟期，拿<b>[鐮刀]</b>收割即可獲取農作物！有些作物（如草莓、藍莓、南瓜）還能連續重複結果喔！
              </li>
            </ol>
          </div>

          {/* Facilities */}
          <div className="bg-[#faedcd] border border-[#854d0e] rounded-xl p-3">
            <h3 className="font-bold text-sm text-[#854d0e] mb-2 flex items-center gap-1.5">
              <span>🏡</span> 關鍵設施與生活
            </h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                🛌 <b>小木屋睡覺：</b>走到右上角木屋門口/床鋪按空白鍵睡覺換日。澆過水的作物會在次日成長，體力完全回滿！若熬夜至凌晨 02:00 將會體力透支暈倒。
              </li>
              <li>
                📦 <b>出貨箱：</b>木屋旁的深色大箱子。按空白鍵可將手持物品投進出貨箱，晚上由鎮長結算金幣！
              </li>
              <li>
                🏪 <b>皮埃爾雜貨店：</b>木屋左側的招牌商店箱。可選購各種季節種子、升級背包格數與升級銅製農具（3格大範圍開墾/澆水）！
              </li>
              <li>
                🎣 <b>水塘垂釣：</b>裝備釣竿走到左下角水塘，按空白鍵可拋竿釣魚，體驗原汁原味的釣魚小遊戲！
              </li>
              <li>
                🌧️ <b>雨天效果：</b>下雨天時大地受甘霖滋潤，當天<b>所有農田自動澆灌完畢</b>，完全無須手動澆水！
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#4a2810] p-3 text-center border-t-2 border-[#7d441f]">
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-[#854d0e] hover:bg-[#b45309] text-white font-bold font-pixel text-xs rounded-xl shadow-md"
          >
            我瞭解了，開始種田！
          </button>
        </div>
      </div>
    </div>
  );
};
