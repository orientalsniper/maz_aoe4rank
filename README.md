# MazGrasls API stack

This is a very barebone next.js project (created from the next.js example) in which I want to incorporate small APIs for various stuff I'm interested in.

## AoE4 rank data

I've added a middleware API that Nightbot (from Twitch chat) can call on to display Age of Empires 4 stats about a player.
The AoE4 API operates on POST requests (since it was programmed for the search form on their website https://www.ageofempires.com/stats/ageiv/), but Nightbot can only do GET requests with its URLfetch command.
Over time I've added support for the aoeiv.net API as well as aoe4world.com API. While they both use GET requests (so you could parse them directly with Nightbot commands), it's less convoluted to just use this API.

You can call https://maz-aoe4rank.vercel.app/api/rank?username=[username] (replace [username] with a player name - it can also be a partial name), it will print a message about the players rank, win-loss stats, and current streak.

### Nightbot commands

For a generic command:
```$(urlfetch https://maz-aoe4rank.vercel.app/api/rank?username=$(query))```

Example: To add the command: ```!commands add !aoe4rank $(urlfetch https://maz-aoe4rank.vercel.app/api/rank?username=$(query))```

To call on it: ```!aoe4rank DeMusliM```

If you want to make a fallback for a specific player (i.e. if the username is empty):

```!commands add !aoe4rank $(urlfetch https://maz-aoe4rank.vercel.app/api/rank?username=$(query)&defaultuser=DeMusliM)```

Or if you know the players profile ID, you can also use:

```!commands add !aoe4rank $(urlfetch https://maz-aoe4rank.vercel.app/api/rank?username=$(query)&profileid=6943917)```

The search priority is: username > defaultuser > profileid. If all are empty, an error is shown.

Other parameters:
* mode: Allowed values: "official", "aoeiv" and "aoe4world". Allows you to specify which API you want to call from. If the specified API does not return a valid result, another API is used. Default order is "aoe4world", then "aoeiv", then "official".
* ranked: Allowed values: "ranked" and "unranked". Allows you to specify whether to search for ranked stats or unranked. Default value is "ranked".

## Building & Deployment

If you have npm installed, you can run the project locally with "npm run dev".
If you want to host your own version, make a copy and deploy it via Vercel (or a similar service). Before deployment, I would suggest you run "npm run build" first to ensure there are no compilation errors.

## Notes

Next.js works with Typescript, so if you want to look through the source files I would suggest you learn about the basics of Typescript first.
