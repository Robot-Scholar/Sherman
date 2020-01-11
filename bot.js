
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
		console.log('DB Error': err);
		if ( err.code == 'PROTOCOL_CONNECTION_LOST' ) {
			createConnection();
		} else {
			let errorMsg = 'DB Connection Error';
			console.log(`${errorMsg}: ${err}`);
		}
	});
};

createConnection();

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
let activeKraken = false;
let megHealth = 1000;
let krakenHealth = 5000;

function random(low, high) {
	return Math.floor(Math.random() * (high - low) + low);
}

let shipHoles = 0;
let shipWater = 0;

let Players = {};

Bot.on('message', chatter => {

	console.log(`${chatter.channel} ${chatter.username}: ${chatter.message}`);

	if ( chatter.username in Players ) {
		Players[ chatter.username ]['doubloons']++;
	} else {
		Players[ chatter.username ] = {
			doubloons: 1,
			megs: 0,
			kraken: 0,
			kills: 0,
			repairs: 0,
			bails: 0
		};
	}

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

				Players[ chatter.username ]['doubloons'] += damage;
				Bot.say(`@${chatter.username} shot at the Meg and did ${damage} damage.`);

				if ( megHealth < 0 ) {
					Bot.say('The Meg has been slain! Collect your rewards!');
					megHealth = 1000;
					activeMeg = false;

					Players[ chatter.username ]['doubloons'] += 500;
					Players[ chatter.username ]['kills'] += 1;
					Players[ chatter.username ]['megs'] += 1;
				}
			} else if ( activeKraken ) {
				let damage = random(0,400);
				krakenHealth = krakenHealth - damage;

				Players[ chatter.username ]['doubloons'] += damage;
				Bot.say(`@${chatter.username} shot at a tentacle and did ${damage} damage.`);

				if ( krakenHealth < 0 ) {
					Bot.say('The Kraken has been slain and sinks beneath the waves! Collect your rewards!');
					krakenHealth = 1000;
					activeKraken = false;

					Players[ chatter.username ]['doubloons'] += 5000;
					Players[ chatter.username ]['kills'] += 1;
					Players[ chatter.username ]['krakens'] += 1;
				}
			}

		break;

		case 'megs':
			if ( Players[ chatter.username ]['megs'] == 0 ) {
				Bot.say(`You haven't killed any Megalodons, @${chatter.username}`);
			} else {
				Bot.say(`You've murdered ${Players[ chatter.username ]['megs']} Megalodons, @${chatter.username}`);
			}
		break;

		case 'krakens':
			if ( Players[ chatter.username ]['krakens'] == 0 ) {
				Bot.say(`You haven't killed any krakens, @${chatter.username}`);
			} else {
				Bot.say(`You've slain ${Players[ chatter.username ]['krakens']} krakii (is this a word?)', @${chatter.username}`);
			}
		break;

		case 'repairs':
			if ( Players[ chatter.username ]['repairs'] == 0 ) {
				Bot.say(`You've never fixed the ship, @${chatter.username}. It's almost like you WANT us to sink. :(`);
			} else {
				Bot.say(`You've repaired our ship ${Players[ chatter.username ]['repairs']} times. You're a true seaman!', @${chatter.username}`);
			}
		break;

		case 'bails':
			if ( Players[ chatter.username ]['bails'] == 0 ) {
				Bot.say(`You've never bailed water, @${chatter.username}. Do you think you're too important? :(`);
			} else {
				Bot.say(`You've bailed ${Players[ chatter.username ]['bails']} gallons! Water belongs outside the ship!', @${chatter.username}`);
			}
		break;

		case 'bail':
			if ( shipWater == 0 ) {
				Bot.say(`${chatter.username} flails his bucket around at the air. What a doofus!`);
				return;
			}
			if ( shipWater > 0 ) {
				Players[ chatter.username ]['doubloons'] += 25;
				shipWater = shipWater - 1;
				Bot.say(`${chatter.username} vigorously bails water...`);

				Players[ chatter.username ]['bails'] += 1;

				return;
			}
		break;

		case 'repair':
			if ( shipHoles == 0 ) {
				Bot.say(`${chatter.username} should not be allowed to play with wood...`)
			}
			if ( shipHoles > 0 ) {
				Players[ chatter.username ]['repairs'] += 1;
				Players[ chatter.username ]['doubloons'] += 50;
				shipHoles = shipHoles - 1;
				Bot.say('The sound of hammering below decks is reassuring.');
				return;
			}
		
		break;

		case 'treasure':

			let query = 'SELECT sum(treasure) as banked FROM bank WHERE nick = ?';
			connection.query(
				query, [ chatter.username ],
				function(err, results, fields) {
					if ( err ) {
						console.log(`ERROR: ${err}`);
						return;
					}

					var user = results[0];

					if ( user ) {
						var banked = user.banked;
						var current = Players[ chatter.username ].doubloons;

						Bot.say(`${chatter.username}, you have earned ${Players[chatter.username]['doubloons']} doubloons on this trip and have ${banked} in the bank! Make sure the ship makes it to an outpost!`);
					} else {
						Bot.say(`${chatter.username}, you have earned ${Players[chatter.username]['doubloons']} doubloons and 0 in the bank! Make sure the ship makes it to an outpost!`);
					}
				}
			);

			
			return;
		break;

		case 'milk':
			Bot.say('Milk does the body good... :)');
		break;

		case 'port':
			if ( chatter.username == 'tehblister' || chatter.username == 'megmegalodon' ) {
				Bot.say('You made it to port! Offloading everyone\'s treasure...');

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

				let query = ``
			}
		break;

		case 'meg':

			if ( chatter.username == 'tehblister' || chatter.username == 'megmegalodon' ) {
				activeMeg = true;
				megHealth = random(500, 2500);
				Bot.say('A wild Meg appears! Kill it with cannons! !fire away');

				setTimeout(function() { 

					if ( activeMeg ) {
						Bot.say('You did not kill the Meg in time and she ran away. You gain NOTHING!');
						activeMeg = false;
					}

				}, 1000 * random(120, 360));

				setTimeout(chargeMeg, 1000 * random(10, 40));
			}

		break;

		case 'kraken':

			if ( chatter.username == 'tehblister' || chatter.username == 'megmegalodon'  ) {
				activeKraken = true;
				krakenHealth = random(1500, 2500);
				Bot.say('A kraken rises from the depths... open !fire');

				setTimeout(crushKraken, 1000 * random(10, 70));
			}

		break;

	}

});

function chargeMeg() {
	if ( activeMeg ) {
		Bot.say('The Meg is charging!');
		shipHoles = shipHoles + 1;
	
		console.log('Damage Check... ' + shipHoles + ':' + shipWater + ' - [/Meg:' + megHealth + ']');
	
		setTimeout(chargeMeg, 1000 * random(10, 40));
	}
}


function crushKraken() {
	if ( activeKraken ) {
		Bot.say('The kraken is crushing your ship!');
		shipHoles = shipHoles + 3;
	
		console.log('Damage Check... ' + shipHoles + ':' + shipWater + ' - [kraken:' + krakenHealth + ']');
	
		setTimeout(crushKraken, 1000 * random(10, 70));
	}
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

		for ( let player in Players ) {
			Players[ player ]['doubloons'] = 0;
		}
	}
	
	console.log('Damage Check... ' + shipHoles + ':' + shipWater + ' - [kraken:' + krakenHealth + '/Meg:' + megHealth + ']');

	setTimeout(checkDamage, 10000);
	
}

setTimeout(checkDamage, 1000);


