import { NextApiRequest, NextApiResponse } from 'next';

export default async function (req: NextApiRequest, res: NextApiResponse) {
	// username to search for
	let username: string = req.query.username as string;
	// use this as username if username is empty (primarily used for Nightbot commands)
	let defaultUser: string = req.query.defaultuser as string;
	// profile ID of a user, only used if username and defaultUser are empty
	let profileID: string = req.query.profileid as string;
	if(stringIsNullOrEmpty(username)) {
		username = defaultUser;
	}
	let responseMessage = "";
	if(stringIsNullOrEmpty(username) && stringIsNullOrEmpty(profileID)) {
		// Nightbot only seems to print the message when urlfetch returns status 200, otherwise I would use a 4xx status here
		res.status(200).send('No username provided!');
		res.end();
		return;
	}
	if(stringIsNullOrEmpty(profileID)) {
		let response = await fetch("https://aoe4world.com/api/v0/players/search?query=" + username, {
			method: 'GET',
			headers: { 'Content-Type': 'application/json' },
			cache: 'no-cache'
		});
		const json = await response.json();
		if(!!json.count) {
			profileID = json.players[0].profile_id;
		}
	}
	let url = "https://aoe4world.com/api/v0/players/" + profileID + "/games/last";
	let response = await fetch(url, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
		cache: 'no-cache'
	});
	if(response.status == 200) {
		const json = await response.json();
		console.log(json);
		if(!json.teams) {
			res.status(200).send("Error while getting user from API");
			res.end();
			return;
		}
		let player;
		json.teams.forEach(team => {
			let pl = team.find(p => p.profile_id == profileID);
			if(pl) {
				player = pl;
			}
		});
		if(!player) {
			res.status(200).send("Could not find player in game list");
			res.end();
			return;
		}
		responseMessage = player.name + ": \n";
		let civNames = {
			"holy_roman_empire": "HRE",
			"abbasid_dynasty": "Abbasid",
			"mongols": "Mongols",
			"rus": "Rus",
			"chinese": "China",
			"delhi_sultanate": "Delhi",
			"english": "English",
			"french": "French"
		};
		let civs = player.modes.qm_1v1.civilizations;
		civs.forEach(civ => {
			console.log(civ);
			let civString = civ.civilization as string;
			civString = civNames[civString] || civString;
/*			civString = civString.replace(/_/g, " ");
			civString = civString.slice(0,1).toUpperCase() + civString.slice(1);*/
			responseMessage += civString + ": Won: " + civ.win_rate.toFixed() + "%, Picked: " + civ.pick_rate.toFixed() + "%, " + civ.games_count + " games; \n";
		});
		res.status(200).send(responseMessage);
		res.end();
	}
}

function stringIsNullOrEmpty(str) {
	return !str || str.trim().length <= 0;
}