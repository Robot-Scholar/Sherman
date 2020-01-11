
require('dotenv').config();

var mysql = require('mysql');

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

var dbConfig = {
	host: process.env.DBHOST,
	port: 3306,
	user: process.env.DBUSER,
	password: process.env.DBPASS,
	database: 'sherman',
	charset: 'utf8mb4'

};

var connection;

var createConnection = function() {
	connection = mysql.createConnection(dbConfig);
	connection.connect(function(err) {
		console.log('connecting to db...');
		if ( err ) {
			console.log('Error connecting to DB: ', err);
			setTimeout(createConnection, 5000);
		}
	});

	connection.on('error', function(err) {
		console.log('DB Error', err);
		if ( err.code == 'PROTOCOL_CONNECTION_LOST' ) {
			createConnection();
		} else {
			let errorMsg = 'DB Connection Error';
			console.log(`${errorMsg}: ${err}`);
		}
	});
};

createConnection();

const tmi = require('tmi.js');

const client = new tmi.client(options);
client.connect();

//const TwitchBot = require('twitch-bot');
/*
const Bot = new TwitchBot({
	username: process.env.USERNAME,
	oauth: process.env.OAUTH,
	channels: ['MegMegalodon']
});
*/
let activeMeg = false;
let activeKraken = false;
let megHealth = 1000;
let krakenHealth = 5000;

function random(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}

let shipHoles = 0;
let shipWater = 0;

let Players = {};

client.on('message', (channel,tags,message,self) => {

	//console.log(`${chatter.channel} ${chatter.username}: ${chatter.message}`);

	if ( self ) { // message from client for tmi.js?
		return;
	}

	if ( tags.username in Players ) {
		Players[ tags.username ]['doubloons']++;
	} else {
		Players[ tags.username ] = {
			doubloons: 1,
			megs: 0,
			kraken: 0,
			kills: 0,
			repairs: 0,
			bails: 0
		};
	}

	const args = message.slice(prefix.length).split(/ +/);
	const cmd  = args.shift().toLowerCase();

	switch (cmd) {

		case 'test': 
			client.say(channel, `@${tags.username} - Sherman is sailing...`);
		break;

		case 'say':
			if ( tags.username == 'tehblister' || tags.username == 'megmegalodon' ) {
				let msg_out = message.slice(prefix.length).split(/ +/);
				msg_out.shift();
				client.say('#megmegalodon', msg_out.join(' '));
			}
		break;

		case 'fire':

			if ( activeMeg ) {
				let damage = random(0,400);
				megHealth = megHealth - damage;

				Players[ tags.username ]['doubloons'] += damage;
				client.say(channel, `@${tags.username} shot at the Meg and did ${damage} damage.`);

				if ( megHealth < 0 ) {
					client.say(channel, 'The Meg has been slain! Collect your rewards!');
					megHealth = 1000;
					activeMeg = false;

					Players[ tags.username ]['doubloons'] += 500;
					Players[ tags.username ]['kills'] += 1;
					Players[ tags.username ]['megs'] += 1;
				}
			} else if ( activeKraken ) {
				let damage = random(0,400);
				krakenHealth = krakenHealth - damage;

				Players[ tags.username ]['doubloons'] += damage;
				client.say(channel, `@${tags.username} shot at a tentacle and did ${damage} damage.`);

				if ( krakenHealth < 0 ) {
					client.say(channel, 'The Kraken has been slain and sinks beneath the waves! Collect your rewards!');
					krakenHealth = 1000;
					activeKraken = false;

					Players[ tags.username ]['doubloons'] += 5000;
					Players[ tags.username ]['kills'] += 1;
					Players[ tags.username ]['krakens'] += 1;
				}
			}

		break;

		case 'megs':
			if ( Players[ tags.username ]['megs'] == 0 ) {
				client.say(channel, `You haven't killed any Megalodons, @${tags.username}`);
			} else {
				client.say(channel, `You've murdered ${Players[ tags.username ]['megs']} Megalodons, @${tags.username}`);
			}
		break;

		case 'krakens':
			if ( Players[ tags.username ]['krakens'] == 0 ) {
				client.say(channel, `You haven't killed any krakens, @${tags.username}`);
			} else {
				client.say(channel, `You've slain ${Players[ tags.username ]['krakens']} krakii (is this a word?)', @${tags.username}`);
			}
		break;

		case 'repairs':
			if ( Players[ tags.username ]['repairs'] == 0 ) {
				client.say(channel, `You've never fixed the ship, @${tags.username}. It's almost like you WANT us to sink. :(`);
			} else {
				client.say(channel, `You've repaired our ship ${Players[ tags.username ]['repairs']} times. You're a true seaman!', @${tags.username}`);
			}
		break;

		case 'bails':
			if ( Players[ tags.username ]['bails'] == 0 ) {
				client.say(channel, `You've never bailed water, @${tags.username}. Do you think you're too important? :(`);
			} else {
				client.say(channel, `You've bailed ${Players[ tags.username ]['bails']} gallons! Water belongs outside the ship!', @${tags.username}`);
			}
		break;

		case 'bail':
			if ( shipWater == 0 ) {
				client.say(channel, `${tags.username} flails his bucket around at the air. What a doofus!`);
				return;
			}
			if ( shipWater > 0 ) {
				Players[ tags.username ]['doubloons'] += 25;
				shipWater = shipWater - 1;
				client.say(channel, `${tags.username} vigorously bails water...`);

				Players[ tags.username ]['bails'] += 1;

				return;
			}
		break;

		case 'repair':
			if ( shipHoles == 0 ) {
				client.say(channel, `${tags.username} should not be allowed to play with wood...`)
			}
			if ( shipHoles > 0 ) {
				Players[ tags.username ]['repairs'] += 1;
				Players[ tags.username ]['doubloons'] += 50;
				shipHoles = shipHoles - 1;
				client.say(channel, 'The sound of hammering below decks is reassuring.');
				return;
			}
		
		break;

		case 'treasure':

			let treasure_query = 'SELECT sum(treasure) as banked FROM bank WHERE nick = ?';
			connection.query(
				treasure_query, [ tags.username ],
				function(err, results, fields) {
					if ( err ) {
						console.log(`ERROR: ${err}`);
						return;
					}

					var user = results[0];

					if ( user ) {
						var banked = user.banked;
						if ( ! banked ) {
							banked = 0;
						}
						var current = Players[ tags.username ].doubloons;

						client.say(channel, `${tags.username}, you have earned ${Players[tags.username]['doubloons']} doubloons on this trip and have ${banked} in the bank! Make sure the ship makes it to an outpost!`);
					} else {
						client.say(channel, `${tags.username}, you have earned ${Players[tags.username]['doubloons']} doubloons and 0 in the bank! Make sure the ship makes it to an outpost!`);
					}
				}
			);

			
			return;
		break;

		case 'milk':
			client.say(channel, 'Milk does the body good... :)');
		break;

		case 'port':
			if ( tags.username == 'tehblister' || tags.username == 'megmegalodon' ) {
				client.say(channel, 'You made it to port! Offloading everyone\'s treasure...');

				let query = 'INSERT INTO bank (nick, treasure) VALUES (?, ?)';
				for ( var nick in Players ) {
					connection.query(
						query, [ nick, Players[ nick ].doubloons ],
						function(err, results, fields ) {
							if ( err ) {
								console.log(`ERROR: ${err}`);
								return;
							}
						}
					);

					Players[ nick ].doubloons = 0;
				}

			}
		break;

		case 'meg':

			if ( tags.username == 'tehblister' || tags.username == 'megmegalodon' ) {
				activeMeg = true;
				megHealth = random(500, 2500);
				client.say(channel, 'A wild Meg appears! Kill it with cannons! !fire away');

				setTimeout(function() { 

					if ( activeMeg ) {
						client.say(channel, 'You did not kill the Meg in time and she ran away. You gain NOTHING!');
						activeMeg = false;
					}

				}, 1000 * random(120, 360));

				setTimeout(chargeMeg, 1000 * random(10, 40));
			}

		break;

		case 'kraken':

			if ( tags.username == 'tehblister' || tags.username == 'megmegalodon'  ) {
				activeKraken = true;
				krakenHealth = random(1500, 2500);
				client.say(channel, 'A kraken rises from the depths... open !fire');

				setTimeout(crushKraken, 1000 * random(10, 70));
			}

		break;

	}

});

