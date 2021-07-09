import { Guild, Message, MessageEmbed } from "discord.js";
import Bot from "../bot";
import { Cog, Command, Module } from "../cog";
import User from "../entity/user";
import Last from "lastfm-typed";
import log from "../log";

@Cog("lastfm") 
export class LastFM extends Module {

    @Command({aliases: ["last", "fm", "lfm"]})
    async lastfm(message: Message, args: string[], bot: Bot) {
        if (args.length > 0 && args[0] == "set") {
            if (!args[1]) {
                message.channel.send("<:wirklich:711126263514792019>");
                return;
            }
            if (!bot.cache.users.has(message.author.id)) {
                let u = new User(message.author.id);
                u.fmname = args[1];
                bot.cache.users.set(message.author.id, u);
                u.save();
            } else {
                let u = bot.cache.users.get(message.author.id);
                u.fmname = args[1];
                u.save();
            }
            message.channel.send(`Du hast ${args[1]} als last.fm-Account verknüpft!`);
            return;
        }
        let queryName;
        if (args[0] && args[0].match(/<@!?\d+>/)) {
            queryName = bot.cache.users.get(message.mentions.users.array()[0].id)?.fmname;
            if (!queryName) {
                message.channel.send("Diese\\*r Nutzer\\*in hat keinen last.fm-Account verknüpft!");
                return;
            }
        }
        else queryName = args[0] || bot.cache.users.get(message.author.id)?.fmname; 
        if (!queryName) {
            message.channel.send("Du hast keinen Namen angegeben und keinen last.fm-Account verknüpft!");
            return;
        }
        let fm = new Last(bot.cfg.fmkey);
        fm.user.getRecentTracks(queryName).then(val => {
            let reply: MessageEmbed;
            if (val.tracks[0].nowplaying) {
                reply = new MessageEmbed({
                    author: {name: `${val.meta.user} hört gerade:`},
                    title: val.tracks[0].name,
                    url: val.tracks[0].url,
                    thumbnail: val.tracks[0].image.reverse()[0],
                    color: "#387d6c"
                });
                if (val.tracks[0].artist.name) reply.addField("Artist", val.tracks[0].artist.name, true);
                if (val.tracks[0].album.name) reply.addField("Album", val.tracks[0].album.name, true);
            }
            else reply = new MessageEmbed({
                author: {name: `${val.meta.user} hört gerade:`},
                title: "Nichts.",
                color: "#dc3c2e"
            })
            message.channel.send(reply);
            
        }).catch(reject => {
            message.channel.send("Diese\\*r Nutzer\\*in wurde leider nicht gefunden!")
            console.log(reject);
        })
    }
}

export default LastFM;