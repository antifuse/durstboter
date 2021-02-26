import Discord = require("discord.js");
import fs = require("fs");
import "reflect-metadata";
import cron = require("node-cron");
import { Guild } from "./entity/guild"
import log from "./log";
import { Connection, createConnection } from "typeorm";


interface command {
    do: Function,
    cog: string
}

export function ServerOnly(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        descriptor.value = (message: Discord.Message, ...args: any[]) => {
            if (!message.member) return;
            method.apply(this, [message].concat(args));
        }
}


export function Restricted(requiredPerms: Discord.PermissionResolvable[]) {
    return function(_target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) {
        const method = descriptor.value;
        descriptor.value = (message: Discord.Message, ...args: any[]) => {
            if (!message.member) {
                method.apply(this, [message].concat(args));
            } 
            else {
                for (let permission of requiredPerms) {
                    if (!message.member.permissionsIn(message.channel).has(permission)) {
                        message.channel.send('<:wirklich:711126263514792019>');
                        return;
                    }
                }
                method.apply(this, [message].concat(args));
            }
        }
    }
}

export function Command(options?: {name?: string, aliases?: string[], cog?: string}) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        options = options || {};
        let primaryName = options.name || propertyKey;
        bot.commands.set(primaryName.toLowerCase(), {do: descriptor.value, cog: options.cog || "std"});
        options.aliases?.forEach(alias => bot.commands.set(alias, {do: descriptor.value, cog: options.cog || "std"}));
    }
}

export class Bot {
    cfg: any;
    cache: {guilds: Discord.Collection<string, Guild>, cogs: string[]};
    db: Connection;
    client: Discord.Client;
    commands: Discord.Collection<string, command>;
    constructor(config: string) {
        this.cfg = JSON.parse(fs.readFileSync(config, {encoding: "utf-8"}));
        this.client = new Discord.Client();
        this.commands = new Discord.Collection();
        this.cache = {guilds: new Discord.Collection(), cogs: []};
    }

    async start() {
        await this.client.login(this.cfg.token);
        await this.initialiseDB();
        this.client.on("message", this.handleMessage.bind(this));
    }

    async handleMessage(message: Discord.Message) {
        log.info(`${message.author.tag}/${message.channel.toString()}: ${message.content}`);
        if (message.author.bot) return;
        if (message.channel.type === 'text') {
            let last2 = (await message.channel.messages.fetch({ before: message.id, limit: 2 })).array();
            if (!last2[0].author.bot && !last2[1].author.bot && message.content == last2[0].content && message.content == last2[1].content && !last2[0].author.equals(last2[1].author) && !message.author.equals(last2[0].author) && !message.author.equals(last2[1].author)) message.channel.send(message.content);
        }
        let prefix = this.cache.guilds.get(message.guild.id).prefix;
        if (!message.content.startsWith(prefix)) return;
        let args = message.content.slice(prefix.length).split(/ +/);
        let command = this.commands.get(args.shift().toLowerCase());
        if (command && (this.cache.guilds.get(message.guild.id).activatedCogs.includes(command.cog) || command.cog == "std")) {
            command.do(message, args, this);
        }
    }

    async initialiseDB() {
        this.db = await createConnection();
        await this.updateCache();
        this.client.guilds.cache.forEach((_guild,id) => {
            if (!this.cache.guilds.find(g => g.id == id)) {
                let guild = new Guild(id);
                this.cache.guilds.set(id, guild);
                guild.save();
            }
        });
        this.commands.forEach((command) => {
            if (!this.cache.cogs.includes(command.cog)) {
                this.cache.cogs.push(command.cog);
            }
        });
    }

    async updateCache() {
        let guilds = await Guild.find();
        this.cache.guilds = new Discord.Collection();
        guilds.forEach(guild => this.cache.guilds.set(guild.id, guild));
    }
}

let bot = new Bot("./config.json");
import "./cogs/apis"
import "./cogs/standard"
bot.start().then(()=> {
    log.info(`Connected and initialised with ${bot.cache.cogs.length} cogs and ${bot.cache.guilds.size} guilds. Listening.`)
});


