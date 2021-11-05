# MazGrasls API stack

This is a very barebone next.js project (created from the next.js example) in which I want to incorporate small APIs for various stuff I'm interested in.

## AoE4 rank data

I've added a middleware API that Nightbot (from Twitch chat) can call on to display Age of Empires 4 stats about a player.
The AoE4 API operates on POST requests (since it was programmed for the search form on their website https://www.ageofempires.com/stats/ageiv/), but Nightbot can only do GET requests with its URLfetch command.

You can call https://maz-aoe4rank.vercel.app/api/rank?username=[username] (replace [username] with a player name - make sure that it matches case and special chars exactly like it is in AoE4), it will print a message about the players rank, win-loss stats, and current streak.

### Nightbot commands

For a generic command: $(urlfetch https://maz-aoe4rank.vercel.app/api/rank?username=$(query)) 
Example: To add the command: !commands add !aoe4rank $(urlfetch https://maz-aoe4rank.vercel.app/api/rank?username=$(query))
		 To call on it: !aoe4rank DeMusliM
If you want to make a command for a specific player, you can replace $(query) with his username too, e.g. !commands add !aoe4rank $(urlfetch https://maz-aoe4rank.vercel.app/api/rank?username=DeMusliM)

## Building & Deployment

If you have npm installed, you can run the project locally with "npm run dev".
If you want to host your own version, make a copy and deploy it via Vercel (or a similar service). Before deployment, I would suggest you run "npm run build" first to ensure there are no compilation errors.

## Notes

Next.js works with Typescript, so if you want to look through the source files I would suggest you learn about the basics of Typescript first.
