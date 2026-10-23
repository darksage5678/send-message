require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // 서버 멤버 목록을 불러오기 위해 필수
    ],
});

client.once('ready', () => {
    console.log(`로그인 완료: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // 1. 봇의 메시지이거나 DM인 경우 무시
    if (message.author.bot || !message.guild) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 2. !전송 명령어 처리
    if (command === '전송') {
        const textToSend = args.join(' ');
        if (!textToSend) {
            return message.reply('전송할 내용을 입력해주세요! (예: `!전송 공지 내용`)');
        }

        // 사용자가 보낸 명령어 메시지는 깔끔하게 삭제 (권한이 있을 경우)
        try {
            await message.delete();
        } catch (err) {
            console.log('명령어 메시지 삭제 실패 (권한 부족 등)');
        }

        // 작업 시작 알림 메시지 출력
        const statusMessage = await message.channel.send('🚀 초고속 공지 전송을 시작합니다...');

        try {
            // 서버의 모든 멤버 정보를 캐시에 불러옵니다.
            await message.guild.members.fetch();

            // 봇을 제외한 일반 유저들만 필터링
            const members = message.guild.members.cache.filter(member => !member.user.bot);
            const memberArray = Array.from(members.values());

            let successCount = 0;
            let failCount = 0;

            // ⭐ 초고속 전송을 위한 Promise.all 병렬 처리
            const promises = memberArray.map(async (member) => {
                try {
                    await member.send(
                        `📢 **[${message.guild.name} 서버 공지]**\n\n` +
                        `${textToSend}`
                    );
                    return 'success';
                } catch (err) {
                    return 'fail';
                }
            });

            // 모든 전송 요청이 동시에 처리되도록 대기
            const results = await Promise.all(promises);

            // 성공/실패 카운트 집계
            results.forEach((res) => {
                if (res === 'success') successCount++;
                else failCount++;
            });

            // 3. 사용자가 친 채팅 대신, 서버 이름과 성공/실패 통계만 깔끔하게 출력
            await statusMessage.edit(
                `✅ **공지 전송이 완료되었습니다!**\n\n` +
                `📨 **전송 성공:** ${successCount}명\n` +
                `❌ **전송 실패:** ${failCount}명`
            );

        } catch (error) {
            console.error('전송 중 오류 발생:', error);
            await statusMessage.edit('❌ 공지 전송 중 오류가 발생했습니다. (봇의 권한을 확인해주세요)');
        }
    }
});

client.login(process.env.TOKEN);