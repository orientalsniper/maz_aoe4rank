import { NextApiRequest, NextApiResponse } from 'next';

export default async function (req: NextApiRequest, res: NextApiResponse) {
	let username: string = req.query.username;
	if(!username) {
		res.status(400).send('No username provided!');
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
	  "count": 100
	}`;
	
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: data
	});
	const json = await response.json();

    json.items.forEach(player => {
      	if(player.userName === username) {
        	res.status(200).send(username + " is currently rank " + player.rank);
			return;
        }
    });
   	res.status(200).send("Could not find player " + username + " in " + json.count + " elements");
}