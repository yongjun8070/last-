import React, { useState, useEffect } from 'react';
import { Users, Trophy, X, Settings, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

const API_BASE_URL = '/api';

const POSITIONS = [
  { id: 'top', name: '탑', img: '/images/positions/top.png' },
  { id: 'jungle', name: '정글', img: '/images/positions/jungle.png' },
  { id: 'mid', name: '미드', img: '/images/positions/mid.png' },
  { id: 'adc', name: '원딜', img: '/images/positions/adc.png' },
  { id: 'support', name: '서폿', img: '/images/positions/support.png' }
];

function CustomTeam() {
  const [members, setMembers] = useState([]);
  const [blueTeam, setBlueTeam] = useState([]);
  const [redTeam, setRedTeam] = useState([]);
  const [matchName, setMatchName] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bluePositions, setBluePositions] = useState({});
  const [redPositions, setRedPositions] = useState({});
  const [expandedPositionModal, setExpandedPositionModal] = useState(null);
  const [teamsCreated, setTeamsCreated] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fireConfetti = (isBlueTeam) => {
    const colors = isBlueTeam ? ['#3b82f6', '#60a5fa', '#93c5fd'] : ['#ef4444', '#f87171', '#fca5a5'];
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/members`);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('멤버 목록 조회 실패:', error);
    }
  };

  const addToBlueTeam = (member) => {
    if (blueTeam.length >= 5) {
      setMessage('블루팀은 최대 5명입니다.');
      return;
    }
    if (blueTeam.find(m => m.id === member.id) || redTeam.find(m => m.id === member.id)) {
      setMessage('이미 선택된 멤버입니다.');
      return;
    }
    setBlueTeam([...blueTeam, member]);

    if (member.preferred_positions && member.preferred_positions.length > 0) {
      setBluePositions({
        ...bluePositions,
        [member.id]: [member.preferred_positions[0]]
      });
    }

    setMessage('');
  };

  const addToRedTeam = (member) => {
    if (redTeam.length >= 5) {
      setMessage('레드팀은 최대 5명입니다.');
      return;
    }
    if (blueTeam.find(m => m.id === member.id) || redTeam.find(m => m.id === member.id)) {
      setMessage('이미 선택된 멤버입니다.');
      return;
    }
    setRedTeam([...redTeam, member]);

    if (member.preferred_positions && member.preferred_positions.length > 0) {
      setRedPositions({
        ...redPositions,
        [member.id]: [member.preferred_positions[0]]
      });
    }

    setMessage('');
  };

  const removeFromBlueTeam = (memberId) => {
    setBlueTeam(blueTeam.filter(m => m.id !== memberId));
    const newPositions = { ...bluePositions };
    delete newPositions[memberId];
    setBluePositions(newPositions);
  };

  const removeFromRedTeam = (memberId) => {
    setRedTeam(redTeam.filter(m => m.id !== memberId));
    const newPositions = { ...redPositions };
    delete newPositions[memberId];
    setRedPositions(newPositions);
  };

  const handleBluePositionToggle = (memberId, positionId) => {
    const currentPositions = bluePositions[memberId] || [];

    const positionTaken = Object.entries(bluePositions).some(
      ([id, positions]) => id !== String(memberId) && positions.includes(positionId)
    );

    if (positionTaken) {
      setMessage('해당 포지션은 이미 다른 멤버가 선택했습니다.');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    if (currentPositions.includes(positionId)) {
      setBluePositions({
        ...bluePositions,
        [memberId]: []
      });
    } else {
      const newPositions = {
        ...bluePositions,
        [memberId]: [positionId]
      };
      setBluePositions(newPositions);

      const posOrder = { 'top': 0, 'jungle': 1, 'mid': 2, 'adc': 3, 'support': 4 };
      const sortedTeam = [...blueTeam].sort((a, b) => {
        const posA = newPositions[a.id]?.[0];
        const posB = newPositions[b.id]?.[0];
        const orderA = posA ? posOrder[posA] : 999;
        const orderB = posB ? posOrder[posB] : 999;
        return orderA - orderB;
      });
      setBlueTeam(sortedTeam);
    }
  };

  const handleRedPositionToggle = (memberId, positionId) => {
    const currentPositions = redPositions[memberId] || [];

    const positionTaken = Object.entries(redPositions).some(
      ([id, positions]) => id !== String(memberId) && positions.includes(positionId)
    );

    if (positionTaken) {
      setMessage('해당 포지션은 이미 다른 멤버가 선택했습니다.');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    if (currentPositions.includes(positionId)) {
      setRedPositions({
        ...redPositions,
        [memberId]: []
      });
    } else {
      const newPositions = {
        ...redPositions,
        [memberId]: [positionId]
      };
      setRedPositions(newPositions);

      const posOrder = { 'top': 0, 'jungle': 1, 'mid': 2, 'adc': 3, 'support': 4 };
      const sortedTeam = [...redTeam].sort((a, b) => {
        const posA = newPositions[a.id]?.[0];
        const posB = newPositions[b.id]?.[0];
        const orderA = posA ? posOrder[posA] : 999;
        const orderB = posB ? posOrder[posB] : 999;
        return orderA - orderB;
      });
      setRedTeam(sortedTeam);
    }
  };

  const createTeams = async () => {
    if (!matchName.trim()) {
      setMessage('경기명을 입력해주세요.');
      return;
    }
    if (blueTeam.length !== 5 || redTeam.length !== 5) {
      setMessage('각 팀은 정확히 5명이어야 합니다.');
      return;
    }

    const blueHasAllPositions = blueTeam.every(m =>
      bluePositions[m.id] && bluePositions[m.id].length > 0
    );
    const redHasAllPositions = redTeam.every(m =>
      redPositions[m.id] && redPositions[m.id].length > 0
    );

    if (!blueHasAllPositions || !redHasAllPositions) {
      setMessage('모든 멤버의 포지션을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const blueTeamPositions = blueTeam.map(m => bluePositions[m.id]?.[0] || null);
      const redTeamPositions = redTeam.map(m => redPositions[m.id]?.[0] || null);

      const response = await fetch(`${API_BASE_URL}/matches/custom-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchName,
          blueTeam: blueTeam.map(m => m.id),
          redTeam: redTeam.map(m => m.id),
          blueTeamPositions,
          redTeamPositions
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTeamsCreated(true);
        setMessage('✅ 팀이 생성되었습니다! Discord를 확인하세요. 이제 승패를 결정하세요.');
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('팀 생성에 실패했습니다.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openResultModal = () => {
    if (!teamsCreated) {
      setMessage('먼저 팀을 생성해주세요.');
      return;
    }
    setShowResultModal(true);
    setMessage('');
  };

  const submitResult = async (winningTeam) => {
    setLoading(true);
    try {
      const blueTeamPositions = blueTeam.map(m => bluePositions[m.id]?.[0] || null);
      const redTeamPositions = redTeam.map(m => redPositions[m.id]?.[0] || null);

      const response = await fetch(`${API_BASE_URL}/matches/custom-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchName,
          blueTeam: blueTeam.map(m => m.id),
          redTeam: redTeam.map(m => m.id),
          blueTeamPositions,
          redTeamPositions,
          winningTeam
        })
      });

      const data = await response.json();

      if (response.ok) {
        fireConfetti(winningTeam === 'blue');
        setMessage(data.message);
        setShowResultModal(false);
        setTimeout(() => {
          setBlueTeam([]);
          setRedTeam([]);
          setMatchName('');
          setMessage('');
          setBluePositions({});
          setRedPositions({});
          setTeamsCreated(false);
        }, 2000);
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('결과 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetTeams = () => {
    setBlueTeam([]);
    setRedTeam([]);
    setMatchName('');
    setMessage('');
    setBluePositions({});
    setRedPositions({});
    setTeamsCreated(false);
  };

  const availableMembers = members
    .filter(m => !blueTeam.find(b => b.id === m.id) && !redTeam.find(r => r.id === m.id))
    .filter(m => m.summoner_name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Settings className="w-8 h-8 text-primary-600" />
          <span>커스텀 팀 구성</span>
        </h2>
        {teamsCreated && (
          <button
            onClick={resetTeams}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition"
          >
            초기화
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') || message.includes('승리') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          경기명
        </label>
        <input
          type="text"
          value={matchName}
          onChange={(e) => setMatchName(e.target.value)}
          disabled={teamsCreated}
          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:opacity-50 transition"
          placeholder="예: 금요일 내전"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 블루팀 */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-xl font-bold text-blue-700 mb-4">
            블루팀 ({blueTeam.length}/5)
          </h3>
          <div className="space-y-2">
            {blueTeam.map(member => (
              <div key={member.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-semibold">{member.summoner_name}</span>
                  {!teamsCreated && (
                    <button
                      onClick={() => removeFromBlueTeam(member.id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => !teamsCreated && setExpandedPositionModal({ memberId: member.id, team: 'blue' })}
                  disabled={teamsCreated}
                  className="w-full flex items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed border border-gray-200"
                >
                  {bluePositions[member.id] && bluePositions[member.id].length > 0 ? (
                    <div className="flex gap-1">
                      {bluePositions[member.id].map(posId => {
                        const pos = POSITIONS.find(p => p.id === posId);
                        return pos ? (
                          <img
                            key={posId}
                            src={pos.img}
                            alt={pos.name}
                            className="w-5 h-5 object-contain"
                          />
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-sm">포지션 선택</span>
                  )}
                </button>
              </div>
            ))}
            {[...Array(5 - blueTeam.length)].map((_, i) => (
              <div key={`empty-blue-${i}`} className="h-20 border-2 border-dashed border-blue-300 rounded-lg" />
            ))}
          </div>
        </div>

        {/* 선택 가능한 멤버 */}
        {!teamsCreated && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              멤버 선택 ({availableMembers.length}명)
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

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableMembers.map(member => (
                <div key={member.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span className="text-gray-900 font-medium">{member.summoner_name}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addToBlueTeam(member)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition shadow-sm"
                      disabled={blueTeam.length >= 5}
                    >
                      블루
                    </button>
                    <button
                      onClick={() => addToRedTeam(member)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition shadow-sm"
                      disabled={redTeam.length >= 5}
                    >
                      레드
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 팀 생성 후 상태 표시 */}
        {teamsCreated && (
          <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg border border-primary-300 p-6 flex flex-col items-center justify-center">
            <Send className="w-16 h-16 text-primary-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">팀 생성 완료!</h3>
            <p className="text-gray-700 text-center mb-4">Discord를 확인하세요</p>
            <button
              onClick={openResultModal}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition shadow-sm"
            >
              승패 결정하기
            </button>
          </div>
        )}

        {/* 레드팀 */}
        <div className="bg-red-50 rounded-lg border border-red-200 p-6">
          <h3 className="text-xl font-bold text-red-700 mb-4">
            레드팀 ({redTeam.length}/5)
          </h3>
          <div className="space-y-2">
            {redTeam.map(member => (
              <div key={member.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 font-semibold">{member.summoner_name}</span>
                  {!teamsCreated && (
                    <button
                      onClick={() => removeFromRedTeam(member.id)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => !teamsCreated && setExpandedPositionModal({ memberId: member.id, team: 'red' })}
                  disabled={teamsCreated}
                  className="w-full flex items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed border border-gray-200"
                >
                  {redPositions[member.id] && redPositions[member.id].length > 0 ? (
                    <div className="flex gap-1">
                      {redPositions[member.id].map(posId => {
                        const pos = POSITIONS.find(p => p.id === posId);
                        return pos ? (
                          <img
                            key={posId}
                            src={pos.img}
                            alt={pos.name}
                            className="w-5 h-5 object-contain"
                          />
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-sm">포지션 선택</span>
                  )}
                </button>
              </div>
            ))}
            {[...Array(5 - redTeam.length)].map((_, i) => (
              <div key={`empty-red-${i}`} className="h-20 border-2 border-dashed border-red-300 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* 팀 생성 버튼 */}
      {!teamsCreated && (
        <button
          onClick={createTeams}
          disabled={blueTeam.length !== 5 || redTeam.length !== 5 || !matchName || loading}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center gap-2"
        >
          <Send className="w-6 h-6" />
          {loading ? '팀 생성 중...' : '팀 생성하기 (Discord 알림)'}
        </button>
      )}

      {/* 승패 결정 모달 */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <div className="text-center mb-6">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">승리 팀 선택</h3>
              <p className="text-gray-600">{matchName}</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => submitResult('blue')}
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg transition shadow-sm disabled:opacity-50"
              >
                블루팀 승리
              </button>
              <button
                onClick={() => submitResult('red')}
                disabled={loading}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition shadow-sm disabled:opacity-50"
              >
                레드팀 승리
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                disabled={loading}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포지션 선택 모달 */}
      {expandedPositionModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedPositionModal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              {members.find(m => m.id === expandedPositionModal.memberId)?.summoner_name} - 포지션 선택
            </h3>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {POSITIONS.map(pos => {
                const positions = expandedPositionModal.team === 'blue'
                  ? bluePositions
                  : redPositions;
                const isSelected = positions[expandedPositionModal.memberId]?.includes(pos.id);

                const isTaken = Object.entries(positions).some(
                  ([id, posArray]) =>
                    id !== String(expandedPositionModal.memberId) && posArray?.includes(pos.id)
                );

                return (
                  <button
                    key={pos.id}
                    onClick={() => {
                      if (expandedPositionModal.team === 'blue') {
                        handleBluePositionToggle(expandedPositionModal.memberId, pos.id);
                      } else {
                        handleRedPositionToggle(expandedPositionModal.memberId, pos.id);
                      }
                    }}
                    disabled={isTaken && !isSelected}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-primary-500 border-2 border-primary-600 scale-105'
                        : isTaken
                        ? 'bg-gray-200 border-2 border-gray-300 opacity-50 cursor-not-allowed'
                        : 'bg-gray-100 border-2 border-gray-200 hover:bg-gray-200 hover:scale-105'
                    }`}
                  >
                    <img
                      src={pos.img}
                      alt={pos.name}
                      className="w-12 h-12 object-contain"
                    />
                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>{pos.name}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setExpandedPositionModal(null)}
              className="w-full py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-medium transition"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomTeam;
