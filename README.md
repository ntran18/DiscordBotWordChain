# DiscordBotWordChain

A discord bot that written in JavaScript to play word chain game.

In order to add the bot to your discord server, click on this [link](https://discord.com/api/oauth2/authorize?client_id=1107012080856465460&permissions=8&scope=bot+applications.commands)

_Currently this discord bot only can be added by Maika Tran because it is still underdevelopment._

## Word Chain

The word chain game, also known as the word association game or the word link game, is a popular linguistic and cognitive game where players take turns to come up with words that are connected to the previous word based on a specific rule or criteria. In this game, the criteria is that the first letter of the come up word has to matcch with the last letter of the previous word.

## Features

1. Slash-only commands (no prefix commands)
2. Auto-generated help list
3. Word definition embed
4. Word-chain game with configurable limits
5. Requests are logged per guild and sent to owner via DM

## Commands

### Public

- /help
- /def <word>
- /request <message>

### Admin (Administrator permission)

- /wordchain [channel]
- /reset
- /maxword <value>
- /addrole <role> <botname>
- /removerole <role> <botname>
- /removeusersbyrole <role>
- /setlogchannel set <channel>
- /setlogchannel disable
- /settyping set <value>
- /settyping reset

### Owner only

- /sync (global command re-register)

## Environment variables

Create a .env with:

- TOKEN (Discord bot token)
- MONGO_URI (MongoDB connection string)
- RAPIDAPI_KEY (definition API)
- OWNER_ID (bot owner user ID)

## Example

1. Help command

 <img width="408" alt="image" src="https://github.com/ntran18/DiscordBotWordChain/assets/108908370/436d6e57-4a6f-44bc-afcb-b9c69b3ebd11">

2. Get Definition Command

 <img width="550" alt="image" src="https://github.com/ntran18/DiscordBotWordChain/assets/108908370/d566808c-4c25-490d-8cde-f95b83d8a88e">

3. How the bot run

 <img width="189" alt="image" src="https://github.com/ntran18/DiscordBotWordChain/assets/108908370/f93d4387-4341-46c1-b69a-2ed996d7705e">
