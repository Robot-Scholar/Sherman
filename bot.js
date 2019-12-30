
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

const tmi = require('tmi.js');

const client = new tmi.client(options);
client.connect();

let activeMeg = false;
let megHealth = 1000;

function random(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

client.on('chat', (channel, userstate, message, self) => {

    if ( ! message.startsWith(prefix) || self ) {
        return;
    }

    const args = message.slice(prefix.length).split(/ +/);
    const cmd  = args.shift().toLowerCase();

    switch (cmd) {

        case 'test': 
            client.say('MegMegalodon', `@${userstate.username} - Sherman is sailing...`);
        break;

        case 'fire':

            if ( activeMeg ) {
                let damage = random(0,200);
                megHealth = megHealth - damage;

                client.say('MegMegalodon', `@${userstate.username} shot at the Meg and did ${damage} damage.`);

                if ( megHealth < 0 ) {
                    client.say('MegMegalodon', 'The Meg has been slain! Collect your rewards!');
                    megHealth = 1000;
                    activeMeg = false;
                }
            }

        break;

        case 'meg':

            if ( userstate.username == 'tehblister' ) {
                client.say('MegMegalodon', 'A wild Meg appears! Kill it with cannons! [!fire]');
            }

        break;

    }

});
