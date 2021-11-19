import { NextApiRequest, NextApiResponse } from 'next';

export default async function (req: NextApiRequest, res: NextApiResponse) {
	let username: string = req.query.username as string;
	let defaultUser: string = req.query.defaultuser as string;
	if(!username && !defaultUser || (username.length <= 0 && defaultUser.length <= 0)) {
		// Nightbot only seems to print the message when urlfetch returns status 200, otherwise I would use a 4xx status here
		res.status(200).send('No username provided!');
		res.end();
		return;
	}
	var url = "https://aoeiv.net/api/leaderboard?game=aoe4&leaderboard_id=17&count=1&start=1";
	if(username && username.trim().length > 0) {
		url += "&search=" + username;
	} else if(defaultUser && defaultUser.length > 0) {
		url += "&search=" + defaultUser;
	}
	console.log(url);

	const response = await fetch(url, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
		cache: 'no-cache'
	});
	console.log(response);

	switch(response.status) {
		case 200:
			const json = await response.json();
			console.log(json);

			let found = false;
			if(json.leaderboard.length > 0) {
				let player = json.leaderboard[0];
				let winPercent = player.wins * 100 / player.games;
				let streak = player.streak;
				let responseString = player.name + " is currently rank " + player.rank + " with an ELO of " + player.rating + ". They are " + player.wins + "-" + player.losses + " (" + winPercent.toFixed() + "%).";
				if(streak < -1 || streak > 1) {
					responseString += " They are on a " + Math.abs(streak) + " game " + ((streak > 0) ? "winning" : "losing") + " streak.";
				}
				res.status(200).send(responseString);
				res.end();
				found = true; 
			}
			if(!found) {
				res.status(200).send("Could not find player " + username + " in " + json.count + " elements. Maybe the API has an internal error. Try again later.");
				res.end();
			}
			break;
		case 204:
			res.status(200).send("Could not find player " + username);
			res.end();
			break;
		default:
			console.log("UNEXPECTED ERROR!", username, response);
			res.status(500).send("An unexpected error occurred: " + response.status + ". Yell at MazGrasl if you see him in chat.");
			res.end();
			break;
	}
}