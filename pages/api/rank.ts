import { NextApiRequest, NextApiResponse } from 'next';

export default async function (req: NextApiRequest, res: NextApiResponse) {
	// username to search for
	let username: string = req.query.username as string;
	// use this as username if username is empty (primarily used for Nightbot commands)
	let defaultUser: string = req.query.defaultuser as string;
	// profile ID of a user, only used if username and defaultUser are empty
	let profileID: string = req.query.profileid as string;
	// which API to get the information from: official (ageofempires.com), aoeiv(.net), or aoe4world(.com)
	let mode: string = req.query.mode as string;
	if(stringIsNullOrEmpty(mode)) {
		mode = "aoe4world";
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
	let response = await getResult(mode, username, profileID);
	console.log(response);

	switch(response.status) {
		case 200:
			const json = await response.json();
			console.log(json);

			let player = parseResult(json, mode, username, profileID);
			if(player) {
				let winPercent = player.winPercent;
				let streak = player.streak;
				let responseString = player.name + " is currently rank " + player.rank + " with an ELO of " + player.rating + ". They are " + player.wins + "-" + player.losses + " (" + winPercent.toFixed() + "%).";
				if(streak < -1 || streak > 1) {
					responseString += " They are on a " + Math.abs(streak) + " game " + ((streak > 0) ? "winning" : "losing") + " streak.";
				}
				res.status(200).send(responseString);
				res.end();
			} else {
				res.status(200).send("Could not find player " + username + ". Make sure you typed the name correctly and they have completed at least 10 matches.");
				res.end();
			}
			break;
		case 204:
			res.status(200).send("Could not find player " + username);
			res.end();
			break;
		case 500:
			res.status(200).send("Remote API is having issues. Try again later.");
			res.end();
			break;
		default:
			console.log("UNEXPECTED ERROR!", username, response);
			res.status(500).send("An unexpected error occurred: " + response.status + ".");
			res.end();
			break;
	}
}

function stringIsNullOrEmpty(str) {
	return !str || str.trim().length <= 0;
}

async function getResult(mode, username, profileID) {
	let url;
	let response;
	if(mode == "official") {
		url = "https://api.ageofempires.com/api/ageiv/Leaderboard";
		let data = `{
		  "region": "7",
		  "versus": "players",
		  "matchType": "unranked",
		  "teamSize": "1v1",
		  "searchPlayer": "${username}",
		  "page": 1,
		  "count": 1
		}`;
		response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			cache: 'no-cache',
			body: data
		});
	}
	if(mode == "aoeiv") {
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
	if(mode == "aoe4world") {
		if(!stringIsNullOrEmpty(username)) {
			url = "https://aoe4world.com/api/v0/leaderboards/qm_1v1?query=" + encodeURIComponent(username);
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

function parseResult(result, mode, username, profileID) {
	if(mode == "official") {
		let searchField = "userName";
		let searchTerm = username;
		if(stringIsNullOrEmpty(username)) {
			searchTerm = profileID;
			searchField = "rlUserId";
		}
		let player = result.items.find(player => {
			return player[searchField] == searchTerm;
		});
		if(!player) {
			return null;
		}
		return {
			name: player.userName,
			rank: player.rank,
			rating: player.elo,
			winPercent: player.winPercent,
			streak: player.winStreak,
			wins: player.wins,
			losses: player.losses
		};
	}
	if(mode == "aoeiv") {
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
	if(mode == "aoe4world") {
		let player;
		let name;
		if(!stringIsNullOrEmpty(username)) {
			player = result.players[0];
			name = player.name;
		} else {
			player = result.modes.qm_1v1;
			name = result.name;
		}
		let winPercent = player.win_rate;
		return {
			name,
			rank: player.rank,
			rating: player.rating,
			winPercent,
			streak: player.streak,
			wins: player.wins_count,
			losses: player.games_count - player.wins_count
		};
	}
	return null;
}
