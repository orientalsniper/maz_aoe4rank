import { NextApiRequest, NextApiResponse } from 'next';

export default async function (req: NextApiRequest, res: NextApiResponse) {
	let username: string = req.query.username as string;
	if(!username) {
		// Nightbot only seems to print the message when urlfetch returns status 200, otherwise I would use a 4xx status here
		res.status(200).send('No username provided!');
		res.end();
		return;
	}
	var url = "https://api.ageofempires.com/api/ageiv/Leaderboard";

	var data = `{
	  "region": "7",
	  "versus": "players",
	  "matchType": "unranked",
	  "teamSize": "1v1",
	  "searchPlayer": "${username}",
	  "page": 1,
	  "count": 1
	}`;
	
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		cache: 'no-cache',
		body: data
	});
	console.log(response);
	switch(response.status) {
		case 200:
			const json = await response.json();
			console.log(json);

			let found = false;
			let responseString = JSON.stringify(json.items);
			json.items.forEach(player => {
				if(!found && player.userName === username) {
					responseString = username + " is currently rank " + player.rank + ". They are " + player.wins + "-" + player.losses + " (" + player.winPercent + "%).";
					if(player.winStreak != 0) {
						responseString += " They are on a " + Math.abs(player.winStreak) + " game " + ((player.winStreak > 0) ? "winning" : "losing") + " streak.";
					}
					res.status(200).send(responseString);
					res.end();
					found = true;
				}
			});
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