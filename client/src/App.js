import React, { useState, useEffect } from 'react';
import { Users, Trophy, Swords, Target, Settings } from 'lucide-react';
import MemberManagement from './components/MemberManagement';
import TeamBalancing from './components/TeamBalancing';
import Rankings from './components/Rankings';
import MatchHistory from './components/MatchHistory';
import './App.css';
import CustomTeam from './components/CustomTeam';

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                아무무 랜드
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                리그 오브 레전드 내전 관리 시스템
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'members', label: '멤버 관리', icon: Users },
              { id: 'balance', label: '팀 밸런싱', icon: Target },
              { id: 'rankings', label: '랭킹', icon: Trophy },
              { id: 'matches', label: '경기 기록', icon: Swords },
              { id: 'customTeam', label: '커스텀 팀', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
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
      <div className="container mx-auto px-6 py-8">
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
        {activeTab === 'matches' && <MatchHistory matches={matches} onMatchDeleted={() => { fetchRankings(); fetchMatches(); }} />}
        {activeTab === 'customTeam' && <CustomTeam />}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-6 text-center text-sm">
          <p className="text-gray-600">
            Made with ❤️ by 아무무 랜드
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
