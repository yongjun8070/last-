import React from 'react';
import { Trophy, Zap } from 'lucide-react';

function Rankings({ rankings }) {
  // rankings가 배열인지 확인하고, 아니면 빈 배열로 처리
  const rankingsList = Array.isArray(rankings) ? rankings : [];

  return (
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
                  <tr key={index} className="hover:bg-purple-800/20 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`font-bold text-2xl ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-400' :
                          'text-purple-300'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{player.summoner_name}</div>
                        <div className="text-sm text-purple-300">#{player.tag_line}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="text-2xl font-bold text-white">{player.rating || 0}</span>
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
  );
}

export default Rankings;
