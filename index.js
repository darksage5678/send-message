require('dotenv').config(); // .env 파일의 환경 변수를 불러옵니다.
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`로그인 완료: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    // 1. 봇의 메시지이거나 DM인 경우 무시
    if (message.author.bot || !message.guild) return;

    const prefix = '!'; // 사용할 프리픽스
    if (!message.content.startsWith(prefix)) return;

    // 명령어와 내용 분리 (예: !전송 안녕하세요 -> command: 전송, args: [안녕하세요])
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 2. 전송 명령어 처리
    if (command === '전송') {
        const textToSend = args.join(' ');
        if (!textToSend) {
            return message.reply('전송할 내용을 입력해주세요!');
        }

        // ⭐ message.guild를 사용하므로 명령어가 입력된 해당 서버에서만 독립적으로 작동합니다.
        try {
            await message.channel.send(`[전송 완료] ${textToSend}`);
        } catch (error) {
            console.error('메시지 전송 중 오류 발생:', error);
            await message.reply('메시지 전송에 실패했습니다.');
        }
    }
});

// .env 파일의 TOKEN 변수를 불러와 로그인합니다.
client.login(process.env.TOKEN);