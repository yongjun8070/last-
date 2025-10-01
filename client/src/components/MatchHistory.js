import React from 'react';
import { Swords } from 'lucide-react';

function MatchHistory({ matches }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
        <Swords className="w-8 h-8 text-purple-400" />
        <span>경기 기록</span>
      </h2>
      
      {matches.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-12 text-center">
          <Swords className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
          <p className="text-purple-300 text-lg">아직 경기 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-black/30 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 hover:border-purple-400/50 transition-all duration-200">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{match.match_name || `경기 #${match.id}`}</h3>
                  <p className="text-purple-300 text-sm">
                    {new Date(match.match_date).toLocaleString('ko-KR')}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-lg font-semibold ${
                  match.winner === 'blue' 
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50' 
                    : 'bg-red-600/30 text-red-300 border border-red-500/50'
                }`}>
                  {match.winner === 'blue' ? '🔵 블루팀 승리' : '🔴 레드팀 승리'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`rounded-lg p-4 ${
                  match.winner === 'blue' 
                    ? 'bg-blue-900/30 border border-blue-500/30' 
                    : 'bg-blue-900/10 border border-blue-500/10'
                }`}>
                  <h4 className="text-lg font-bold text-blue-300 mb-2">🔵 블루팀</h4>
                  <div className="space-y-1">
                    {match.blue_team_names && match.blue_team_names.map((name, idx) => (
                      <div key={idx} className="text-blue-200">{name}</div>
                    ))}
                  </div>
 </div>
                
                <div className={`rounded-lg p-4 ${
                  match.winner === 'red' 
                    ? 'bg-red-900/30 border border-red-500/30' 
                    : 'bg-red-900/10 border border-red-500/10'
                }`}>
                  <h4 className="text-lg font-bold text-red-300 mb-2">🔴 레드팀</h4>
                  <div className="space-y-1">
                    {match.red_team_names && match.red_team_names.map((name, idx) => (
                      <div key={idx} className="text-red-200">{name}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MatchHistory;
