import { Collection, DMChannel, GuildEmoji, Message, MessageEmbed, ReactionEmoji, TextChannel } from "discord.js";
import { Bot } from "..";
import { Cog, Command, Module } from "../cog"
import { BrettMessage } from "../entity/brettmessage";
import log from "../log";

@Cog("brett")
export default class Brett extends Module {

    messages: Collection<string, BrettMessage> = new Collection();

    onInit() {
        BrettMessage.find().then(ms => {
            this.messages = new Collection();
            ms.forEach(m => this.messages.set(m.original, m));
        });

        this.bot.client.on("messageReactionAdd", (reaction, user) => {this.reactionUpdate(reaction.message)});
        this.bot.client.on("messageReactionRemove", (reaction, user) => {this.reactionUpdate(reaction.message)});
    }

    async reactionUpdate(message: Message) {
        if (message.guild) {
            let guildEntry = this.bot.cache.guilds.get(message.guild.id);
            if (!guildEntry.activatedCogs.includes(this.name) || !guildEntry.brettChannel || guildEntry.brettExcluded.includes(message.channel.id)) return;
            let brettChannel = await message.client.channels.fetch(guildEntry.brettChannel);
            if (!(brettChannel instanceof TextChannel)) return;
            let countedrs: [string, number][] = [];
            await message.fetch();
            for (let reaction of message.reactions.cache.array()) {
                if ((reaction.emoji.id && reaction.emoji instanceof ReactionEmoji) || (reaction.emoji instanceof GuildEmoji && !reaction.emoji.available)) countedrs.push([":" + reaction.emoji.name + ":", reaction.count]);
                else countedrs.push([reaction.emoji.toString(), reaction.count]);
            }
            let soll = Math.max(...countedrs.map(([_, n]) => n)) >= guildEntry.brettThreshold;
            let brettM = this.messages.has(message.id) ? await brettChannel.messages.fetch(this.messages.get(message.id).brett).catch(() => {log.info("Brettnachricht gelöscht, lege neue an.")}) : undefined;
            if (brettM && !brettM.deleted) brettM.edit(countedrs.map(([e, n]) => `${n} x ${e}`).join(", "), brettM.embeds[0]);
            else {
                if (!soll) return;
                let embed = new MessageEmbed({
                    timestamp: message.createdTimestamp,
                    author: {iconURL: message.author.avatarURL(), name: message.author.tag},
                    description: message.content,
                    image: message.attachments.first(),
                    fields: [{name: "Channel", value: message.channel.toString(), inline: true}, {name: "Link", value: `[click](${message.url})`, inline: true}]
                });
                brettChannel.send(countedrs.map(([e, n]) => `${n} x ${e}`).join(", "), embed).then(m => {
                    let mEntry = new BrettMessage(message.id, m.id);
                    this.messages.set(message.id, mEntry);
                    mEntry.save();
                    log.info(`Brett message sent to #${m.channel.type != "dm" ? m.channel.name : m.channel.recipient.username}`);
                });
            }
            
        }
    }

    @Command({aliases: ["brett", "board", "starboard"]})
    sternenbrett(message: Message, args: string[]) {
        if (!message.guild) {
            message.channel.send("<:wirklich:711126263514792019>");
            return;
        }
        let threshold = parseInt(args[0]) || 4;
        let guild = this.bot.cache.guilds.get(message.guild.id);
        if (guild.brettChannel == message.channel.id) {
            guild.brettChannel = null;
            message.channel.send("Du hast die Brett-Funktion deaktiviert.")
        } else {
            guild.brettChannel =  message.channel.id;
            guild.brettThreshold = threshold;
            message.channel.send(`Brett mit Mindestanzahl von ${threshold} Reaktionen eingerichtet.`);
        }
        this.bot.cache.guilds.set(message.guild.id, guild);
        guild.save();
    }

    @Command()
    exclude(message: Message, args: string[]) {
        let guildEntry = this.bot.cache.guilds.get(message.guild.id);
        guildEntry.brettExcluded = guildEntry.brettExcluded || [];
        if (guildEntry.brettExcluded.includes(message.channel.id)) {
            guildEntry.brettExcluded = guildEntry.brettExcluded.filter(e => e != message.channel.id);
            message.channel.send("Dieser Channel ist nicht mehr vom Brett ausgenommen.")
        } else {
            guildEntry.brettExcluded.push(message.channel.id);
            message.channel.send("Dieser Channel ist nun vom Brett ausgenommen.")
        }
        this.bot.cache.guilds.set(guildEntry.id, guildEntry);
        guildEntry.save();
    }

    updateCache() {
        BrettMessage.find().then(ms => {
            this.messages = new Collection();
            ms.forEach(m => this.messages.set(m.original, m));
        });
    }
}