import React, { useState, useEffect } from 'react';
import { Users, Trophy, Swords, Target, Shield } from 'lucide-react';
import MemberManagement from './components/MemberManagement';
import TeamBalancing from './components/TeamBalancing';
import Rankings from './components/Rankings';
import MatchHistory from './components/MatchHistory';
import './App.css';

const API_BASE_URL = '/api';

function App() {
  const [activeTab, setActiveTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchRankings();
    fetchMatches();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/members`);
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchRankings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rankings`);
      const data = await response.json();
      setRankings(data);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/matches`);
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      {/* Header */}
		<div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img 
                src="/images/amumu.png" 
                alt="아무무 로고" 
                className="w-16 h-16 object-cover rounded-full border-2 border-purple-400 shadow-lg shadow-purple-500/50 hover:scale-110 hover:rotate-12 transition-all duration-300 animate-pulse"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse" style={{display: 'none'}}>
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                아무무 랜드
              </h1>
              <p className="text-purple-300 text-sm">리그 오브 레전드 내전 관리 사이트</p>
            </div>
          </div>
        </div>
      </div>		
	
	  {/* Navigation */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-purple-500/20">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'members', label: '멤버 관리', icon: Users },
              { id: 'balance', label: '팀 밸런싱', icon: Target },
              { id: 'rankings', label: '랭킹', icon: Trophy },
              { id: 'matches', label: '경기 기록', icon: Swords }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-purple-600/50 border-b-2 border-purple-400 text-white'
                      : 'text-purple-200 hover:bg-purple-700/30 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'members' && (
          <MemberManagement 
            members={members} 
            onRefresh={fetchMembers}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        {activeTab === 'balance' && (
          <TeamBalancing 
            members={members}
            onMatchComplete={() => {
              fetchRankings();
              fetchMatches();
            }}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        {activeTab === 'rankings' && <Rankings rankings={rankings} />}
        {activeTab === 'matches' && <MatchHistory matches={matches} />}
      </div>

      {/* Footer */}
      <div className="bg-black/10 backdrop-blur-sm border-t border-purple-500/20 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-purple-300 text-sm">
          <p>Made with by 아무무 랜드</p>
          <p className="mt-1 text-purple-400">"안아줘" - 아무무</p>
        </div>
      </div>
    </div>
  );
}

export default App;
