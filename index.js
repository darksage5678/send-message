// .env 파일의 환경 변수를 불러옵니다.
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

// Render 서버 포트 바인딩 (기본값 8080으로 변경)
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.write('디스코드 봇이 정상 작동 중입니다.');
  res.end();
}).listen(PORT, () => {
  console.log(`[웹 서버] 포트 ${PORT}에서 작동 중입니다.`);
});

// 디스코드 클라이언트 생성 및 필요한 권한(Intent) 설정
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers, // 멤버 목록을 불러오기 위한 필수 권한
  ],
});

// 설정값 (.env 파일의 TOKEN 변수 사용)
const PREFIX = '!전송';
const TOKEN = process.env.TOKEN;

// 최신 이벤트명 적용 ('ready' -> 'clientReady')
client.once('clientReady', (c) => {
  console.log(`[온라인] ${c.user.tag} 봇이 성공적으로 로그인했습니다.`);
});

client.on('messageCreate', async (message) => {
  // 봇이 작성한 메세지이거나 설정한 명령어로 시작하지 않으면 무시
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  // '!전송 ' 뒤의 텍스트만 추출
  const contentToSend = message.content.slice(PREFIX.length).trim();

  if (!contentToSend) {
    return message.reply('보낼 메세지 내용을 입력해 주세요!\n(예시: `!전송 @everyone 공지사항입니다.`)');
  }

  try {
    // 1. 최신 서버 멤버 목록 불러오기
    await message.guild.members.fetch();
    
    // 봇 계정을 제외한 실제 유저만 필터링
    const members = Array.from(
      message.guild.members.cache.filter((member) => !member.user.bot).values()
    );

    const statusMsg = await message.reply(`⚡ 총 ${members.length}명의 멤버에게 초고속 DM 전송을 시작합니다...`);

    let successCount = 0;
    let failCount = 0;

    // 2. 10명씩 묶어서 초고속 병렬 전송
    const BATCH_SIZE = 10;
    for (let i = 0; i < members.length; i += BATCH_SIZE) {
      const batch = members.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (member) => {
          try {
            await member.send(`**[서버 공지]**\n${contentToSend}`);
            successCount++;
          } catch (error) {
            failCount++; // DM 수신 거부 / 차단 유저
          }
        })
      );

      // 디스코드 API 제한(Rate Limit) 방지용 최적화 대기 (0.15초)
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // 3. 완료 결과 통보
    await statusMsg.edit(
      `✅ **전송이 완료되었습니다!**\n- 성공: ${successCount}명\n- 실패: ${failCount}명 (DM 닫힘/차단 등)`
    );
  } catch (err) {
    console.error('전송 처리 중 오류 발생:', err);
    message.reply('메세지 전송 중 오류가 발생했습니다. 개발자 포털에서 `SERVER MEMBERS INTENT` 설정이 켜져 있는지 확인해 보세요.');
  }
});

// .env에 설정된 TOKEN으로 로그인
client.login(TOKEN);