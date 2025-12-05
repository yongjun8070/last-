import React, { useState, useEffect } from 'react';
import { Users, Trophy, Swords, Target, Shield, Settings, Eye, EyeOff } from 'lucide-react';
import MemberManagement from './components/MemberManagement';
import TeamBalancing from './components/TeamBalancing';
import Rankings from './components/Rankings';
import MatchHistory from './components/MatchHistory';
import './App.css';
import CustomTeam from './components/CustomTeam';

const API_BASE_URL = '/api';

function App() {
  const [stealthMode, setStealthMode] = useState(() => {
    return localStorage.getItem('stealthMode') === 'true';
  });
  
  const toggleStealthMode = () => {
    const newMode = !stealthMode;
    setStealthMode(newMode);
    localStorage.setItem('stealthMode', newMode);
  };

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
    <div className={`min-h-screen text-white ${
      stealthMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-sm border-b ${
        stealthMode 
          ? 'bg-black/40 border-gray-700' 
          : 'bg-black/20 border-purple-500/30'
      }`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!stealthMode && (
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
              )}
              <div>
                <h1 className={`text-3xl font-bold ${
                  stealthMode 
                    ? 'text-gray-200' 
                    : 'bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'
                }`}>
                  {stealthMode ? 'Team Management System' : '아무무 랜드'}
                </h1>
                <p className={`text-sm ${stealthMode ? 'text-gray-400' : 'text-purple-300'}`}>
                  {stealthMode ? 'Internal Project Dashboard' : '리그 오브 레전드 내전 관리 사이트'}
                </p>
              </div>
            </div>
            
            {/* Stealth Mode Toggle */}
            <button
              onClick={toggleStealthMode}
              className={`p-3 rounded-lg transition-all ${
                stealthMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-purple-600/50 hover:bg-purple-600 text-white'
              }`}
              title={stealthMode ? '게임 모드로 전환' : '업무 모드로 전환'}
            >
              {stealthMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={`backdrop-blur-sm border-b ${
        stealthMode 
          ? 'bg-black/20 border-gray-700' 
          : 'bg-black/10 border-purple-500/20'
      }`}>
        <div className="container mx-auto px-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'members', label: stealthMode ? 'Team Members' : '멤버 관리', icon: Users },
              { id: 'balance', label: stealthMode ? 'Resource Allocation' : '팀 밸런싱', icon: Target },
              { id: 'rankings', label: stealthMode ? 'Performance' : '랭킹', icon: Trophy },
              { id: 'matches', label: stealthMode ? 'Project History' : '경기 기록', icon: Swords },
              { id: 'customTeam', label: stealthMode ? 'Custom Groups' : '커스텀 팀', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 rounded-t-lg transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? stealthMode
                        ? 'bg-gray-700/50 border-b-2 border-gray-400 text-white'
                        : 'bg-purple-600/50 border-b-2 border-purple-400 text-white'
                      : stealthMode
                        ? 'text-gray-400 hover:bg-gray-700/30 hover:text-white'
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
        {activeTab === 'customTeam' && <CustomTeam />}  
      </div>

      {/* Footer */}
      <div className={`backdrop-blur-sm border-t mt-12 ${
        stealthMode 
          ? 'bg-black/20 border-gray-700' 
          : 'bg-black/10 border-purple-500/20'
      }`}>
        <div className="container mx-auto px-4 py-6 text-center text-sm">
          <p className={stealthMode ? 'text-gray-400' : 'text-purple-300'}>
            {stealthMode ? 'Internal Management System v1.0' : 'Made with ❤️ by 아무무 랜드'}
          </p>
          {!stealthMode && <p className="mt-1 text-purple-400">"안아줘" - 아무무</p>}
        </div>
      </div>
    </div>
  );
}

export default App;
