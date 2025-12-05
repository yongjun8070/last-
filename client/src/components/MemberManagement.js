import React, { useState } from 'react';
import { UserPlus, Plus, Users, Trash2 } from 'lucide-react';

const API_BASE_URL = '/api';

const POSITIONS = [
  { id: 'top', name: '탑', img: '/images/positions/top.png' },
  { id: 'jungle', name: '정글', img: '/images/positions/jungle.png' },
  { id: 'mid', name: '미드', img: '/images/positions/mid.png' },
  { id: 'adc', name: '원딜', img: '/images/positions/adc.png' },
  { id: 'support', name: '서폿', img: '/images/positions/support.png' }
];

function MemberManagement({ members, onRefresh, loading, setLoading }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ summonerName: '', tagLine: '' });
  const [message, setMessage] = useState('');
  const [expandedPositions, setExpandedPositions] = useState({});

  const handleAddMember = async () => {
    if (!formData.summonerName || !formData.tagLine) {
      setMessage('❌ 닉네임과 태그를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage('✅ 멤버가 성공적으로 추가되었습니다!');
        setFormData({ summonerName: '', tagLine: '' });
        setShowAddForm(false);
        onRefresh();
      } else {
        setMessage('❌ ' + (data.error || '멤버 추가에 실패했습니다.'));
      }
    } catch (error) {
      setMessage('❌ 서버 오류가 발생했습니다.');
    }
    
    setLoading(false);
  };

  const handleDeleteMember = async (memberId, summonerName) => {
    if (!window.confirm(`정말로 "${summonerName}" 멤버를 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage(`✅ ${data.message}`);
        onRefresh();
      } else {
        setMessage('❌ ' + (data.error || '멤버 삭제에 실패했습니다.'));
      }
    } catch (error) {
      setMessage('❌ 서버 오류가 발생했습니다.');
    }
    
    setLoading(false);
  };

  const handlePositionToggle = async (memberId, positionId) => {
    const member = members.find(m => m.id === memberId);
    const currentPositions = member.preferred_positions || [];
    
    let newPositions;
    if (currentPositions.includes(positionId)) {
      newPositions = currentPositions.filter(p => p !== positionId);
    } else {
      newPositions = [...currentPositions, positionId];
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/members/${memberId}/positions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: newPositions })
      });
      
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('포지션 업데이트 실패:', error);
    }
  };

  const handleAvoidedPositionToggle = async (memberId, positionId) => {
    const member = members.find(m => m.id === memberId);
    const currentAvoided = member.avoided_positions || [];
    
    let newAvoided;
    if (currentAvoided.includes(positionId)) {
      newAvoided = [];
    } else {
      newAvoided = [positionId];
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/members/${memberId}/avoided-positions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: newAvoided })
      });
      
      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('회피 포지션 업데이트 실패:', error);
    }
  };

  const togglePositionDropdown = (memberId) => {
    setExpandedPositions(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const getTierColor = (tier) => {
    const colors = {
      'CHALLENGER': 'text-yellow-300',
      'GRANDMASTER': 'text-red-400',
      'MASTER': 'text-purple-400',
      'DIAMOND': 'text-blue-400',
      'EMERALD': 'text-green-400',
      'PLATINUM': 'text-teal-400',
      'GOLD': 'text-yellow-500',
      'SILVER': 'text-gray-400',
      'BRONZE': 'text-orange-600',
      'IRON': 'text-gray-600',
      'UNRANKED': 'text-gray-500'
    };
    return colors[tier] || 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Users className="w-8 h-8 text-blue-400" />
          <span>멤버 관리</span>
          <span className="ml-4 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-sm">
            총 {members.length}명
          </span>
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 rounded-lg transition-all"
        >
          <UserPlus className="w-5 h-5" />
          <span>멤버 추가</span>
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('✅') ? 'bg-green-600/20 border border-green-500/30 text-green-300' : 'bg-red-600/20 border border-red-500/30 text-red-300'}`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
          <h3 className="text-xl font-bold mb-4 text-white flex items-center space-x-2">
            <Plus className="w-6 h-6" />
            <span>새 멤버 추가</span>
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">소환사명</label>
                <input
                  type="text"
                  value={formData.summonerName}
                  onChange={(e) => setFormData({...formData, summonerName: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  className="w-full px-4 py-2 bg-black/40 border border-purple-500/50 rounded-lg text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none"
                  placeholder="예: Hide on bush"
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">태그</label>
                <input
                  type="text"
                  value={formData.tagLine}
                  onChange={(e) => setFormData({...formData, tagLine: e.target.value})}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  className="w-full px-4 py-2 bg-black/40 border border-purple-500/50 rounded-lg text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none"
                  placeholder="예: KR1"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleAddMember}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              >
                {loading ? '추가 중...' : '멤버 추가'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg text-white font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-purple-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">소환사명</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">선호 포지션</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">회피 포지션</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">레벨</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">솔로랭크</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">내전 기록</th>
                <th className="px-6 py-4 text-center text-purple-200 font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/20">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-purple-300">
                    등록된 멤버가 없습니다. 멤버를 추가해주세요!
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-purple-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{member.summoner_name}</div>
                      <div className="text-sm text-purple-300">#{member.tag_line}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePositionDropdown(member.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-900/20 hover:bg-green-900/30 rounded-lg transition-all border border-green-500/30"
                      >
                        {member.preferred_positions?.length > 0 ? (
                          <div className="flex gap-1">
                            {member.preferred_positions.map(posId => {
                              const pos = POSITIONS.find(p => p.id === posId);
                              return pos ? (
                                <img key={posId} src={pos.img} alt={pos.name} className="w-5 h-5" />
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <span className="text-green-300 text-sm">선택</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePositionDropdown(member.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-900/20 hover:bg-red-900/30 rounded-lg transition-all border border-red-500/30"
                      >
                        {member.avoided_positions?.length > 0 ? (
                          <div className="flex gap-1">
                            {member.avoided_positions.map(posId => {
                              const pos = POSITIONS.find(p => p.id === posId);
                              return pos ? (
                                <img key={posId} src={pos.img} alt={pos.name} className="w-5 h-5" />
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <span className="text-red-300 text-sm">선택</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-purple-200">{member.summoner_level}</td>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${getTierColor(member.solo_tier)}`}>
                        {member.solo_tier || 'UNRANKED'} {member.solo_rank}
                      </div>
                      <div className="text-sm text-purple-300">{member.solo_lp || 0} LP</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{member.wins || 0}승 {member.losses || 0}패</div>
                      <div className="text-sm text-purple-300">레이팅: {member.rating || 0}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteMember(member.id, member.summoner_name)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 포지션 선택 모달 */}
      {Object.keys(expandedPositions).map(memberId => 
        expandedPositions[memberId] && (
          <div 
            key={memberId}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setExpandedPositions({})}
          >
            <div 
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500 rounded-2xl p-6 max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-6 text-center">
                {members.find(m => m.id === parseInt(memberId))?.summoner_name} - 포지션 설정
              </h3>
              
              <div className="mb-6">
                <h4 className="text-green-400 font-bold mb-3">✅ 선호 포지션 (여러 개 선택 가능)</h4>
                <div className="grid grid-cols-5 gap-3">
                  {POSITIONS.map(pos => {
                    const member = members.find(m => m.id === parseInt(memberId));
                    const isSelected = member?.preferred_positions?.includes(pos.id);
                    return (
                      <button
                        key={pos.id}
                        onClick={() => handlePositionToggle(parseInt(memberId), pos.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                          isSelected ? 'bg-green-600 border-2 border-green-400 scale-110' : 'bg-black/40 border-2 border-transparent hover:bg-green-900/30'
                        }`}
                      >
                        <img src={pos.img} alt={pos.name} className="w-12 h-12" />
                        <span className="text-white text-xs">{pos.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-red-400 font-bold mb-3">❌ 회피 포지션 (1개만 선택 가능)</h4>
                <div className="grid grid-cols-5 gap-3">
                  {POSITIONS.map(pos => {
                    const member = members.find(m => m.id === parseInt(memberId));
                    const isAvoided = member?.avoided_positions?.includes(pos.id);
                    return (
                      <button
                        key={pos.id}
                        onClick={() => handleAvoidedPositionToggle(parseInt(memberId), pos.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                          isAvoided ? 'bg-red-600 border-2 border-red-400 scale-110' : 'bg-black/40 border-2 border-transparent hover:bg-red-900/30'
                        }`}
                      >
                        <img src={pos.img} alt={pos.name} className="w-12 h-12" />
                        <span className="text-white text-xs">{pos.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <button
                onClick={() => setExpandedPositions({})}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                닫기
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default MemberManagement;
