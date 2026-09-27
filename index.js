const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // 서버 멤버 목록 수집용 필수 권한
  ],
});

// 명령어 프레픽스 및 토큰 설정
const PREFIX = '!전송';
const BOT_TOKEN = '여기에_디스코드_봇_토큰을_입력하세요';

client.once('ready', () => {
  console.log(`[온라인] ${client.user.tag} 봇이 성공적으로 실행되었습니다.`);
});

client.on('messageCreate', async (message) => {
  // 봇이 쓴 메시지이거나 '!전송'으로 시작하지 않으면 무시
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  // '!전송 ' 뒤에 있는 메세지 추출
  const contentToSend = message.content.slice(PREFIX.length).trim();

  if (!contentToSend) {
    return message.reply('보낼 메세지 내용을 입력해 주세요!\n(예시: `!전송 @everyone 서버 점검 안내입니다.`)');
  }

  try {
    // 1. 최신 서버 멤버 목록 불러오기
    await message.guild.members.fetch();
    
    // 봇을 제외한 실제 유저 멤버만 필터링
    const members = Array.from(
      message.guild.members.cache.filter((member) => !member.user.bot).values()
    );

    const statusMsg = await message.reply(`⚡ 총 ${members.length}명의 멤버에게 빠른 DM 전송을 시작합니다...`);

    let successCount = 0;
    let failCount = 0;

    // 2. 초고속 병렬 전송 (10명씩 묶어서 처리)
    const BATCH_SIZE = 10;
    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (member) => {
          try {
            await member.send(`**[서버 공지]**\n${contentToSend}`);
            successCount++;
          } catch (error) {
            // 멤버가 DM 차단/수신거부를 해둔 경우
            failCount++;
          }
        })
      );

      // 디스코드 API 제재 방지를 위한 최소 대기시간 (0.15초)
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // 3. 결과 알림
    await statusMsg.edit(
      `✅ **전송이 완료되었습니다!**\n- 성공: ${successCount}명\n- 실패: ${failCount}명 (DM 차단 또는 비활성화)`
    );
  } catch (err) {
    console.error('전송 중 에러 발생:', err);
    message.reply('메세지 전송 중 오류가 발생했습니다. 봇 권한(GuildMembers)을 확인해 주세요.');
  }
});

client.login(process.env.TOKEN || process.env.DISCORD_TOKEN);