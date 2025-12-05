import React from 'react';
import { Trophy, Zap } from 'lucide-react';

function Rankings({ rankings }) {
  const rankingsList = Array.isArray(rankings) ? rankings : [];

  const getRankEmoji = (index) => {
    if (index === 0) return '🏆';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  const getRankBg = (index) => {
    if (index === 0) return 'bg-yellow-50';
    if (index === 1) return 'bg-gray-50';
    if (index === 2) return 'bg-orange-50';
    return '';
  };

  const getRankBorder = (index) => {
    if (index === 0) return 'border-l-4 border-l-yellow-500';
    if (index === 1) return 'border-l-4 border-l-gray-400';
    if (index === 2) return 'border-l-4 border-l-orange-400';
    return '';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <span>내전 랭킹</span>
      </h2>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">순위</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">소환사명</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">레이팅</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">전적</th>
                <th className="px-6 py-4 text-left text-gray-700 font-semibold">승률</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rankingsList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    아직 랭킹 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rankingsList.map((player, index) => (
                  <tr
                    key={index}
                    className={`hover:bg-gray-50 transition-colors ${getRankBg(index)} ${getRankBorder(index)}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-2xl ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-gray-500' :
                          index === 2 ? 'text-orange-500' :
                          'text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                        {getRankEmoji(index) && (
                          <span className="text-2xl">
                            {getRankEmoji(index)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className={`font-semibold text-lg ${
                          index === 0 ? 'text-yellow-700' :
                          index === 1 ? 'text-gray-700' :
                          index === 2 ? 'text-orange-700' :
                          'text-gray-900'
                        }`}>
                          {player.summoner_name}
                        </div>
                        <div className="text-sm text-gray-500">#{player.tag_line}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Zap className={`w-5 h-5 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-500' :
                          'text-primary-500'
                        }`} />
                        <span className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-700' :
                          index === 1 ? 'text-gray-700' :
                          index === 2 ? 'text-orange-700' :
                          'text-gray-900'
                        }`}>
                          {player.rating || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">
                        <span className="text-green-600 font-semibold">{player.wins || 0}승</span>
                        {' / '}
                        <span className="text-red-600 font-semibold">{player.losses || 0}패</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        총 {player.total_matches || 0}경기
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-lg font-bold ${
                        (player.win_rate || 0) >= 60 ? 'text-green-600' :
                        (player.win_rate || 0) >= 40 ? 'text-yellow-600' :
                        'text-red-600'
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
