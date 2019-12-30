
require('dotenv').config();

const options = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: process.env.USERNAME,
        password: process.env.OAUTH
    },
    channels: ['MegMegalodon']
};

const prefix = '!';

//const tmi = require('tmi.js');

//const client = new tmi.client(options);
//client.connect();

const TwitchBot = require('twitch-bot');

const Bot = new TwitchBot({
    username: process.env.USERNAME,
    oauth: process.env.OAUTH,
    channels: ['MegMegalodon']
});

let activeMeg = false;
let megHealth = 1000;

function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

Bot.on('message', chatter => {

    console.log(`#${chatter.channel} ${chatter.username}: ${chatter.message}`);

    if ( ! chatter.message.startsWith(prefix) || chatter.username == 'shermanthebot' ) {
        return;
    }

    const args = chatter.message.slice(prefix.length).split(/ +/);
    const cmd  = args.shift().toLowerCase();

    switch (cmd) {

        case 'test': 
            Bot.say(`@${chatter.username} - Sherman is sailing...`);
        break;

        case 'fire':

            if ( activeMeg ) {
                let damage = random(0,200);
                megHealth = megHealth - damage;

                Bot.say(`@${chatter.username} shot at the Meg and did ${damage} damage.`);

                if ( megHealth < 0 ) {
                    Bot.say('The Meg has been slain! Collect your rewards!');
                    megHealth = 1000;
                    activeMeg = false;
                }
            }

        break;

        case 'meg':

            if ( chatter.username == 'tehblister' ) {
                Bot.say('A wild Meg appears! Kill it with cannons! [!fire]');
            }

        break;

    }

});