function chargeMeg() {
	if ( activeMeg ) {
		client.say(channel, 'The Meg is charging!');
		shipHoles = shipHoles + 1;
	
		console.log('Damage Check... ' + shipHoles + ':' + shipWater + ' - [/Meg:' + megHealth + ']');
	
		setTimeout(chargeMeg, 1000 * random(10, 40));
	}
}


function crushKraken() {
	if ( activeKraken ) {
		client.say(channel, 'The kraken is crushing your ship!');
		shipHoles = shipHoles + 3;
	
		console.log('Damage Check... ' + shipHoles + ':' + shipWater + ' - [kraken:' + krakenHealth + ']');
	
		setTimeout(crushKraken, 1000 * random(10, 70));
	}
}

function checkDamage() {
	
	// damage check
	if ( shipHoles > 0 ) {
		shipWater = shipWater + shipHoles;

		client.say(channel, 'You are sinking! !repair and !bail');

		console.log('Damage Check... ' + shipHoles + ':' + shipWater + ' - [kraken:' + krakenHealth + '/Meg:' + megHealth + ']');
	}

	if ( shipWater >= 15 ) {
		client.say(channel, 'Your ship sank! Everyone loses all their treasure. megmeg2Rip');
		shipWater = 0;
		shipHoles = 0;

		for ( let player in Players ) {
			Players[ player ]['doubloons'] = 0;
		}
	}
	
	

	setTimeout(checkDamage, 10000);
	
}

setTimeout(checkDamage, 1000);


