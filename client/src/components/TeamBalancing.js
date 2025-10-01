import React, { useState } from 'react';
import { Zap, Target } from 'lucide-react';

const API_BASE_URL = '/api';

function TeamBalancing({ members, onMatchComplete, loading, setLoading }) {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [balancedTeams, setBalancedTeams] = useState(null);
  const [matchName, setMatchName] = useState('');
  const [message, setMessage] = useState('');

  const handleMemberToggle = (member) => {
    if (selectedMembers.find(m => m.id === member.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== member.id));
    } else if (selectedMembers.length < 10) {
      setSelectedMembers([...selectedMembers, member]);
    } else {
      setMessage('⚠️ 최대 10명까지만 선택 가능합니다.');
    }
  };

  const handleBalanceTeams = async () => {
    if (selectedMembers.length !== 10) {
      setMessage('❌ 정확히 10명의 멤버를 선택해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/matches/balance-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds: selectedMembers.map(m => m.id) })
      });

      const data = await response.json();
      
      if (response.ok && data.blueTeam && data.redTeam) {
        setBalancedTeams(data);
        setMessage('');
      } else {
        setMessage('❌ ' + (data.error || '팀 밸런싱에 실패했습니다.'));
      }
    } catch (error) {
      setMessage('❌ 서버 오류가 발생했습니다.');
      console.error(error);
    }
    
    setLoading(false);
  };

  const handleSaveMatch = async (winner) => {
    if (!balancedTeams || !matchName) {
      setMessage('❌ 경기명을 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchName,
          blueTeam: balancedTeams.blueTeam,
          redTeam: balancedTeams.redTeam,
          winner
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('✅ 경기 결과가 저장되었습니다!');
        setBalancedTeams(null);
        setSelectedMembers([]);
        setMatchName('');
        onMatchComplete();
      } else {
        setMessage('❌ ' + (data.error || '경기 저장에 실패했습니다.'));
      }
    } catch (error) {
      setMessage('❌ 서버 오류가 발생했습니다.');
      console.error(error);
    }
    
    setLoading(false);
  };

  const getPositionIcon = (position) => {
    const icons = {
      'TOP': '🛡️',
      'JUNGLE': '🐺',
      'MIDDLE': '⭐',
      'BOTTOM': '🏹',
      'UTILITY': '💎'
    };
    return icons[position] || '❓';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center space-x-1">
	  <Target className="w-8 h-8 text-purple-400" />
	 <span> 팀 밸런싱</span>
      </h2>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-600/20 border border-green-500/30 text-green-300' : 'bg-red-600/20 border border-red-500/30 text-red-300'}`}>
          {message}
        </div>
      )}

      {!balancedTeams ? (
        <div className="space-y-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center justify-between">
              <span>멤버 선택 ({selectedMembers.length}/10)</span>
              {selectedMembers.length === 10 && (
                <span className="text-green-400 text-sm">✅ 10명 선택 완료!</span>
              )}
            </h3>
            
            {members.length === 0 ? (
              <div className="text-center py-8 text-purple-300">
                등록된 멤버가 없습니다. 먼저 멤버를 추가해주세요!
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberToggle(member)}
                      className={`p-4 rounded-lg cursor-pointer border transition-all duration-200 transform hover:scale-105 ${
                        selectedMembers.find(m => m.id === member.id)
                          ? 'bg-purple-600/30 border-purple-400 shadow-lg shadow-purple-500/50'
                          : 'bg-black/20 border-purple-500/30 hover:bg-purple-800/20'
                      }`}
                    >
                      <div className="font-semibold text-white">{member.summoner_name}</div>
                      <div className="text-sm text-purple-300">#{member.tag_line}</div>
                      <div className="text-sm text-purple-200 mt-1 flex items-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span>레이팅: {member.rating || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={handleBalanceTeams}
                  disabled={selectedMembers.length !== 10 || loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {loading ? '밸런싱 중...' : '팀 밸런싱 하기'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
            <h3 className="text-xl font-bold mb-4 text-white">밸런싱 결과</h3>
            <div className="mb-4 text-center">
              <div className="text-purple-300">
                점수 차이: <span className="font-bold text-white">{balancedTeams.scoreDifference}</span> 점
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-lg font-bold text-blue-300 mb-3 flex items-center justify-between">
                  <span>🔵 블루팀</span>
                  <span className="text-sm">총점: {balancedTeams.blueScore}</span>
                </h4>
                <div className="space-y-2">
                  {balancedTeams.blueTeam.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 bg-blue-800/20 rounded">
                      <span className="text-2xl">{getPositionIcon(member.position)}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{member.summoner_name}</div>
                        <div className="text-sm text-blue-300">
                          {member.position} • 점수: {member.totalScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h4 className="text-lg font-bold text-red-300 mb-3 flex items-center justify-between">
                  <span>🔴 레드팀</span>
                  <span className="text-sm">총점: {balancedTeams.redScore}</span>
                </h4>
                <div className="space-y-2">
                  {balancedTeams.redTeam.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 bg-red-800/20 rounded">
                      <span className="text-2xl">{getPositionIcon(member.position)}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{member.summoner_name}</div>
                        <div className="text-sm text-red-300">
                          {member.position} • 점수: {member.totalScore}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
            <h3 className="text-xl font-bold mb-4 text-white">경기 결과 입력</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  경기명
                </label>
                <input
                  type="text"
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  className="w-full px-4 py-2 bg-black/40 border border-purple-500/50 rounded-lg text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  placeholder="예: 내전 1경기"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleSaveMatch('blue')}
                  disabled={!matchName || loading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  🔵 블루팀 승리
                </button>
                <button
                  onClick={() => handleSaveMatch('red')}
                  disabled={!matchName || loading}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  🔴 레드팀 승리
                </button>
              </div>
              <button
                onClick={() => setBalancedTeams(null)}
                className="w-full bg-gray-600/50 hover:bg-gray-600/70 px-6 py-2 rounded-lg text-white font-medium transition-all duration-200"
              >
                다시 밸런싱
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamBalancing;
