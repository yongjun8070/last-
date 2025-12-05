require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const path = require('path');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
}

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'amumu_land',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

pool.connect((err, client, done) => {
  if (err) {
    console.error('❌ 데이터베이스 연결 실패:', err);
  } else {
    console.log('✅ PostgreSQL 데이터베이스 연결 성공');
    done();
  }
});
// Discord 봇 설정
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

app.get('/api/test-discord', async (req, res) => {
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('테스트 메시지')
    .setDescription('Discord 봇이 정상 작동 중입니다!')
    .setTimestamp();
  
  await sendDiscordMessage(embed);
  res.json({ message: 'Discord 메시지 전송 시도' });
});

// Discord 봇 로그인
if (DISCORD_BOT_TOKEN) {
  discordClient.login(DISCORD_BOT_TOKEN).catch(err => {
    console.error('❌ Discord 봇 로그인 실패:', err.message);
  });

  discordClient.once('ready', () => {
    console.log(`✅ Discord 봇 로그인 성공: ${discordClient.user.tag}`);
  });
} else {
  console.warn('⚠️ Discord 봇 토큰이 설정되지 않았습니다.');
}

// Discord 명령어 핸들러
discordClient.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  
  const content = message.content.trim();
  console.log(`📨 메시지 수신: ${content}`);
  
  if (content === '/테스트') {
    await message.reply('✅ 봇이 작동 중입니다!');
  }
});
// Discord 메시지 전송 함수
async function sendDiscordMessage(embed) {
  if (!DISCORD_CHANNEL_ID || !discordClient.isReady()) {
    console.log('Discord 봇이 준비되지 않았거나 채널 ID가 없습니다.');
    return;
  }
  
  try {
    const channel = await discordClient.channels.fetch(DISCORD_CHANNEL_ID);
    if (!channel) {
      console.error('❌ Discord 채널을 찾을 수 없습니다.');
      return;
    }
    await channel.send({ embeds: [embed] });
    console.log('✅ Discord 메시지 전송 완료');
  } catch (error) {
    console.error('❌ Discord 메시지 전송 실패:', error.message);
  }
}

// 포지션 한글 매핑
const POSITION_KOREAN = {
  'top': '탑',
  'jungle': '정글',
  'mid': '미드',
  'adc': '원딜',
  'support': '서포터'
};

// 팀 밸런싱 결과 Discord 전송
async function sendBalanceResult(balance) {
  const embed = new EmbedBuilder()
    .setColor('#9333EA')
    .setTitle('🎮 팀 밸런싱 완료!')
    .setDescription('5vs5 내전 팀이 구성되었습니다.')
    .addFields(
      {
        name: '🔵 블루팀',
        value: balance.blueTeam.map(m => 
          `**${m.summoner_name}** - ${POSITION_KOREAN[m.position]} (${m.finalScore}점)`
        ).join('\n'),
        inline: true
      },
      {
        name: '🔴 레드팀',
        value: balance.redTeam.map(m => 
          `**${m.summoner_name}** - ${POSITION_KOREAN[m.position]} (${m.finalScore}점)`
        ).join('\n'),
        inline: true
      },
      {
        name: '⚖️ 밸런스',
        value: `블루팀: ${balance.blueScore}점\n레드팀: ${balance.redScore}점\n점수차: ${balance.scoreDifference}점`,
        inline: false
      }
    )
    .setTimestamp()
    .setFooter({ text: '아무무 랜드 내전 시스템' });

  await sendDiscordMessage(embed);
}

// 경기 결과 Discord 전송
async function sendMatchResult(matchData) {
  const winnerColor = matchData.winner === 'blue' ? '🔵' : '🔴';
  const winnerName = matchData.winner === 'blue' ? '블루팀' : '레드팀';
  
  const embed = new EmbedBuilder()
    .setColor(matchData.winner === 'blue' ? '#3B82F6' : '#EF4444')
    .setTitle(`${winnerColor} ${winnerName} 승리!`)
    .setDescription(`${matchData.matchName} 경기 결과가 저장되었습니다.`)
    .addFields(
      {
        name: '🔵 블루팀',
        value: matchData.blueTeam.map(m => 
          `**${m.summoner_name}** - ${POSITION_KOREAN[m.position]}`
        ).join('\n'),
        inline: true
      },
      {
        name: '🔴 레드팀',
        value: matchData.redTeam.map(m => 
          `**${m.summoner_name}** - ${POSITION_KOREAN[m.position]}`
        ).join('\n'),
        inline: true
      }
    )
    .setTimestamp()
    .setFooter({ text: '아무무 랜드 내전 시스템' });

  await sendDiscordMessage(embed);
}

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const RIOT_API_BASE_URL = 'https://kr.api.riotgames.com';
const RIOT_ASIA_URL = 'https://asia.api.riotgames.com';

