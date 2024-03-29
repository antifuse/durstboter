import { DMChannel, Message, MessageEmbed, TextChannel } from "discord.js";
import Bot from "../bot";
import { Cog, Command, Module, Restricted, ServerOnly } from "../cog";
import log from "../log";
import { exec } from "child_process";
import { loggers } from "winston";

@Cog()
export class Standard extends Module {

    @Command()
    async invalidateCache(message: Message, args: string[], bot: Bot) {
        await bot.updateCache();
        message.channel.send("Cache invalidiert.");
    }

    @Command()
    @Restricted(["ADMINISTRATOR"])
    @ServerOnly
    async prefix(message: Message, args: string[], bot: Bot) {
        let guild = bot.cache.guilds.get(message.guild.id);
        if (guild) guild.prefix = args[0] || guild.prefix;
        bot.cache.guilds.set(guild.id, guild);
        await guild.save();
        message.channel.send(`Präfix wurde zu ${guild.prefix} geändert.`)
    }

    @Command({ aliases: ["nick", "setname"] })
    @Restricted(["CHANGE_NICKNAME"])
    @ServerOnly
    async setnick(message: Message, args: string[], bot: Bot) {
        if (args[0]) {
            await message.guild.me.setNickname(args.join(" "));
            message.channel.send("Ich tat es, Lases!");
        }
        else message.channel.send("<:wirklich:711126263514792019>")
    }

    @Command({ aliases: ["activate"] })
    @Restricted(["ADMINISTRATOR"])
    @ServerOnly
    async activateCog(message: Message, args: string[], bot: Bot) {
        let guild = bot.cache.guilds.get(message.guild.id);
        if (bot.modules.has(args[0])) {
            if (guild.activatedCogs.includes(args[0])) message.channel.send(`Der Cog ${args[0]} ist bereits aktiviert!`);
            else {
                guild.activatedCogs.push(args[0]);
                guild.save();
                bot.modules.get(args[0]).onActivation(message.guild);
                message.channel.send(`Der Cog ${args[0]} wurde aktiviert!`);
            }
        } else message.channel.send(`Der Cog ${args[0]} existiert nicht oder ist nicht geladen!`);
    }

    @Command({ aliases: ["deactivate"] })
    @Restricted(["ADMINISTRATOR"])
    @ServerOnly
    async deactivateCog(message: Message, args: string[], bot: Bot) {
        let guild = bot.cache.guilds.get(message.guild.id);
        if (guild.activatedCogs.includes(args[0])) {
            guild.activatedCogs = guild.activatedCogs.filter(c => c != args[0]);
            guild.save();
            message.channel.send(`Der Cog ${args[0]} wurde deaktiviert!`);
        } else message.channel.send(`Der Cog ${args[0]} existiert nicht oder ist nicht geladen!`);
    }

    @Command({ aliases: ["reload"] })
    @Restricted("bot_owner")
    async reloadCog(message: Message, args: string[], bot: Bot) {
        let module: Module;
        try {
            let mod = await import(`./${args[0]}`);
            module = new mod.default(bot);
        } catch (e: any) {
            log.warn(e);
            message.channel.send(`Der Cog ${args[0]} kann nicht geladen werden!`);
            return;
        }
        module.onInit();
        log.info(`Module activated with name ${module.name}`);
        bot.modules.set(module.name, module);
        message.channel.send(`Der Cog ${module.name} wurde geladen!`);
    }

    @Command({ aliases: ["pull"] })
    @Restricted("bot_owner")
    async update(message: Message, args: string[], bot: Bot) {
        exec(`git pull ${args.join(" ") || ""}`, async (err, stdout, stderr) => {
            log.warn(stderr);
            log.info(stdout);
            await message.channel.send("```\n" + stdout + "```");
            await message.channel.send("Restarting...");
            exec("pm2 restart dursti")
        });
    }

    @Command({ aliases: ["log"]})
    @Restricted("bot_owner")
    async logs(message: Message, args: string[], bot: Bot) {
        log.query({limit: 15, start: 0, order: "asc", fields: ["message", "timestamp"]}, (err, res) => {
            message.channel.send("```\n" + res.file.map(m => `${m.timestamp} | ${m.message}`).join("\n") + "```");
            console.log(res);
        });
    }

    @Command({ aliases: ["ava", "pfp", "profilbild", "pb"] })
    @ServerOnly
    avatar(message: Message, args: string[], bot: Bot) {
        let fetchUsers = async function (message: Message, args: string[]) {
            let mentioned = message.mentions.members.array();
            if (mentioned.length < 1) {
                for (let arg of args) {
                    let user = undefined;
                    let fetched = await message.guild.members.fetch({ query: arg, limit: 1 });
                    user = fetched.array()[0];
                    if (user) mentioned.push(user);
                }
            }
            return mentioned;
        }
        let mentionedUsers = fetchUsers(message, args).then(r => {
            if (r.length < 1) {
                message.channel.send(
                    new MessageEmbed()
                        .setColor(message.member.displayHexColor)
                        .setTitle(`Avatar von ${message.author.tag}`)
                        .setImage(message.author.avatarURL({ size: 4096 }))
                ).catch(reason => log.error(reason));
                return;
            }
            for (let user of r) {
                message.channel.send(
                    new MessageEmbed()
                        .setColor(user.displayHexColor)
                        .setTitle(`Avatar von ${user.user.tag}`)
                        .setImage(user.user.avatarURL({ size: 4096 }))
                ).catch(reason => log.error(reason));
            }
        }
        );
    }


    @Command({ aliases: ["lösch", "delete"] })
    @Restricted(["MANAGE_MESSAGES"])
    loesch(message: Message, args: string[], bot: Bot) {
        if (!args.length || isNaN(parseInt(args[0])) || message.channel instanceof DMChannel) {
            message.channel.send('<:wirklich:711126263514792019>');
            return;
        }
        message.channel.bulkDelete(parseInt(args[0]) + 1)
            .then(messages => log.info(`Löschte ${messages.size} Nachrichten`));
    }

    @Command({ aliases: ["ing"] })
    ping(message: Message, args: string[], bot: Bot) {
        message.channel.send('<:glatt:721807880264613943>').then(() => log.info("Wurde gepingt, glattierte zurück."));
    }

    @Command()
    async sendmsg(message: Message, args: string[], bot: Bot) {
        message.client.channels.fetch(args[0]).then(channel => {
            if (channel instanceof TextChannel) {
                args.shift();
                channel.send(args.join(" ") || "_ _").catch(log.error);
            }
        }).catch(_ => {
            message.client.users.fetch(args[0]).then(user => {
                let channel = user.dmChannel;
                if (channel instanceof DMChannel) {
                    args.shift();
                    channel.send(args.join(" ") || "_ _").catch(log.error);
                }
            }, err => log.error(err));
        });
    }
}

export default Standard;