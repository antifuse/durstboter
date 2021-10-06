/**
 * @module Bot
 */

import * as Discord from "discord.js";
import { Connection, createConnection } from "typeorm";
import { Module } from "./cog";
import Guild from "./entity/guild";
import User from "./entity/user";
import * as fs from "fs";
import log from "./log";
import chalk from "chalk";

/**
 * The Durstboter instance.
 * 
 * @remarks 
 * The bot class contains both the discord.js client instance and the database access / cache. It also allows access to all activated modules.
 */
 export class Bot {

    /**
     * The bot's configuration object, loaded from config.json on startup.
     */
    public cfg: any;

    /**
     * The bot's DB cache, containing cached user-specific and guild-specific data. 
     * 
     * @remarks 
     * May be updated and extended at a later point, allowing for channel-specific data etc. 
     * As the bot grows, more functions may warrant storage of more data. See {@link Guild} and {@link User} for more info.
     */
    public cache: {guilds: Discord.Collection<string, Guild>, users: Discord.Collection<string, User>};

    /**
     * The TypeORM database connection. 
     */
    public db: Connection;

    /**
     * The discord client the bot is running on. 
     * @remarks This is declared as public to make event handling available to all modules.
     */
    public client: Discord.Client;

    /**
     * The modules available to the bot, each handling their own commands.
     */
    public modules: Discord.Collection<string, Module>;

    /**
     * Creates a new bot instance with the given configuration and modules.
     * @param config Path to the configuration file
     * @param cogs The modules to load as bot cogs
     */
    constructor(config: string, cogs: any[]) {
        this.cfg = JSON.parse(fs.readFileSync(config, {encoding: "utf-8"}));
        this.client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
        this.modules = new Discord.Collection();
        this.cache = {guilds: new Discord.Collection(), users: new Discord.Collection()};
        cogs.forEach(cog => {
            let c: Module = new cog(this);
            this.modules.set(c.name, c);
        })
    }

    /**
     * Starts the bot by loading the database into the bot's cache and logging in.
     */
    async start() {
        await this.client.login(this.cfg.token);
        await this.initialiseDB();
        this.modules.forEach(m => m.onInit());
        this.client.on("message", this.handleMessage.bind(this));
        this.client.on("guildCreate", this.serverJoin.bind(this));
    }

    /**
     * The global message handler, delegates messages to the activated modules' own message handling methods.
     * @param message The message to handle
     */
    async handleMessage(message: Discord.Message) {
        if (message.channel.type == "dm") log.info(`${message.author.tag}/DM: ${message.content}`)
        let guild = this.cache.guilds.get(message.guild?.id);
        if (guild) guild.activatedCogs.forEach(c => {
            if (c != "std") this.modules.get(c)?.handleMessage(message, this);
        });
        this.modules.get("std").handleMessage(message, this);
    }

    /**
     * Initialises the database by creating entries for each guild the bot is in.
     */
    async initialiseDB() {
        this.db = await createConnection();
        await this.updateCache();
        this.client.guilds.cache.forEach((_guild,id) => {
            if (!this.cache.guilds.has(id)) {
                let guild = new Guild(id);
                this.cache.guilds.set(id, guild);
                guild.save();
            }
        });
    }

    async updateCache() {
        let guilds = await Guild.find();
        this.cache.guilds = new Discord.Collection();
        guilds.forEach(guild => this.cache.guilds.set(guild.id, guild));
        let users = await User.find();
        this.cache.users = new Discord.Collection();
        users.forEach(user => this.cache.users.set(user.id, user));
        this.modules.forEach(m => m.updateCache());
    }

    /**
     * Helper method to handle new guilds, saving them to the database.
     * @param joined The guild that was joined
     */
    async serverJoin(joined: Discord.Guild) {
        if (!this.cache.guilds.has(joined.id)) {
            let guild = new Guild(joined.id);
            this.cache.guilds.set(joined.id, guild);
            guild.save();
        }
    }
    
}

export default Bot;