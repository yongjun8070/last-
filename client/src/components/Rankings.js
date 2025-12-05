import React from 'react';
import { Trophy, Zap } from 'lucide-react';

function Rankings({ rankings }) {
  const rankingsList = Array.isArray(rankings) ? rankings : [];

  const getRankClass = (index) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return 'rank-other';
  };

  const getRankEmoji = (index) => {
    if (index === 0) return '🏆';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  return (
    <>
      <style>{`
        /* 랭킹 행 기본 스타일 */
        .ranking-row {
          position: relative;
        }

        /* 1등 - 금빛 효과 */
        .rank-1 {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 140, 0, 0.15)) !important;
          border-left: 4px solid #FFD700 !important;
          box-shadow: 0 0 40px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 140, 0, 0.2);
        }

        /* 2등 - 은빛 효과 */
        .rank-2 {
          background: linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(169, 169, 169, 0.15)) !important;
          border-left: 4px solid #C0C0C0 !important;
          box-shadow: 0 0 30px rgba(192, 192, 192, 0.3);
        }

        /* 3등 - 동빛 효과 */
        .rank-3 {
          background: linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(184, 115, 51, 0.15)) !important;
          border-left: 4px solid #CD7F32 !important;
          box-shadow: 0 0 25px rgba(205, 127, 50, 0.3);
        }

        /* 순위 숫자 스타일 */
        .rank-number-1 {
          color: #FFD700;
          text-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 140, 0, 0.8);
          animation: fireFlicker 1.5s ease-in-out infinite;
        }

        @keyframes fireFlicker {
          0%, 100% { 
            text-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 140, 0, 0.8);
          }
          50% { 
            text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 69, 0, 1), 0 0 90px rgba(255, 0, 0, 0.5);
          }
        }

        .rank-number-2 {
          color: #C0C0C0;
          text-shadow: 0 0 15px rgba(192, 192, 192, 1);
        }

        .rank-number-3 {
          color: #CD7F32;
          text-shadow: 0 0 12px rgba(205, 127, 50, 1);
        }

        /* 트로피 아이콘 회전 (1등만) */
        .trophy-icon {
          display: inline-block;
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
        }

        .trophy-spin {
          animation: trophySpin 3s ease-in-out infinite;
        }

        @keyframes trophySpin {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.15); }
          50% { transform: rotate(0deg) scale(1.2); }
          75% { transform: rotate(15deg) scale(1.15); }
        }

        /* 왕관 효과 (1등 이름 위에) */
        .crown {
          position: absolute;
          top: -20px;
          left: 0;
          font-size: 2em;
          animation: crownBounce 1s ease-in-out infinite;
          z-index: 10;
          filter: drop-shadow(0 0 15px rgba(255, 215, 0, 1));
        }

        @keyframes crownBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(10deg); }
        }

        /* 불꽃 파티클 효과 (1등만) */
        .fire-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          bottom: 0;
          width: 3px;
          height: 3px;
          background: radial-gradient(circle, #FFD700, #FF4500);
          border-radius: 50%;
          animation: floatUp 2s ease-out infinite;
          opacity: 0;
        }

        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-50px) scale(0);
            opacity: 0;
          }
        }

        .particle:nth-child(1) { left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { left: 20%; animation-delay: 0.2s; }
        .particle:nth-child(3) { left: 35%; animation-delay: 0.4s; }
        .particle:nth-child(4) { left: 50%; animation-delay: 0.6s; }
        .particle:nth-child(5) { left: 65%; animation-delay: 0.8s; }
        .particle:nth-child(6) { left: 80%; animation-delay: 1s; }
        .particle:nth-child(7) { left: 25%; animation-delay: 1.2s; }
        .particle:nth-child(8) { left: 75%; animation-delay: 1.4s; }

        /* 플레이어 이름 빛나는 효과 (1등만) */
        .player-name-glow {
          animation: nameGlow 2s ease-in-out infinite;
        }

        @keyframes nameGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(255, 215, 0, 0.6); }
          50% { text-shadow: 0 0 20px rgba(255, 215, 0, 1), 0 0 30px rgba(255, 140, 0, 0.8); }
        }
      `}</style>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <span>내전 랭킹</span>
        </h2>
        
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">순위</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">소환사명</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">레이팅</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">전적</th>
                  <th className="px-6 py-4 text-left text-purple-200 font-semibold">승률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/20">
                {rankingsList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-purple-300">
                      아직 랭킹 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  rankingsList.map((player, index) => (
                    <tr 
                      key={index} 
                      className={`ranking-row ${getRankClass(index)} hover:brightness-110 transition-all duration-200`}
                    >
                      <td className="px-6 py-4 relative overflow-hidden">
                        {index === 0 && (
                          <div className="fire-particles">
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                            <div className="particle"></div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <span className={`rank-number font-bold text-3xl ${
                            index === 0 ? 'rank-number-1' :
                            index === 1 ? 'rank-number-2' :
                            index === 2 ? 'rank-number-3' :
                            'text-purple-300'
                          }`}>
                            {index + 1}
                          </span>
                          {getRankEmoji(index) && (
                            <span className={`trophy-icon text-3xl ${index === 0 ? 'trophy-spin' : ''}`}>
                              {getRankEmoji(index)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 relative">
                        {index === 0 && <div className="crown">👑</div>}
                        <div>
                          <div className={`font-semibold text-lg ${
                            index === 0 ? 'text-yellow-300 player-name-glow' :
                            index === 1 ? 'text-gray-200' :
                            index === 2 ? 'text-orange-300' :
                            'text-white'
                          }`}>
                            {player.summoner_name}
                          </div>
                          <div className="text-sm text-purple-300">#{player.tag_line}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Zap className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-gray-300' :
                            index === 2 ? 'text-orange-400' :
                            'text-yellow-400'
                          }`} />
                          <span className={`text-2xl font-bold ${
                            index === 0 ? 'text-yellow-300' :
                            index === 1 ? 'text-gray-200' :
                            index === 2 ? 'text-orange-300' :
                            'text-white'
                          }`}>
                            {player.rating || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">
                          <span className="text-green-400 font-semibold">{player.wins || 0}승</span>
                          {' / '}
                          <span className="text-red-400 font-semibold">{player.losses || 0}패</span>
                        </div>
                        <div className="text-sm text-purple-300">
                          총 {player.total_matches || 0}경기
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-lg font-bold ${
                          (player.win_rate || 0) >= 60 ? 'text-green-400' : 
                          (player.win_rate || 0) >= 40 ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {player.win_rate || 0}%
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default Rankings;
