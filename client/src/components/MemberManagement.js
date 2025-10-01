import React, { useState } from 'react';
import { UserPlus, Plus, Zap, Users, Trash2 } from 'lucide-react';

const API_BASE_URL = '/api';

function MemberManagement({ members, onRefresh, loading, setLoading }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ summonerName: '', tagLine: '' });
  const [message, setMessage] = useState('');

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
      console.error(error);
    }
    
    setLoading(false);
  };

  const handleDeleteMember = async (memberId, summonerName) => {
    if (!window.confirm(`정말로 "${summonerName}" 멤버를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    setLoading(true);
    setMessage('');
    
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
      console.error(error);
    }
    
    setLoading(false);
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
        <h2 className="text-2xl font-bold text-white flex items-center space-x-1">
          <Users className="w-8 h-8 text-blue-400" />
          <span>멤버 관리</span>
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105"
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
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  소환사명
                </label>
                <input
                  type="text"
                  value={formData.summonerName}
                  onChange={(e) => setFormData({...formData, summonerName: e.target.value})}
	          onKeyDown={(e) => {
			    console.log('키 입력:', e.key);
			  if (e.key === 'Enter') {
				    console.log('Enter 감지!');
				  handleAddMember();
				  e.preventDefault();
		  }
	          }}
                  className="w-full px-4 py-2 bg-black/40 border border-purple-500/50 rounded-lg text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  placeholder="예: Hide on bush"
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  태그
                </label>
                <input
                  type="text"
                  value={formData.tagLine}
                  onChange={(e) => setFormData({...formData, tagLine: e.target.value})}
	          onKeyDown={(e) => {
			                            if (e.key === 'Enter') {
							    e.preventDefault();               
							    handleAddMember();
							                      }
			                    }}
                  className="w-full px-4 py-2 bg-black/40 border border-purple-500/50 rounded-lg text-white placeholder-purple-300 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
                  placeholder="예: KR1"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleAddMember}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '추가 중...' : '멤버 추가'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-600/50 hover:bg-gray-600/70 rounded-lg text-white font-medium transition-all duration-200"
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
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">레벨</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">솔로랭크</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">자유랭크</th>
                <th className="px-6 py-4 text-left text-purple-200 font-semibold">내전 기록</th>
                <th className="px-6 py-4 text-center text-purple-200 font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/20">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-purple-300">
                    등록된 멤버가 없습니다. 멤버를 추가해주세요!
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-purple-800/20 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-white">{member.summoner_name}</div>
                        <div className="text-sm text-purple-300">#{member.tag_line}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-purple-200">{member.summoner_level}</td>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${getTierColor(member.solo_tier)}`}>
                        {member.solo_tier || 'UNRANKED'} {member.solo_rank}
                      </div>
                      <div className="text-sm text-purple-300">{member.solo_lp || 0} LP</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${getTierColor(member.flex_tier)}`}>
                        {member.flex_tier || 'UNRANKED'} {member.flex_rank}
                      </div>
                      <div className="text-sm text-purple-300">{member.flex_lp || 0} LP</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        {member.wins || 0}승 {member.losses || 0}패
                      </div>
                      <div className="text-sm text-purple-300 flex items-center space-x-1">
                        <Zap className="w-3 h-3" />
                        <span>레이팅: {member.rating || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteMember(member.id, member.summoner_name)}
                        disabled={loading}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200 disabled:opacity-50 inline-flex items-center justify-center"
                        title="멤버 삭제"
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
    </div>
  );
}

export default MemberManagement;
