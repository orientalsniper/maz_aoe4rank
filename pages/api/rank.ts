import { NextApiRequest, NextApiResponse } from 'next';

const OFFICIAL = "official";
const AOEIV = "aoeiv";
const AOE4WORLD = "aoe4world";

const RANKED = "ranked";
const UNRANKED = "unranked";

export default async function (req: NextApiRequest, res: NextApiResponse) {
	// username to search for
	let username: string = req.query.username as string;
	// use this as username if username is empty (primarily used for Nightbot commands)
	let defaultUser: string = req.query.defaultuser as string;
	// profile ID of a user, only used if username and defaultUser are empty
	let profileID: string = req.query.profileid as string;
	// search for ranked or unranked stats
	let ranked: string = req.query.ranked as string;
	if(stringIsNullOrEmpty(ranked)) {
		ranked = "ranked";
	}
	// which API to get the information from: official (ageofempires.com), aoeiv(.net), or aoe4world(.com)
	const modes = [OFFICIAL, AOEIV, AOE4WORLD];
	let mode: string = req.query.mode as string;
	if(stringIsNullOrEmpty(mode)) {
		mode = AOE4WORLD;
	}
	if(modes.indexOf(mode) < 0) {
		res.status(200).send('Mode ' + mode + ' is not supported!');
		res.end();
		return;
	}
	if(stringIsNullOrEmpty(username)) {
		username = defaultUser;
	}
	if(stringIsNullOrEmpty(username) && stringIsNullOrEmpty(profileID)) {
		// Nightbot only seems to print the message when urlfetch returns status 200, otherwise I would use a 4xx status here
		res.status(200).send('No username provided!');
		res.end();
		return;
	}
	let hasResult = false;
	// remove the selected mode from the list
	modes.splice(modes.indexOf(mode), 1);
	// go through all the modes until we have a result
	let currentMode = null;
	while(!hasResult && modes.length > 0) {
		if(!currentMode) {
			currentMode = mode;
		} else {
			currentMode = modes.pop();
		}
		let response = await getResult(currentMode, username, profileID, ranked);
		console.log(response);
		
		if(!response) {
			continue;
		}
		switch(response.status) {
			case 200:
				const json = await response.json();
				console.log(json);

				let player = parseResult(json, currentMode, username, profileID, ranked);
				if(player) {
					let winPercent = player.winPercent;
					let streak = player.streak;
					let responseString = player.name + " is " + (stringIsNullOrEmpty(player.rank_level) ? "" : player.rank_level + ", ") + "rank " + player.rank + " with an ELO of " + player.rating + ". They are " + player.wins + "-" + player.losses + " (" + winPercent.toFixed() + "%).";
					if(streak < -1 || streak > 1) {
						responseString += " They are on a " + Math.abs(streak) + " game " + ((streak > 0) ? "winning" : "losing") + " streak.";
					}
					hasResult = true;
					res.status(200).send(responseString);
					res.end();
					return;
				}
				break;
			case 204:
				console.log("Could not find player " + username);
				break;
			case 500:
				console.log("Remote API " + currentMode + " is having issues. Try again later.");
				break;
			default:
				console.log("UNEXPECTED ERROR ", response.status, username, response);
				break;
		}
	}
	// if we still don't have a result, display an error message
	if(!hasResult) {
		res.status(200).send("Could not find player " + username + ". Make sure you typed the name correctly and they have completed at least 5 matches. We can only fetch the top 3000 players atm.");
		res.end();
	}
}

function stringIsNullOrEmpty(str) {
	return !str || str.trim().length <= 0;
}

function capitalizeWord(str) {
	if(!str || str.trim().length <= 0) {
		return "";
	}
	return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
}

async function getResult(mode, username, profileID, ranked) {
	let url;
	let response;
	if(mode == OFFICIAL) {
		let data;
		if(ranked == RANKED) {
			url = "https://api.ageofempires.com/api/ageiv/EventLeaderboard";
			data = `{
				"region": 7,
				"versus": "players",
				"matchType": 1,
				"teamSize": "1v1",
				"searchPlayer": "${username}",
				"page": 1,
				"count": 1
			}`;
		} else {
			url = "https://api.ageofempires.com/api/ageiv/Leaderboard";
			data = `{
			  "region": "7",
			  "versus": "players",
			  "matchType": "unranked",
			  "teamSize": "1v1",
			  "searchPlayer": "${username}",
			  "page": 1,
			  "count": 1
			}`;
		}
		response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			cache: 'no-cache',
			body: data
		});
	}
	if(mode == AOEIV) {
		url = "https://aoeiv.net/api/leaderboard?game=aoe4&leaderboard_id=17&count=1&start=1";
		if(!stringIsNullOrEmpty(username)) {
			url += "&search=" + encodeURIComponent(username);
		} else if(!stringIsNullOrEmpty(profileID)) {
			url += "&profile_id=" + encodeURIComponent(profileID);
		}
		response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			cache: 'no-cache'
		});
	}
	if(mode == AOE4WORLD) {
		if(!stringIsNullOrEmpty(username)) {
			if(ranked == RANKED) {
				url = "https://aoe4world.com/api/v0/leaderboards/rm_1v1?query=" + encodeURIComponent(username);
			} else {
				url = "https://aoe4world.com/api/v0/leaderboards/qm_1v1?query=" + encodeURIComponent(username);
			}
		} else if(!stringIsNullOrEmpty(profileID)) {
			url = "https://aoe4world.com/api/v0/players/" + encodeURIComponent(profileID);
		}
		response = await fetch(url, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			cache: 'no-cache'
		});
	}
	console.log(url);
	return response;
}

function parseResult(result, mode, username, profileID, ranked) {
	if(mode == OFFICIAL) {
		let searchField = "userName";
		let searchTerm = username;
		if(stringIsNullOrEmpty(username)) {
			searchTerm = profileID;
			searchField = "rlUserId";
		}
		let player = result.items.find(player => {
			return player[searchField].toLowerCase() == searchTerm.toLowerCase();
		});
		if(!player) {
			return null;
		}
		return {
			name: player.userName,
			rank: player.rank,
			rank_level: player.rankLevel,
			rating: player.elo,
			winPercent: player.winPercent,
			streak: player.winStreak,
			wins: player.wins,
			losses: player.losses
		};
	}
	if(mode == AOEIV) {
		if(result.leaderboard.length <= 0) {
			return null;
		}
		let player = result.leaderboard[0];
		let winPercent = player.wins * 100 / player.games;
		return {
			name: player.name,
			rank: player.rank,
			rating: player.rating,
			winPercent,
			streak: player.streak,
			wins: player.wins,
			losses: player.losses
		};
	}
	if(mode == AOE4WORLD) {
		let player;
		let name;
		let leagueString;
		if(!stringIsNullOrEmpty(username)) {
			if(result.players.length <= 0) {
				return null;
			}
			player = result.players[0];
			name = player.name;
		} else {
			if(ranked == RANKED) {
				player = result.modes.rm_1v1;
			} else {
				player = result.modes.qm_1v1;
			}
			name = result.name;
		}
		let winPercent = player.win_rate;
		if(ranked == RANKED) {
			let league = player.rank_level.split("_");
			leagueString = capitalizeWord(league[0]) + " " + (4 - parseInt(league[1]));
		}
		return {
			name,
			rank: player.rank,
			rank_level: leagueString,
			rating: player.rating,
			winPercent,
			streak: player.streak,
			wins: player.wins_count,
			losses: player.losses_count
		};
	}
	return null;
}
