import React, { useState } from 'react';
import { Zap, Target, RefreshCw, ArrowLeftRight, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE_URL = '/api';

function TeamBalancing({ members, onMatchComplete, loading, setLoading }) {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [balancedTeams, setBalancedTeams] = useState(null);
  const [matchName, setMatchName] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [editingPosition, setEditingPosition] = useState(null);

  const fireConfetti = (isBlueTeam) => {
    const colors = isBlueTeam ? ['#3b82f6', '#60a5fa', '#93c5fd'] : ['#ef4444', '#f87171', '#fca5a5'];
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });
  };

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
        setMatchCount(0);
        setMessage('');
      } else {
        setMessage('❌ ' + (data.error || '팀 밸런싱에 실패했습니다.'));
      }
    } catch (error) {
      setMessage('❌ 서버 오류가 발생했습니다.');
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
      const currentMatchName = matchCount > 0 ? `${matchName} #${matchCount + 1}` : matchName;

      const response = await fetch(`${API_BASE_URL}/matches/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchName: currentMatchName,
          blueTeam: balancedTeams.blueTeam,
          redTeam: balancedTeams.redTeam,
          winner
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage(`✅ ${currentMatchName} 결과가 저장되었습니다!`);
        fireConfetti(winner === 'blue');
        setMatchCount(matchCount + 1);
        onMatchComplete();
      } else {
        setMessage('❌ ' + (data.error || '경기 저장에 실패했습니다.'));
      }
    } catch (error) {
      setMessage('❌ 서버 오류가 발생했습니다.');
    }

    setLoading(false);
  };

  const handlePositionChange = (team, index, newPosition) => {
    const updatedTeams = { ...balancedTeams };
    const targetTeam = team === 'blue' ? updatedTeams.blueTeam : updatedTeams.redTeam;

    const currentMember = targetTeam[index];
    const currentPosition = currentMember.position;

    if (currentPosition === newPosition) {
      setEditingPosition(null);
      return;
    }

    const swapTargetIndex = targetTeam.findIndex(member => member.position === newPosition);

    if (swapTargetIndex !== -1) {
      targetTeam[swapTargetIndex].position = currentPosition;
      targetTeam[index].position = newPosition;
      setMessage(`🔄 ${currentMember.summoner_name}와 ${targetTeam[swapTargetIndex].summoner_name}의 포지션이 교환되었습니다!`);
    } else {
      targetTeam[index].position = newPosition;
      setMessage('');
    }

    const positionOrder = { 'top': 0, 'jungle': 1, 'mid': 2, 'adc': 3, 'support': 4 };
    targetTeam.sort((a, b) => positionOrder[a.position] - positionOrder[b.position]);

    setBalancedTeams(updatedTeams);
    setEditingPosition(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSwapTeams = () => {
    setBalancedTeams({
      blueTeam: balancedTeams.redTeam,
      redTeam: balancedTeams.blueTeam,
      blueScore: balancedTeams.redScore,
      redScore: balancedTeams.blueScore,
      scoreDifference: balancedTeams.scoreDifference
    });
    setMessage('🔄 블루팀과 레드팀이 교체되었습니다!');
  };

  const getPositionIcon = (position) => {
    const pos = String(position || '').toLowerCase();
    const icons = {
      'top': '/images/positions/top.png',
      'jungle': '/images/positions/jungle.png',
      'mid': '/images/positions/mid.png',
      'adc': '/images/positions/adc.png',
      'support': '/images/positions/support.png'
    };
    return icons[pos] || '/images/positions/mid.png';
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

  const positions = ['top', 'jungle', 'mid', 'adc', 'support'];

  const filteredMembers = members.filter(m =>
    m.summoner_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PositionModal = ({ team, index, currentPosition, onClose }) => {
    const targetTeam = team === 'blue' ? balancedTeams.blueTeam : balancedTeams.redTeam;
    const currentMember = targetTeam[index];

    const positionUsers = {};
    targetTeam.forEach((member, idx) => {
      if (idx !== index) {
        positionUsers[member.position] = member.summoner_name;
      }
    });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
        <div
          className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">포지션 선택</h3>
              <p className="text-sm text-gray-600 mt-1">
                {currentMember.summoner_name} - 현재: {getPositionName(currentPosition)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {positions.map(pos => {
              const isUsed = positionUsers[pos];
              const isCurrent = currentPosition === pos;

              return (
                <button
                  key={pos}
                  onClick={() => handlePositionChange(team, index, pos)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? 'border-green-500 bg-green-50'
                      : isUsed
                      ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={getPositionIcon(pos)}
                      alt={getPositionName(pos)}
                      className="w-12 h-12 object-contain"
                    />
                    <span className={`font-semibold text-sm ${
                      isCurrent ? 'text-green-700' : isUsed ? 'text-yellow-700' : 'text-gray-700'
                    }`}>
                      {getPositionName(pos)}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-green-600 font-medium">현재 선택</span>
                    )}
                    {isUsed && !isCurrent && (
                      <span className="text-xs text-yellow-600 font-medium truncate max-w-full px-1">
                        {isUsed}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center">
              💡 다른 포지션을 클릭하면 해당 멤버와 포지션이 교환됩니다
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
        <Target className="w-8 h-8 text-primary-600" />
        <span>팀 밸런싱</span>
      </h2>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message}
        </div>
      )}

      {!balancedTeams ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center justify-between">
              <span>멤버 선택 ({selectedMembers.length}/10)</span>
              {selectedMembers.length === 10 && (
                <span className="text-green-600 text-sm font-medium">✅ 10명 선택 완료!</span>
              )}
            </h3>

            <div className="mb-4">
              <input
                type="text"
                placeholder="멤버 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
              />
            </div>

            {members.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                등록된 멤버가 없습니다. 먼저 멤버를 추가해주세요!
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberToggle(member)}
                      className={`p-4 rounded-lg cursor-pointer border transition-all ${
                        selectedMembers.find(m => m.id === member.id)
                          ? 'bg-primary-50 border-primary-500 shadow-md'
                          : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{member.summoner_name}</div>
                      <div className="text-sm text-gray-600">#{member.tag_line}</div>
                      <div className="text-sm text-gray-600 mt-1 flex items-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span>레이팅: {member.rating || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleBalanceTeams}
                  disabled={selectedMembers.length !== 10 || loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? '밸런싱 중...' : '팀 밸런싱 하기'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">밸런싱 결과</h3>
              <button
                onClick={handleSwapTeams}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-4 py-2 rounded-lg text-gray-700 transition-colors"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>팀 교체</span>
              </button>
            </div>
            <div className="mb-4 text-center">
              <div className="text-gray-600">
                점수 차이: <span className="font-bold text-gray-900">{balancedTeams.scoreDifference}</span> 점
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 블루팀 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-bold text-blue-700 mb-3 flex items-center justify-between">
                  <span>🔵 블루팀</span>
                  <span className="text-sm">총점: {balancedTeams.blueScore}</span>
                </h4>
                <div className="space-y-2">
                  {balancedTeams.blueTeam && balancedTeams.blueTeam.map((member, index) => (
                    <div key={member.id || index} className="flex items-center space-x-3 p-2 bg-white rounded">
                      <button
                        onClick={() => setEditingPosition({ team: 'blue', index })}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-lg transition-colors cursor-pointer"
                        title="포지션 변경"
                      >
                        <img
                          src={getPositionIcon(member.position)}
                          alt={getPositionName(member.position)}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-blue-800 text-sm font-medium">
                          {getPositionName(member.position)}
                        </span>
                      </button>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{member.summoner_name}</div>
                        <div className="text-sm text-gray-600">
                          점수: {member.finalScore || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 레드팀 */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-lg font-bold text-red-700 mb-3 flex items-center justify-between">
                  <span>🔴 레드팀</span>
                  <span className="text-sm">총점: {balancedTeams.redScore}</span>
                </h4>
                <div className="space-y-2">
                  {balancedTeams.redTeam && balancedTeams.redTeam.map((member, index) => (
                    <div key={member.id || index} className="flex items-center space-x-3 p-2 bg-white rounded">
                      <button
                        onClick={() => setEditingPosition({ team: 'red', index })}
                        className="flex items-center space-x-2 px-3 py-2 bg-red-100 hover:bg-red-200 border border-red-300 rounded-lg transition-colors cursor-pointer"
                        title="포지션 변경"
                      >
                        <img
                          src={getPositionIcon(member.position)}
                          alt={getPositionName(member.position)}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="text-red-800 text-sm font-medium">
                          {getPositionName(member.position)}
                        </span>
                      </button>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{member.summoner_name}</div>
                        <div className="text-sm text-gray-600">
                          점수: {member.finalScore || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900">경기 결과 입력</h3>
            {matchCount > 0 && (
              <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 text-sm">
                💡 현재 {matchCount}경기 저장됨. 계속 승패를 기록할 수 있습니다!
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  경기명
                </label>
                <input
                  type="text"
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
                  placeholder="예: 내전 1경기"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleSaveMatch('blue')}
                  disabled={!matchName || loading}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  🔵 블루팀 승리
                </button>
                <button
                  onClick={() => handleSaveMatch('red')}
                  disabled={!matchName || loading}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  🔴 레드팀 승리
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setBalancedTeams(null)}
                  className="bg-gray-100 hover:bg-gray-200 px-6 py-2 rounded-lg text-gray-700 font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  다시 밸런싱
                </button>
                <button
                  onClick={() => {
                    setBalancedTeams(null);
                    setSelectedMembers([]);
                    setMatchName('');
                    setMatchCount(0);
                  }}
                  className="bg-red-100 hover:bg-red-200 px-6 py-2 rounded-lg text-red-700 font-medium transition-colors"
                >
                  전체 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingPosition && (
        <PositionModal
          team={editingPosition.team}
          index={editingPosition.index}
          currentPosition={
            editingPosition.team === 'blue'
              ? balancedTeams.blueTeam[editingPosition.index].position
              : balancedTeams.redTeam[editingPosition.index].position
          }
          onClose={() => setEditingPosition(null)}
        />
      )}
    </div>
  );
}

export default TeamBalancing;
