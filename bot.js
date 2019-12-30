
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

let shipHoles = 0;
let shipWater = 0;

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
				let damage = random(0,400);
				megHealth = megHealth - damage;

				Bot.say(`@${chatter.username} shot at the Meg and did ${damage} damage.`);

				if ( megHealth < 0 ) {
					Bot.say('The Meg has been slain! Collect your rewards!');
					megHealth = 1000;
					activeMeg = false;
				}
			}

		break;

		case 'bail':
			if ( shipWater == 0 ) {
				Bot.say(`${chatter.username} flails his bucket around at the air. What a doofus!`);
				return;
			}
			if ( shipWater > 0 ) {
				shipWater = shipWater - 1;
				Bot.say(`${chatter.username} vigorously bails water...`);
				return;
			}
		break;

		case 'repair':
			if ( shipHoles == 0 ) {
				Bot.say(`${chatter.username} should not be allowed to play with wood...`)
			}
			if ( shipHoles > 0 ) {
				shipHoles = shipHoles - 1;
				Bot.say('The sound of hammering below decks is reassuring.');
				return;
			}
		
		break;

		case 'meg':

			if ( chatter.username == 'tehblister' ) {
				activeMeg = true;
				megHealth = random(500, 2500);
				Bot.say('A wild Meg appears! Kill it with cannons! [!fire]');

				setTimeout(function() { 

					if ( activeMeg ) {
						Bot.say('You did not kill the Meg in time and she ran away. You gain NOTHING!');
						activeMeg = false;
					}

				}, 1000 * random(120, 360));

				setTimeout(chargeMeg, 1000 * random(10, 40));
			}

		break;

	}

});

function chargeMeg() {
	Bot.say('The Meg is charging!');
	shipHoles = shipHoles + 1;

	console.log('Damage Check... ' + shipHoles + ':' + shipWater);

	setTimeout(chargeMeg, 1000 * random(10, 40));
}

function checkDamage() {
	
	// damage check
	if ( shipHoles > 0 ) {
		shipWater = shipWater + shipHoles;

		Bot.say('You are sinking! !repair and !bail');
	}

	if ( shipWater >= 15 ) {
		Bot.say('Your ship sank! Everyone loses all their treasure. megmeg2Rip');
		shipWater = 0;
		shipHoles = 0;
	}
	
	console.log('Damage Check... ' + shipHoles + ':' + shipWater);

	setTimeout(checkDamage, 1000);
}

setTimeout(checkDamage, 1000);


