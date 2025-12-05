import React, { useState } from 'react';
import { Swords, Trash2, Trophy, Calendar } from 'lucide-react';

const API_BASE_URL = '/api';

function MatchHistory({ matches = [], onMatchDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const getPositionImage = (position) => {
    const positionMap = {
      'top': '/images/positions/top.png',
      'jungle': '/images/positions/jungle.png',
      'mid': '/images/positions/mid.png',
      'adc': '/images/positions/adc.png',
      'support': '/images/positions/support.png'
    };
    return positionMap[position?.toLowerCase()] || '/images/positions/mid.png';
  };

  const getPositionName = (position) => {
    const pos = String(position || '').toLowerCase();
    const names = {
      'top': '탑',
      'jungle': '정글',
      'mid': '미드',
      'adc': '원딜',
      'support': '서포터'
    };
    return names[pos] || position;
  };

  const sortByPosition = (names, positions) => {
    if (!names || !positions) return { names: names || [], positions: positions || [] };
    
    const positionOrder = { 'top': 0, 'jungle': 1, 'mid': 2, 'adc': 3, 'support': 4 };
    
    const combined = names.map((name, idx) => ({
      name: name,
      position: positions[idx],
      order: positionOrder[positions[idx]?.toLowerCase()] ?? 999
    }));
    
    combined.sort((a, b) => a.order - b.order);
    
    return {
      names: combined.map(item => item.name),
      positions: combined.map(item => item.position)
    };
  };

  // 새로 추가: 매치 삭제 핸들러
  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('정말 이 경기를 삭제하시겠습니까?\n레이팅이 복구되며 되돌릴 수 없습니다.')) {
      return;
    }

    setDeletingId(matchId);

    try {
      const response = await fetch(`${API_BASE_URL}/matches/${matchId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('✅ ' + data.message);
        if (onMatchDeleted) {
          onMatchDeleted();
        }
      } else {
        alert('❌ ' + (data.error || '매치 삭제에 실패했습니다.'));
      }
    } catch (error) {
      console.error('매치 삭제 에러:', error);
      alert('❌ 서버 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 새로 추가: 상대 시간 표시 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 개선 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Swords className="w-8 h-8 text-purple-400" />
          <span>경기 기록</span>
        </h2>
        <div className="text-purple-300 text-sm">
          총 {matches.length}경기
        </div>
      </div>
      
      {matches.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-12 text-center">
          <Swords className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <p className="text-purple-300 text-lg">아직 경기 기록이 없습니다.</p>
          <p className="text-purple-400 text-sm mt-2">첫 번째 내전을 시작해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const blueSorted = sortByPosition(match.blue_team_names, match.blue_team_positions);
            const redSorted = sortByPosition(match.red_team_names, match.red_team_positions);
            const isBlueWinner = match.winner === 'blue';
            
            return (
              <div 
                key={match.id} 
                className="bg-black/40 backdrop-blur-sm rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-200 overflow-hidden"
              >
                {/* 헤더 부분 - 개선됨 */}
                <div className={`p-4 ${isBlueWinner ? 'bg-blue-600/10' : 'bg-red-600/10'}`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Trophy className={`w-6 h-6 ${isBlueWinner ? 'text-blue-400' : 'text-red-400'}`} />
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {match.match_name || `경기 #${match.id}`}
                        </h3>
                        <div className="flex items-center gap-2 text-purple-300 text-sm mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(match.match_date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                        isBlueWinner
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/20' 
                          : 'bg-red-600/30 text-red-300 border border-red-500/50 shadow-lg shadow-red-500/20'
                      }`}>
                        {isBlueWinner ? '🔵 블루팀 승리' : '🔴 레드팀 승리'}
                      </div>
                      
                      {/* 새로 추가: 삭제 버튼 */}
                      <button
                        onClick={() => handleDeleteMatch(match.id)}
                        disabled={deletingId === match.id}
                        className="p-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 hover:border-red-500/50 rounded-lg text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="경기 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 팀 정보 - 가독성 개선 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-1">
                  {/* 블루팀 */}
                  <div className={`p-4 ${
                    isBlueWinner 
                      ? 'bg-blue-900/20 border-l-4 border-blue-500' 
                      : 'bg-blue-900/5'
                  }`}>
                    <h4 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
                      <span>🔵 블루팀</span>
                      {isBlueWinner && <Trophy className="w-4 h-4 text-yellow-400" />}
                    </h4>
                    <div className="space-y-2">
                      {blueSorted.names.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-blue-900/20 rounded-lg px-3 py-2 border border-blue-500/10">
                          <img 
                            src={getPositionImage(blueSorted.positions[idx])} 
                            alt={blueSorted.positions[idx]}
                            className="w-8 h-8 object-contain"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-blue-100">{name}</div>
                            <div className="text-xs text-blue-300/70">
                              {getPositionName(blueSorted.positions[idx])}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 레드팀 */}
                  <div className={`p-4 ${
                    !isBlueWinner 
                      ? 'bg-red-900/20 border-l-4 border-red-500' 
                      : 'bg-red-900/5'
                  }`}>
                    <h4 className="text-lg font-bold text-red-300 mb-3 flex items-center gap-2">
                      <span>🔴 레드팀</span>
                      {!isBlueWinner && <Trophy className="w-4 h-4 text-yellow-400" />}
                    </h4>
                    <div className="space-y-2">
                      {redSorted.names.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-red-900/20 rounded-lg px-3 py-2 border border-red-500/10">
                          <img 
                            src={getPositionImage(redSorted.positions[idx])} 
                            alt={redSorted.positions[idx]}
                            className="w-8 h-8 object-contain"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-red-100">{name}</div>
                            <div className="text-xs text-red-300/70">
                              {getPositionName(redSorted.positions[idx])}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MatchHistory;