console.log('🔑 Riot API Key:', RIOT_API_KEY ? 'API 키가 설정되었습니다' : '❌ API 키가 설정되지 않았습니다');

async function getSummonerByRiotId(gameName, tagLine) {
  try {
    console.log(`🔍 소환사 검색 중: ${gameName}#${tagLine}`);
    const response = await axios.get(
      `${RIOT_ASIA_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { 
        headers: { 'X-Riot-Token': RIOT_API_KEY },
        timeout: 10000
      }
    );
    console.log('✅ 계정 정보 조회 성공');
    return response.data;
  } catch (error) {
    console.error('❌ 계정 정보 조회 실패:', error.response?.data || error.message);
    throw new Error('소환사를 찾을 수 없습니다. 닉네임과 태그를 확인해주세요.');
  }
}

async function getSummonerByPuuid(puuid) {
  try {
    console.log('🔍 소환사 상세 정보 조회 중...');
    const response = await axios.get(
      `${RIOT_API_BASE_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { 
        headers: { 'X-Riot-Token': RIOT_API_KEY },
        timeout: 10000
      }
    );
    console.log('✅ 소환사 상세 정보 조회 성공');
    return response.data;
  } catch (error) {
    console.error('❌ 소환사 정보 조회 실패:', error.response?.data || error.message);
    throw new Error('소환사 정보를 가져올 수 없습니다.');
  }
}

async function getRankedStats(encryptedPUUID) {
  try {
    console.log('🏆 랭크 정보 조회 중...');
    const response = await axios.get(
      `${RIOT_API_BASE_URL}/lol/league/v4/entries/by-puuid/${encryptedPUUID}`,
      { 
        headers: { 'X-Riot-Token': RIOT_API_KEY },
        timeout: 10000
      }
    );
    console.log(`✅ 랭크 정보 조회 성공: ${response.data.length}개 큐 정보`);
    return response.data;
  } catch (error) {
    console.error('❌ 랭크 정보 조회 실패:', error.response?.data || error.message);
    return [];
  }
}

function calculateTierScore(tier, rank, lp) {
  const tierScores = {
    'UNRANKED': 0,
    'IRON': 100,
    'BRONZE': 500,
    'SILVER': 900,
    'GOLD': 1300,
    'PLATINUM': 1700,
    'EMERALD': 2100,
    'DIAMOND': 2500,
    'MASTER': 2900,
    'GRANDMASTER': 3200,
    'CHALLENGER': 3500
  };
  
  const rankScores = { 'IV': 0, 'III': 100, 'II': 200, 'I': 300 };
  
  let baseScore = tierScores[tier] || 0;
  if (tier && tier !== 'MASTER' && tier !== 'GRANDMASTER' && tier !== 'CHALLENGER') {
    baseScore += rankScores[rank] || 0;
  }
  
  return baseScore + (lp || 0);
}

function calculateTeamScore(team, positions) {
  let totalScore = 0;
  
  team.forEach((member, idx) => {
    let memberScore = member.finalScore;
    const assignedPos = positions[idx];
    
    if (member.preferred_positions && member.preferred_positions.includes(assignedPos)) {
      memberScore *= 1.05;
    } else if (member.avoided_positions && member.avoided_positions.includes(assignedPos)) {
      memberScore *= 0.9;
    }
    
    totalScore += memberScore;
  });
  
  return Math.round(totalScore);
}

function assignPositionsAdvanced(team, positions) {
  const assigned = new Array(5).fill(null);
  const positionMap = positions.map(() => []);
  
  team.forEach((member, idx) => {
    positions.forEach((pos, posIdx) => {
      const prefScore = member.preferred_positions?.includes(pos) ? 2 : 
                       member.avoided_positions?.includes(pos) ? -1 : 
                       (!member.preferred_positions && !member.avoided_positions) ? 1 : 0;
      
      if (prefScore >= 0) {
        positionMap[posIdx].push({ memberIdx: idx, score: prefScore });
      }
    });
  });
  
  positionMap.forEach((candidates) => {
    candidates.sort((a, b) => b.score - a.score);
  });
  
  const sortedPositions = positionMap
    .map((candidates, idx) => ({ posIdx: idx, count: candidates.length }))
    .sort((a, b) => a.count - b.count);
  
  sortedPositions.forEach(({ posIdx }) => {
    const pos = positions[posIdx];
    const candidates = positionMap[posIdx].filter(c => assigned[c.memberIdx] === null);
    
    if (candidates.length > 0) {
      const best = candidates[0];
      assigned[best.memberIdx] = pos;
    }
  });
  
  team.forEach((member, idx) => {
    if (assigned[idx] === null) {
      const remaining = positions.filter(p => !assigned.includes(p));
      if (remaining.length > 0) {
        let bestPos = remaining.find(p => !member.avoided_positions?.includes(p));
        if (!bestPos) bestPos = remaining[0];
        assigned[idx] = bestPos;
      }
    }
  });
  
  return assigned;
}

function findBestBalance(members) {
  const positions = ['top', 'jungle', 'mid', 'adc', 'support'];
  const posOrder = { 'top': 0, 'jungle': 1, 'mid': 2, 'adc': 3, 'support': 4 };
  let bestDifference = Infinity;
  let bestResult = null;
  
  for (let attempt = 0; attempt < 1000; attempt++) {
    const shuffled = [...members].sort(() => Math.random() - 0.5);
    const blueTeam = shuffled.slice(0, 5);
    const redTeam = shuffled.slice(5, 10);
    
    const bluePositions = assignPositionsAdvanced(blueTeam, positions);
    const redPositions = assignPositionsAdvanced(redTeam, positions);
    
    const blueScore = calculateTeamScore(blueTeam, bluePositions);
    const redScore = calculateTeamScore(redTeam, redPositions);
    const difference = Math.abs(blueScore - redScore);
    
    if (difference < bestDifference) {
      bestDifference = difference;
      
      // 팀 데이터 생성하면서 포지션 정보 함께 저장
      const blueTeamData = blueTeam.map((member, idx) => ({
        id: member.id,
        summoner_name: member.summoner_name,
        position: bluePositions[idx],
        finalScore: member.finalScore,
        solo_tier: member.solo_tier,
        solo_rank: member.solo_rank,
        solo_lp: member.solo_lp,
        internal_rating: member.internal_rating,
        recentForm: member.recentForm,
        total_matches: member.total_matches,
        preferred_positions: member.preferred_positions,
        avoided_positions: member.avoided_positions
      }));
      
      const redTeamData = redTeam.map((member, idx) => ({
        id: member.id,
        summoner_name: member.summoner_name,
        position: redPositions[idx],
        finalScore: member.finalScore,
        solo_tier: member.solo_tier,
        solo_rank: member.solo_rank,
        solo_lp: member.solo_lp,
        internal_rating: member.internal_rating,
        recentForm: member.recentForm,
        total_matches: member.total_matches,
        preferred_positions: member.preferred_positions,
        avoided_positions: member.avoided_positions
      }));
      
      // 포지션 순서대로 정렬 (중요!)
      blueTeamData.sort((a, b) => {
        const orderA = posOrder[a.position] !== undefined ? posOrder[a.position] : 999;
        const orderB = posOrder[b.position] !== undefined ? posOrder[b.position] : 999;
        return orderA - orderB;
      });
      
      redTeamData.sort((a, b) => {
        const orderA = posOrder[a.position] !== undefined ? posOrder[a.position] : 999;
        const orderB = posOrder[b.position] !== undefined ? posOrder[b.position] : 999;
        return orderA - orderB;
      });
      
      bestResult = {
        blueTeam: blueTeamData,
        redTeam: redTeamData,
        blueScore,
        redScore,
        scoreDifference: difference
      };
    }
    
    if (difference < 50) break;
  }
  
  return bestResult;
}

app.get('/', (req, res) => {
  res.json({ 
    message: '🎮 아무무 랜드 API 서버가 실행 중입니다!',
    status: 'running',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      api_key: RIOT_API_KEY ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/members', async (req, res) => {
  const { summonerName, tagLine } = req.body;
  
  console.log(`🔍 새 멤버 추가 요청: ${summonerName}#${tagLine}`);
  
  if (!summonerName || !tagLine) {
    return res.status(400).json({ error: '소환사명과 태그를 모두 입력해주세요.' });
  }

  if (!RIOT_API_KEY) {
    return res.status(500).json({ error: 'Riot API 키가 설정되지 않았습니다.' });
  }
  
  try {
    const riotAccount = await getSummonerByRiotId(summonerName.trim(), tagLine.trim());
    const summoner = await getSummonerByPuuid(riotAccount.puuid);
    const rankedStats = await getRankedStats(riotAccount.puuid);
    
    const existingMember = await pool.query('SELECT id FROM members WHERE puuid = $1', [riotAccount.puuid]);
    if (existingMember.rows.length > 0) {
      console.log('⚠️ 이미 등록된 멤버');
      return res.status(400).json({ error: '이미 등록된 멤버입니다.' });
    }
    
    console.log('💾 멤버 데이터베이스에 저장 중...');
    const memberResult = await pool.query(
      `INSERT INTO members (summoner_name, tag_line, puuid, summoner_id, profile_icon_id, summoner_level) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [riotAccount.gameName, riotAccount.tagLine, riotAccount.puuid, riotAccount.puuid, summoner.profileIconId, summoner.summonerLevel]
    );
    
    const memberId = memberResult.rows[0].id;
    
    console.log(`💾 랭크 정보 저장 중... (${rankedStats.length}개)`);
    for (const rank of rankedStats) {
      await pool.query(
        `INSERT INTO member_ranks (member_id, queue_type, tier, rank_level, league_points, wins, losses)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [memberId, rank.queueType, rank.tier, rank.rank, rank.leaguePoints, rank.wins, rank.losses]
      );
    }
    
    await pool.query(
      'INSERT INTO member_rankings (member_id, rating) VALUES ($1, $2)',
      [memberId, 0]
    );
    
    console.log('✅ 멤버 추가 완료');
    res.json({ 
      success: true, 
      member: memberResult.rows[0],
      message: `${riotAccount.gameName}#${riotAccount.tagLine} 멤버가 성공적으로 추가되었습니다!`
    });
  } catch (error) {
    console.error('❌ 멤버 추가 실패:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    console.log('📋 멤버 목록 조회 중...');
    const result = await pool.query(`
      SELECT m.*, 
             mr.tier as solo_tier, mr.rank_level as solo_rank, mr.league_points as solo_lp,
             mr2.tier as flex_tier, mr2.rank_level as flex_rank, mr2.league_points as flex_lp,
             COALESCE(ranking.rating, 0) as rating, 
             COALESCE(ranking.wins, 0) as wins, 
             COALESCE(ranking.losses, 0) as losses, 
             COALESCE(ranking.total_matches, 0) as total_matches
      FROM members m
      LEFT JOIN member_ranks mr ON m.id = mr.member_id AND mr.queue_type = 'RANKED_SOLO_5x5'
      LEFT JOIN member_ranks mr2 ON m.id = mr2.member_id AND mr2.queue_type = 'RANKED_FLEX_SR'
      LEFT JOIN member_rankings ranking ON m.id = ranking.member_id
      ORDER BY m.created_at DESC
    `);
    
    console.log(`✅ 멤버 목록 조회 완료: ${result.rows.length}명`);
    res.json(result.rows);
  } catch (error) {
    console.error('❌ 멤버 목록 조회 실패:', error);
    res.status(500).json({ error: '멤버 목록을 가져오는데 실패했습니다.' });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  
  console.log(`🗑️ 멤버 삭제 요청: ID ${id}`);
  
  try {
    const memberCheck = await pool.query('SELECT summoner_name FROM members WHERE id = $1', [id]);
    
    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: '멤버를 찾을 수 없습니다.' });
    }
    
    const summonerName = memberCheck.rows[0].summoner_name;
    await pool.query('DELETE FROM members WHERE id = $1', [id]);
    
    console.log(`✅ 멤버 삭제 완료: ${summonerName} (ID: ${id})`);
    
    res.json({ 
      success: true, 
      message: `${summonerName} 멤버가 삭제되었습니다.` 
    });
    
  } catch (error) {
    console.error('❌ 멤버 삭제 실패:', error);
    res.status(500).json({ error: '멤버 삭제에 실패했습니다.' });
  }
});

app.put('/api/members/:id/positions', async (req, res) => {
  const { id } = req.params;
  const { positions } = req.body;
  
  console.log(`🎯 선호 포지션 업데이트: Member ${id}`, positions);
  
  try {
    await pool.query(
      'UPDATE members SET preferred_positions = $1 WHERE id = $2',
      [positions, id]
    );
    
    console.log('✅ 선호 포지션 업데이트 완료');
    res.json({ success: true, message: '선호 포지션이 업데이트되었습니다.' });
  } catch (error) {
    console.error('❌ 선호 포지션 업데이트 실패:', error);
    res.status(500).json({ error: '선호 포지션 업데이트에 실패했습니다.' });
  }
});

app.put('/api/members/:id/avoided-positions', async (req, res) => {
  const { id } = req.params;
  const { positions } = req.body;
  
  console.log(`❌ 회피 포지션 업데이트: Member ${id}`, positions);
  
  try {
    await pool.query(
      'UPDATE members SET avoided_positions = $1 WHERE id = $2',
      [positions, id]
    );
    
    console.log('✅ 회피 포지션 업데이트 완료');
    res.json({ success: true, message: '회피 포지션이 업데이트되었습니다.' });
  } catch (error) {
    console.error('❌ 회피 포지션 업데이트 실패:', error);
    res.status(500).json({ error: '회피 포지션 업데이트에 실패했습니다.' });
  }
});

app.put('/api/members/:id/refresh', async (req, res) => {
  const { id } = req.params;
  
  console.log(`🔄 멤버 ${id} 랭크 정보 갱신 중...`);
  
  try {
    const member = await pool.query('SELECT * FROM members WHERE id = $1', [id]);
    
    if (member.rows.length === 0) {
      return res.status(404).json({ error: '멤버를 찾을 수 없습니다.' });
    }
    
    const rankedStats = await getRankedStats(member.rows[0].puuid);
    
    await pool.query('DELETE FROM member_ranks WHERE member_id = $1', [id]);
    
    for (const rank of rankedStats) {
      await pool.query(
        `INSERT INTO member_ranks (member_id, queue_type, tier, rank_level, league_points, wins, losses)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, rank.queueType, rank.tier, rank.rank, rank.leaguePoints, rank.wins, rank.losses]
      );
    }
    
    console.log(`✅ 랭크 정보 갱신 완료: ${rankedStats.length}개`);
    res.json({ success: true, message: '랭크 정보가 갱신되었습니다.', count: rankedStats.length });
    
  } catch (error) {
    console.error('❌ 랭크 정보 갱신 실패:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matches/balance-teams', async (req, res) => {
  const { memberIds } = req.body;
  
  console.log(`⚖️ 고급 팀 밸런싱 요청: ${memberIds.length}명`);
  
  if (memberIds.length !== 10) {
    return res.status(400).json({ error: '정확히 10명의 멤버를 선택해주세요.' });
  }
  
  try {
    const membersResult = await pool.query(`
      SELECT 
        m.id, 
        m.summoner_name,
        m.preferred_positions,
        m.avoided_positions,
        COALESCE(mr.tier, 'UNRANKED') as solo_tier,
        COALESCE(mr.rank_level, 'IV') as solo_rank,
        COALESCE(mr.league_points, 0) as solo_lp,
        COALESCE(ranking.rating, 0) as internal_rating,
        COALESCE(ranking.wins, 0) as wins,
        COALESCE(ranking.losses, 0) as losses,
        COALESCE(ranking.total_matches, 0) as total_matches
      FROM members m
      LEFT JOIN member_ranks mr ON m.id = mr.member_id AND mr.queue_type = 'RANKED_SOLO_5x5'
      LEFT JOIN member_rankings ranking ON m.id = ranking.member_id
      WHERE m.id = ANY($1)
    `, [memberIds]);
    
    const members = membersResult.rows;
    
    for (const member of members) {
      const recentMatches = await pool.query(`
        SELECT winner, blue_team_members, red_team_members
        FROM matches
        WHERE $1 = ANY(blue_team_members) OR $1 = ANY(red_team_members)
        ORDER BY match_date DESC
        LIMIT 5
      `, [member.id]);
      
      let recentWins = 0;
      recentMatches.rows.forEach(match => {
        const isBlue = match.blue_team_members.includes(member.id);
        const won = (isBlue && match.winner === 'blue') || (!isBlue && match.winner === 'red');
        if (won) recentWins++;
      });
      
      member.recentForm = recentMatches.rows.length > 0 ? (recentWins / recentMatches.rows.length) * 100 : 50;
    }
    
    members.forEach(member => {
      const soloScore = calculateTierScore(member.solo_tier, member.solo_rank, member.solo_lp);
      const internalScore = member.internal_rating;
      const formBonus = (member.recentForm - 50) * 2;
      
      let soloWeight, internalWeight;
      if (member.total_matches < 10) {
        soloWeight = 0.8;
        internalWeight = 0.2;
      } else if (member.total_matches < 30) {
        soloWeight = 0.5;
        internalWeight = 0.5;
      } else {
        soloWeight = 0.3;
        internalWeight = 0.7;
      }
      
      member.finalScore = Math.round(
        soloScore * soloWeight + 
        internalScore * internalWeight + 
        formBonus
      );
      
      console.log(`${member.summoner_name}: 솔로=${soloScore}, 내전=${internalScore}, 폼=${member.recentForm.toFixed(1)}%, 최종=${member.finalScore}`);
    });
    
    const bestBalance = findBestBalance(members);
    
    console.log(`✅ 최적 밸런싱 완료 - 블루: ${bestBalance.blueScore}점, 레드: ${bestBalance.redScore}점, 차이: ${bestBalance.scoreDifference}점`);
    
    console.log('\n🔵 블루팀:');
    bestBalance.blueTeam.forEach(member => {
      console.log(`  ${member.summoner_name} - ${member.position} - 점수: ${member.finalScore}`);
    });
    
    console.log('\n🔴 레드팀:');
    bestBalance.redTeam.forEach(member => {
      console.log(`  ${member.summoner_name} - ${member.position} - 점수: ${member.finalScore}`);
    });
    console.log('');
    await sendBalanceResult(bestBalance); 
    res.json(bestBalance);
    
  } catch (error) {
    console.error('❌ 팀 밸런싱 실패:', error);
    res.status(500).json({ error: '팀 밸런싱에 실패했습니다.' });
  }
});

app.post('/api/matches/result', async (req, res) => {
  const { matchName, blueTeam, redTeam, winner } = req.body;
  
  console.log(`🏆 경기 결과 저장: ${winner} 팀 승리`);
  
  if (!blueTeam || !redTeam || !winner) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }
  
  if (winner !== 'blue' && winner !== 'red') {
    return res.status(400).json({ error: '승리 팀을 선택해주세요.' });
  }
  
  try {
    const matchResult = await pool.query(
      `INSERT INTO matches (match_name, blue_team_members, red_team_members, blue_team_positions, red_team_positions, winner, match_date) 
       VALUES ($1, $2, $3, $4, $5, $6, DEFAULT) RETURNING *`,
      [
	matchName || '내전',
        blueTeam.map(m => m.id),
        redTeam.map(m => m.id),
        blueTeam.map(m => m.position),
        redTeam.map(m => m.position),
        winner
      ]
    );
    
    const allMembers = [...blueTeam, ...redTeam];
    
    for (const member of allMembers) {
      const isWinner = (winner === 'blue' && blueTeam.includes(member)) || 
                      (winner === 'red' && redTeam.includes(member));
      const ratingChange = isWinner ? 10 : -7;
      
      await pool.query(`
        UPDATE member_rankings 
        SET rating = rating + $1,
            wins = wins + $2,
            losses = losses + $3,
            total_matches = total_matches + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE member_id = $4
      `, [ratingChange, isWinner ? 1 : 0, isWinner ? 0 : 1, member.id]);
    }
    await sendMatchResult({
    blueTeam: blueTeam,
    redTeam: redTeam,
    winner: winner,
    matchName: matchName
    });
    
    console.log('✅ 내전 결과 저장 완료');
    res.json({ 
      success: true, 
      match: matchResult.rows[0],
      message: '경기 결과가 성공적으로 저장되었습니다!'
    });
    
  } catch (error) {
    console.error('❌ 경기 결과 저장 실패:', error);
    res.status(500).json({ error: '경기 결과 저장에 실패했습니다.' });
  }
});
app.post('/api/matches/custom-teams', async (req, res) => {
  const { matchName, blueTeam, redTeam, blueTeamPositions, redTeamPositions } = req.body;
  
  console.log(`🎯 커스텀팀 생성: ${matchName}`);
  
  if (!matchName || !blueTeam || !redTeam || !blueTeamPositions || !redTeamPositions) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }
  
  if (blueTeam.length !== 5 || redTeam.length !== 5) {
    return res.status(400).json({ error: '각 팀은 정확히 5명이어야 합니다.' });
  }
  
  try {
    const membersResult = await pool.query(
      `SELECT id, summoner_name FROM members WHERE id = ANY($1)`,
      [[...blueTeam, ...redTeam]]
    );

    const membersMap = {};
    membersResult.rows.forEach(m => {
      membersMap[m.id] = m;
    });

    const blueTeamData = blueTeam.map((id, idx) => ({
      summoner_name: membersMap[id].summoner_name,
      position: blueTeamPositions[idx]
    }));

    const redTeamData = redTeam.map((id, idx) => ({
      summoner_name: membersMap[id].summoner_name,
      position: redTeamPositions[idx]
    }));

    const embed = new EmbedBuilder()
      .setColor('#9333EA')
      .setTitle('🎮 커스텀 팀 생성!')
      .setDescription(`**${matchName}** 팀이 구성되었습니다.`)
      .addFields(
        {
          name: '🔵 블루팀',
          value: blueTeamData.map(m => 
            `**${m.summoner_name}** - ${POSITION_KOREAN[m.position]}`
          ).join('\n'),
          inline: true
        },
        {
          name: '🔴 레드팀',
          value: redTeamData.map(m => 
            `**${m.summoner_name}** - ${POSITION_KOREAN[m.position]}`
          ).join('\n'),
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ text: '아무무 랜드 내전 시스템' });

    await sendDiscordMessage(embed);
    
    console.log('✅ 커스텀팀 생성 완료 및 Discord 알림');
    res.json({
      success: true,
      message: '팀이 생성되었습니다! Discord를 확인하세요.',
      blueTeam: blueTeamData,
      redTeam: redTeamData
    });
    
  } catch (error) {
    console.error('❌ 커스텀팀 생성 실패:', error);
    res.status(500).json({ error: '팀 생성에 실패했습니다.' });
  }
});

app.delete('/api/matches/:id', async (req, res) => {
  const { id } = req.params;
  
  console.log(`🗑️ 매치 삭제 요청: ID ${id}`);
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 매치 정보 조회
      const matchResult = await client.query(
        'SELECT * FROM matches WHERE id = $1',
        [id]
      );
      
      if (matchResult.rows.length === 0) {
        return res.status(404).json({ error: '매치를 찾을 수 없습니다.' });
      }
      
      const match = matchResult.rows[0];
      
      // 블루팀 레이팅 복구
      for (const memberId of match.blue_team_members) {
        const isWinner = match.winner === 'blue';
        const ratingChange = isWinner ? -10 : 7; // 반대로 적용
        const winsChange = isWinner ? -1 : 0;
        const lossesChange = isWinner ? 0 : -1;
        
        await client.query(`
          UPDATE member_rankings 
          SET rating = rating + $1,
              wins = GREATEST(0, wins + $2),
              losses = GREATEST(0, losses + $3),
              total_matches = GREATEST(0, total_matches - 1)
          WHERE member_id = $4
        `, [ratingChange, winsChange, lossesChange, memberId]);
      }
      
      // 레드팀 레이팅 복구
      for (const memberId of match.red_team_members) {
        const isWinner = match.winner === 'red';
        const ratingChange = isWinner ? -10 : 7;
        const winsChange = isWinner ? -1 : 0;
        const lossesChange = isWinner ? 0 : -1;
        
        await client.query(`
          UPDATE member_rankings 
          SET rating = rating + $1,
              wins = GREATEST(0, wins + $2),
              losses = GREATEST(0, losses + $3),
              total_matches = GREATEST(0, total_matches - 1)
          WHERE member_id = $4
        `, [ratingChange, winsChange, lossesChange, memberId]);
      }
      
      // 매치 삭제
      await client.query('DELETE FROM matches WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      console.log(`✅ 매치 삭제 완료: ${match.match_name || `경기 #${id}`}`);
      
      res.json({ 
        success: true, 
        message: `${match.match_name || `경기 #${id}`}가 삭제되었습니다.` 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ 매치 삭제 실패:', error);
    res.status(500).json({ error: '매치 삭제에 실패했습니다.' });
  }
});


app.post('/api/matches/custom-result', async (req, res) => {
  const { matchName, blueTeam, redTeam, blueTeamPositions, redTeamPositions, winningTeam } = req.body;
  
  console.log(`🏆 커스텀 팀 경기: ${matchName}, ${winningTeam} 팀 승리`);
  console.log('포지션:', { blueTeamPositions, redTeamPositions });
  
  if (!matchName || !blueTeam || !redTeam || !winningTeam) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }
  
  if (blueTeam.length !== 5 || redTeam.length !== 5) {
    return res.status(400).json({ error: '각 팀은 정확히 5명이어야 합니다.' });
  }
  
  if (winningTeam !== 'blue' && winningTeam !== 'red') {
    return res.status(400).json({ error: '승리 팀을 선택해주세요.' });
  }
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const matchResult = await client.query(
        `INSERT INTO matches (match_name, blue_team_members, red_team_members, blue_team_positions, red_team_positions, winner, match_date) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
        [matchName, blueTeam, redTeam, blueTeamPositions, redTeamPositions, winningTeam]
      );
      
      const matchId = matchResult.rows[0].id;
      console.log(`📝 경기 기록 저장: ID ${matchId}`);
      
      const winners = winningTeam === 'blue' ? blueTeam : redTeam;
      const losers = winningTeam === 'blue' ? redTeam : blueTeam;
      
      for (const memberId of winners) {
        await client.query(`
          UPDATE member_rankings 
          SET rating = rating + 10,
              wins = wins + 1,
              total_matches = total_matches + 1
          WHERE member_id = $1
        `, [memberId]);
      }
      
      for (const memberId of losers) {
        await client.query(`
          UPDATE member_rankings 
          SET rating = rating - 7,
              losses = losses + 1,
              total_matches = total_matches + 1
          WHERE member_id = $1
        `, [memberId]);
      }
      
      await client.query('COMMIT');
      
      console.log('✅ 커스텀 경기 결과 저장 완료');
     

      const membersResult = await client.query(
  `SELECT id, summoner_name FROM members WHERE id = ANY($1)`,
  [[...blueTeam, ...redTeam]]
);

const membersMap = {};
membersResult.rows.forEach(m => {
  membersMap[m.id] = m;
});

const blueTeamData = blueTeam.map((id, idx) => ({
  summoner_name: membersMap[id].summoner_name,
  position: blueTeamPositions[idx]
}));

const redTeamData = redTeam.map((id, idx) => ({
  summoner_name: membersMap[id].summoner_name,
  position: redTeamPositions[idx]
}));

// Discord로 경기 결과 전송
await sendMatchResult({
  blueTeam: blueTeamData,
  redTeam: redTeamData,
  winner: winningTeam,
  matchName: matchName
});
 
      res.json({
        success: true,
        message: `${winningTeam === 'blue' ? '블루' : '레드'} 팀 승리! 레이팅이 업데이트되었습니다.`
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ 경기 결과 저장 실패:', error);
    res.status(500).json({ error: '경기 결과 저장에 실패했습니다.' });
  }
});

app.get('/api/matches', async (req, res) => {
  try {
    console.log('📋 경기 기록 조회 중...');
    const matches = await pool.query(`
      SELECT * FROM matches 
      ORDER BY match_date DESC 
      LIMIT 50
    `);
    
    const results = [];
    
    for (const match of matches.rows) {
      const blueData = [];
      for (let i = 0; i < match.blue_team_members.length; i++) {
        const memberId = match.blue_team_members[i];
        const position = match.blue_team_positions[i];
        const memberResult = await pool.query('SELECT summoner_name FROM members WHERE id = $1', [memberId]);
        blueData.push({
          name: memberResult.rows[0]?.summoner_name || 'Unknown',
          position: position
        });
      }
      
      const redData = [];
      for (let i = 0; i < match.red_team_members.length; i++) {
        const memberId = match.red_team_members[i];
        const position = match.red_team_positions[i];
        const memberResult = await pool.query('SELECT summoner_name FROM members WHERE id = $1', [memberId]);
        redData.push({
          name: memberResult.rows[0]?.summoner_name || 'Unknown',
          position: position
        });
      }
      
      const posOrder = { 'top': 0, 'jungle': 1, 'mid': 2, 'adc': 3, 'support': 4 };
      
      blueData.sort((a, b) => (posOrder[a.position] || 99) - (posOrder[b.position] || 99));
      redData.sort((a, b) => (posOrder[a.position] || 99) - (posOrder[b.position] || 99));
      
      results.push({
        ...match,
        blue_team_names: blueData.map(d => d.name),
        blue_team_positions: blueData.map(d => d.position),
        red_team_names: redData.map(d => d.name),
        red_team_positions: redData.map(d => d.position)
      });
    }
    
    console.log(`✅ 경기 기록 조회 완료: ${results.length}경기`);
    res.json(results);
  } catch (error) {
    console.error('❌ 경기 기록 조회 실패:', error);
    res.status(500).json({ error: '경기 기록을 가져오는데 실패했습니다.' });
  }
});

app.get('/api/rankings', async (req, res) => {
  try {
    console.log('🏆 랭킹 조회 중...');
    
    const result = await pool.query(`
      SELECT 
        m.summoner_name, 
        m.tag_line, 
        COALESCE(mr.rating, 0) as rating, 
        COALESCE(mr.wins, 0) as wins, 
        COALESCE(mr.losses, 0) as losses, 
        COALESCE(mr.total_matches, 0) as total_matches,
        CASE 
          WHEN COALESCE(mr.total_matches, 0) > 0 
          THEN ROUND((COALESCE(mr.wins, 0)::numeric / COALESCE(mr.total_matches, 0)::numeric) * 100, 1)
          ELSE 0 
        END as win_rate
      FROM members m
      LEFT JOIN member_rankings mr ON mr.member_id = m.id
      ORDER BY COALESCE(mr.rating, 0) DESC, m.summoner_name ASC
    `);
    
    console.log(`✅ 랭킹 조회 완료: ${result.rows.length}명`);
    res.json(result.rows || []);
    
  } catch (error) {
    console.error('❌ 랭킹 조회 실패:', error.message);
    res.status(200).json([]);
  }
});

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('❌ 서버 에러:', err.stack);
  res.status(500).json({ 
    error: '서버 내부 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log('\n🎮======================================🎮');
  console.log('🎮     아무무 랜드 서버 시작 완료!     🎮');
  console.log('🎮======================================🎮');
  console.log(`🌐 서버 주소: http://localhost:${PORT}`);
  console.log(`🗄️ 데이터베이스: ${process.env.DB_NAME}`);
  console.log(`🔑 API 키: ${RIOT_API_KEY ? '✅ 설정됨' : '❌ 미설정'}`);
  console.log(`📊 환경: ${process.env.NODE_ENV || 'development'}`);
  console.log('🎮======================================🎮\n');
});
