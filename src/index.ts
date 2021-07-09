/**
 * Entry point for the bot. This is where the stuff happens.
 * @module Index
 */

import "reflect-metadata";
import Bot from "./bot";
import cogs from "./cogs/";
import log from "./log";

let bot = new Bot("./config.json", cogs);

bot.start().then(()=> {
    log.info(`Connected and initialised with ${bot.modules.size} cogs and ${bot.cache.guilds.size} guilds. Listening.`);
});
