const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above to connect');
});

client.on('ready', () => {
    console.log('WhatsApp bot is ready!');
});

client.initialize();

let kataTerakhir = '';
let pemainAktif = '';
let pemainList = []; 
let giliran = 0; 
let kesalahanPemain = {}; 

client.on('message', async message => {
    if (message.body === '!set-player') {
        pemainList = [];
        kesalahanPemain = {};
        client.sendMessage(message.from, 'Permainan dimulai! Ketik !ikut untuk bergabung.');
    }

    if (message.body === '!ikut') {
        const playerNumber = message.author || message.from;
        if (!pemainList.includes(playerNumber)) {
            pemainList.push(playerNumber);
            kesalahanPemain[playerNumber] = 0; 
            client.sendMessage(message.from, `Nomor ${playerNumber} telah bergabung dalam permainan.`);
        } else {
            client.sendMessage(message.from, 'Kamu sudah terdaftar dalam permainan!');
        }
    }
});

client.on('message', async message => {
    const playerNumber = message.author || message.from;

    
    if (message.body.startsWith('!mulai') && pemainList.length > 0) {
        kataTerakhir = '';
        pemainAktif = '';
        giliran = 0; 
        client.sendMessage(message.from, 'Permainan sambung kata dimulai! Pemain pertama, kirim kata pertama.');
    }

    if (pemainList[giliran] === playerNumber && kataTerakhir === '' && message.body.startsWith('!kata ')) {
        kataTerakhir = message.body.slice(6);
        client.sendMessage(message.from, `Kata pertama adalah "${kataTerakhir}". Pemain berikutnya, sambung dengan huruf "${kataTerakhir.slice(-1)}".`);
        giliran = (giliran + 1) % pemainList.length; 
    } else if (pemainList[giliran] === playerNumber && kataTerakhir !== '' && message.body.startsWith('!kata ')) {
        const kataBaru = message.body.slice(6);
        const hurufTerakhir = kataTerakhir.slice(-1);
        const hurufPertamaBaru = kataBaru[0];

        if (hurufTerakhir.toLowerCase() === hurufPertamaBaru.toLowerCase()) {
            kataTerakhir = kataBaru;
            client.sendMessage(message.from, `Kata "${kataBaru}" diterima! Pemain berikutnya, sambung dengan huruf "${kataBaru.slice(-1)}".`);
            giliran = (giliran + 1) % pemainList.length; 
        } else {
            kesalahanPemain[playerNumber] += 1; 
            client.sendMessage(message.from, `Kata "${kataBaru}" salah! Harus dimulai dengan huruf "${hurufTerakhir}". Kamu punya ${3 - kesalahanPemain[playerNumber]} kesempatan lagi.`);
            
            
            if (kesalahanPemain[playerNumber] >= 3) {
                client.sendMessage(message.from, `Pemain nomor ${playerNumber} telah gugur!`);
                pemainList = pemainList.filter(pemain => pemain !== playerNumber); 
                if (pemainList.length === 0) {
                    client.sendMessage(message.from, 'Semua pemain telah gugur! Permainan berakhir.');
                    kataTerakhir = '';
                } else {
                    giliran = giliran % pemainList.length;
                }
            } else {
                giliran = (giliran + 1) % pemainList.length; 
            }
        }
    }
});
