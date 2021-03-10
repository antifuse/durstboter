import Discord = require("discord.js");
import fs = require("fs");
import "reflect-metadata";
import * as chalk from "chalk";
import { Guild } from "./entity/guild"
import log from "./log";
import { Connection, createConnection } from "typeorm";
import cogs from "./cogs/"

export class Bot {
    cfg: any;
    cache: {guilds: Discord.Collection<string, Guild>};
    db: Connection;
    client: Discord.Client;
    modules: Discord.Collection<string, Module>;
    constructor(config: string, cogs: any[]) {
        this.cfg = JSON.parse(fs.readFileSync(config, {encoding: "utf-8"}));
        this.client = new Discord.Client();
        this.modules = new Discord.Collection();
        this.cache = {guilds: new Discord.Collection()};
        cogs.forEach(cog => {
            let c = new cog();
            this.modules.set(c.name, c);
        })
    }

    async start() {
        await this.client.login(this.cfg.token);
        await this.initialiseDB();
        this.client.on("message", this.handleMessage.bind(this));
        this.client.on("guildCreate", this.serverJoin.bind(this));
    }

    async handleMessage(message: Discord.Message) {
        log.info(`${chalk.cyan(message.author.tag)}/${message.channel.type == "text" ? chalk.gray(message.channel.name):"DM"}: ${message.content}`);
        let guild = this.cache.guilds.get(message.guild?.id);
        if (guild) guild.activatedCogs.forEach(c => {
            if (c != "std") this.modules.get(c)?.handleMessage(message, this);
        });
        this.modules.get("std").handleMessage(message, this);
    }

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
    }

    async serverJoin(joined: Discord.Guild) {
        if (!this.cache.guilds.has(joined.id)) {
            let guild = new Guild(joined.id);
            this.cache.guilds.set(joined.id, guild);
            guild.save();
        }
    }
}

let bot = new Bot("./config.json", cogs);

import { Module } from "./cog";
bot.start().then(()=> {
    log.info(`Connected and initialised with ${bot.modules.size} cogs and ${bot.cache.guilds.size} guilds. Listening.`)
});
