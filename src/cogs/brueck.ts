import { DMChannel, Message, MessageEmbed, TextChannel } from "discord.js";
import { Bot } from "..";
import { Cog, Command, Module } from "../cog"
import log from "../log";

@Cog("brueck")
export default class Brueck extends Module {

    @Command({aliases: ["brück", "brücke", "bruecke", "tunnel"]})
    async brueck(message: Message, args: string[], bot: Bot) {
        log.info("Brück triggered")
        let channel = await message.client.channels.fetch(args[0]).catch(()=> {
            message.channel.send("<:wirklich:711126263514792019>");
            return;
        });
        if (!channel || !(channel instanceof TextChannel ||channel instanceof DMChannel)) {
            message.channel.send("<:wirklich:711126263514792019>");
            return;
        }
        log.info("Valid channels")
        let cHere = message.channel.createMessageCollector((m: Message)=> m.author.id != m.client.user.id, {time: parseInt(args[1]) * 1000 || 300000 });
        let cThere = channel.createMessageCollector((m: Message)=> m.author.id != m.client.user.id, {time: parseInt(args[1]) * 1000 || 300000 });
        cHere.on("collect", (message: Message) => {
            if (message.content.startsWith(bot.cache.guilds.get(message.guild.id).prefix + "zu")) {
                cHere.stop();
                cThere.stop();
            }
            else {
                if (cThere.channel instanceof TextChannel || cThere.channel instanceof DMChannel) {
                    cThere.channel.send(new MessageEmbed({
                        footer: {text: message.channel.id},
                        author: {iconURL: message.author.avatarURL(), name: message.author.tag},
                        description: message.content,
                        image: message.attachments.first()
                    }));
                }
            }
        });
        cThere.on("collect", (message: Message) => {
            if (message.content.startsWith(bot.cache.guilds.get(message.guild.id).prefix + "zu")) {
                cHere.stop();
                cThere.stop();
                message.delete();
            }
            else {
                if (cHere.channel instanceof TextChannel || cHere.channel instanceof DMChannel) {
                    cHere.channel.send(new MessageEmbed({
                        footer: {text: message.channel.id},
                        author: {iconURL: message.author.avatarURL(), name: message.author.tag},
                        description: message.content,
                        image: message.attachments.first()
                    }));
                }
            }
        });
    }
}
