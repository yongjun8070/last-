const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// 봇 준비 완료
client.once('ready', () => {
  console.log('✅ 디스코드 봇 온라인:', client.user.tag);
  client.user.setActivity('내전 밸런싱', { type: 'WATCHING' });
});

// 팀 밸런싱 결과 공지
async function sendBalanceResult(balanceData) {
  if (!CHANNEL_ID) {
    console.log('⚠️ DISCORD_CHANNEL_ID가 설정되지 않았습니다.');
    return;
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    const embed = new EmbedBuilder()
      .setColor('#9333EA')
      .setTitle('⚖️ 팀 밸런싱 완료!')
      .setDescription(`점수 차이: **${balanceData.scoreDifference}점**`)
      .addFields(
        {
          name: '🔵 블루팀',
          value: balanceData.blueTeam.map(m => 
            `${getPositionEmoji(m.position)} **${m.summoner_name}** (${m.finalScore}점)`
          ).join('\n'),
          inline: true
        },
        {
          name: '🔴 레드팀',
          value: balanceData.redTeam.map(m => 
            `${getPositionEmoji(m.position)} **${m.summoner_name}** (${m.finalScore}점)`
          ).join('\n'),
          inline: true
        }
      )
      .setFooter({ text: '아무무 랜드 내전 시스템' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log('✅ 디스코드 팀 밸런싱 결과 전송 완료');
  } catch (error) {
    console.error('❌ 디스코드 메시지 전송 실패:', error);
  }
}

// 경기 결과 공지
async function sendMatchResult(matchData) {
  if (!CHANNEL_ID) return;

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    const winnerTeam = matchData.winner === 'blue' ? '블루팀' : '레드팀';
    const winnerColor = matchData.winner === 'blue' ? '#3B82F6' : '#EF4444';
    
    const embed = new EmbedBuilder()
      .setColor(winnerColor)
      .setTitle(`🏆 경기 종료: ${winnerTeam} 승리!`)
      .setDescription(matchData.matchName || '내전 경기')
      .addFields(
        {
          name: '🔵 블루팀',
          value: matchData.blueTeam.map(m => 
            `${getPositionEmoji(m.position)} ${m.summoner_name}`
          ).join('\n'),
          inline: true
        },
        {
          name: '🔴 레드팀',
          value: matchData.redTeam.map(m => 
            `${getPositionEmoji(m.position)} ${m.summoner_name}`
          ).join('\n'),
          inline: true
        }
      )
      .setFooter({ text: '아무무 랜드 내전 시스템' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log('✅ 디스코드 경기 결과 전송 완료');
  } catch (error) {
    console.error('❌ 디스코드 메시지 전송 실패:', error);
  }
}

// 내전 시작 알림
async function sendMatchStartNotification(members) {
  if (!CHANNEL_ID) return;

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    
    const memberMentions = members.map(m => `**${m.summoner_name}**`).join(', ');
    
    const embed = new EmbedBuilder()
      .setColor('#10B981')
      .setTitle('🎮 내전 시작!')
      .setDescription(`선택된 멤버: ${memberMentions}`)
      .addFields({
        name: '참여 인원',
        value: `총 ${members.length}명`,
        inline: false
      })
      .setFooter({ text: '팀 밸런싱 결과를 기다려주세요!' })
      .setTimestamp();

    await channel.send({ content: '@everyone', embeds: [embed] });
    console.log('✅ 디스코드 내전 시작 알림 전송 완료');
  } catch (error) {
    console.error('❌ 디스코드 메시지 전송 실패:', error);
  }
}

// 포지션 이모지 헬퍼 (커스텀 이모지 사용)
function getPositionEmoji(position) {
  const emojis = {
    'top': '<:top1:1427186510217740358>',
    'jungle': '<:jungle1:1427186453863071786>',
    'mid': '<:mid1:1427186472158498888>',
    'adc': '<:adc1:1427186434577535036>',
    'support': '<:support:1427186490017841264>'
  };
  return emojis[position?.toLowerCase()] || '❓';
}

// 봇 로그인
client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ 디스코드 봇 로그인 실패:', error);
});
// Discord 명령어 핸들러
discordClient.on('messageCreate', async (message) => {
  // 봇 자신의 메시지는 무시
  if (message.author.bot) return;
  
  const content = message.content.trim();
  
  // /랭킹 명령어
  if (content === '/랭킹') {
    try {
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
        ORDER BY COALESCE(mr.rating, 0) DESC
        LIMIT 10
      `);
      
      if (result.rows.length === 0) {
        await message.reply('등록된 멤버가 없습니다.');
        return;
      }
      
      const rankingText = result.rows.map((player, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : \`\${idx + 1}.\`;
        return \`\${medal} **\${player.summoner_name}** - \${player.rating}점 (\${player.total_matches}전 \${player.wins}승 \${player.losses}패, 승률 \${player.win_rate}%)\`;
      }).join('\\n');
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 아무무 랜드 랭킹 TOP 10')
        .setDescription(rankingText)
        .setTimestamp()
        .setFooter({ text: '아무무 랜드 내전 시스템' });
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('랭킹 조회 실패:', error);
      await message.reply('❌ 랭킹 조회에 실패했습니다.');
    }
  }
  
  // /통계 명령어
  if (content.startsWith('/통계')) {
    const args = content.split(' ');
    
    if (args.length < 2) {
      await message.reply('사용법: \`/통계 소환사명#태그\` (예: \`/통계 까진꼬꼬#KR1\`)');
      return;
    }
    
    const fullName = args.slice(1).join(' ');
    let summonerName, tagLine;
    
    if (fullName.includes('#')) {
      [summonerName, tagLine] = fullName.split('#');
    } else {
      summonerName = fullName;
      tagLine = null;
    }
    
    try {
      let memberResult;
      
      if (tagLine) {
        memberResult = await pool.query(\`
          SELECT 
            m.id, m.summoner_name, m.tag_line,
            mr_solo.tier as solo_tier, mr_solo.rank_level as solo_rank, mr_solo.league_points as solo_lp,
            COALESCE(mr.rating, 0) as rating, COALESCE(mr.wins, 0) as wins, 
            COALESCE(mr.losses, 0) as losses, COALESCE(mr.total_matches, 0) as total_matches,
            CASE WHEN COALESCE(mr.total_matches, 0) > 0 
              THEN ROUND((COALESCE(mr.wins, 0)::numeric / COALESCE(mr.total_matches, 0)::numeric) * 100, 1)
              ELSE 0 END as win_rate
          FROM members m
          LEFT JOIN member_rankings mr ON mr.member_id = m.id
          LEFT JOIN member_ranks mr_solo ON mr_solo.member_id = m.id AND mr_solo.queue_type = 'RANKED_SOLO_5x5'
          WHERE LOWER(m.summoner_name) = LOWER($1) AND LOWER(m.tag_line) = LOWER($2)
        \`, [summonerName.trim(), tagLine.trim()]);
      } else {
        memberResult = await pool.query(\`
          SELECT 
            m.id, m.summoner_name, m.tag_line,
            mr_solo.tier as solo_tier, mr_solo.rank_level as solo_rank, mr_solo.league_points as solo_lp,
            COALESCE(mr.rating, 0) as rating, COALESCE(mr.wins, 0) as wins, 
            COALESCE(mr.losses, 0) as losses, COALESCE(mr.total_matches, 0) as total_matches,
            CASE WHEN COALESCE(mr.total_matches, 0) > 0 
              THEN ROUND((COALESCE(mr.wins, 0)::numeric / COALESCE(mr.total_matches, 0)::numeric) * 100, 1)
              ELSE 0 END as win_rate
          FROM members m
          LEFT JOIN member_rankings mr ON mr.member_id = m.id
          LEFT JOIN member_ranks mr_solo ON mr_solo.member_id = m.id AND mr_solo.queue_type = 'RANKED_SOLO_5x5'
          WHERE LOWER(m.summoner_name) LIKE LOWER($1)
        \`, [\`%\${summonerName.trim()}%\`]);
      }
      
      if (memberResult.rows.length === 0) {
        if (tagLine) {
          await message.reply(\`❌ "\${summonerName}#\${tagLine}" 멤버를 찾을 수 없습니다.\`);
        } else {
          await message.reply(\`❌ "\${summonerName}" 멤버를 찾을 수 없습니다.\\n정확한 태그를 포함해주세요. (예: \\\`/통계 \${summonerName}#KR1\\\`)\`);
        }
        return;
      }
      
      if (memberResult.rows.length > 1) {
        const namesList = memberResult.rows.map(p => \`\${p.summoner_name}#\${p.tag_line}\`).join(', ');
        await message.reply(\`⚠️ 동일한 이름의 멤버가 여러 명 있습니다:\\n\${namesList}\\n\\n정확한 태그를 포함해주세요. (예: \\\`/통계 \${summonerName}#KR1\\\`)\`);
        return;
      }
      
      const player = memberResult.rows[0];
      
      const recentMatches = await pool.query(\`
        SELECT m.match_name, m.winner, m.blue_team_members, m.red_team_members, m.match_date
        FROM matches m
        WHERE $1 = ANY(m.blue_team_members) OR $1 = ANY(m.red_team_members)
        ORDER BY m.match_date DESC LIMIT 5
      \`, [player.id]);
      
      let recentForm = '';
      recentMatches.rows.forEach(match => {
        const isBlue = match.blue_team_members.includes(player.id);
        const won = (isBlue && match.winner === 'blue') || (!isBlue && match.winner === 'red');
        recentForm += won ? '✅' : '❌';
      });
      
      const positionStats = await pool.query(\`
        SELECT 
          UNNEST(CASE WHEN $1 = ANY(m.blue_team_members) THEN m.blue_team_positions ELSE m.red_team_positions END) as position,
          COUNT(*) as games,
          SUM(CASE WHEN ($1 = ANY(m.blue_team_members) AND m.winner = 'blue') OR ($1 = ANY(m.red_team_members) AND m.winner = 'red') THEN 1 ELSE 0 END) as wins
        FROM matches m
        WHERE $1 = ANY(m.blue_team_members) OR $1 = ANY(m.red_team_members)
        GROUP BY position ORDER BY games DESC
      \`, [player.id]);
      
      let positionText = '';
      if (positionStats.rows.length > 0) {
        positionText = positionStats.rows.map(pos => {
          const winRate = ((pos.wins / pos.games) * 100).toFixed(1);
          return \`\${POSITION_KOREAN[pos.position]}: \${pos.games}경기 \${pos.wins}승 (\${winRate}%)\`;
        }).join('\\n');
      } else {
        positionText = '경기 기록이 없습니다.';
      }
      
      const soloRankText = player.solo_tier ? \`\${player.solo_tier} \${player.solo_rank} (\${player.solo_lp}LP)\` : '언랭';
      
      const embed = new EmbedBuilder()
        .setColor('#9333EA')
        .setTitle(\`📊 \${player.summoner_name}#\${player.tag_line} 통계\`)
        .addFields(
          { name: '🎮 솔로랭크', value: soloRankText, inline: true },
          { name: '⚡ 내전 레이팅', value: \`\${player.rating}점\`, inline: true },
          { name: '📈 전적', value: \`\${player.total_matches}전 \${player.wins}승 \${player.losses}패\`, inline: true },
          { name: '📊 승률', value: \`\${player.win_rate}%\`, inline: true },
          { name: '🔥 최근 5경기', value: recentForm || '없음', inline: true },
          { name: '\\u200B', value: '\\u200B', inline: true },
          { name: '🎯 포지션별 통계', value: positionText, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: '아무무 랜드 내전 시스템' });
      
      await message.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('통계 조회 실패:', error);
      await message.reply('❌ 통계 조회에 실패했습니다.');
    }
  }
  
  if (content === '/도움말' || content === '/help') {
    const embed = new EmbedBuilder()
      .setColor('#9333EA')
      .setTitle('🤖 아무무 랜드 봇 명령어')
      .setDescription('사용 가능한 명령어 목록입니다.')
      .addFields(
        { name: '/랭킹', value: '현재 랭킹 TOP 10을 조회합니다.', inline: false },
        { name: '/통계 [소환사명#태그]', value: '특정 멤버의 상세 통계를 조회합니다.\\n예: \`/통계 까진꼬꼬#KR1\` 또는 \`/통계 까진꼬꼬\`', inline: false },
        { name: '/도움말', value: '이 도움말을 표시합니다.', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: '아무무 랜드 내전 시스템' });
    
    await message.reply({ embeds: [embed] });
  }
});

module.exports = {
  client,
  sendBalanceResult,
  sendMatchResult,
  sendMatchStartNotification
};
