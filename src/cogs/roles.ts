import { Collection, Message, MessageEmbed, MessageReaction, ReactionCollector, User } from "discord.js";
import { Bot } from "..";
import { Cog, Command, Module, Restricted, ServerOnly } from "../cog";
import { RoleMessage } from "../entity/rolemessage";
import log from "../log";
const regexc = /\s*(<a?:.+:(\d+)>)\s*:\s*(.+)\s*$/gm;
const regexu = /\s*()([^:\s]+)\s*:\s*(.+)\s*$/gm;
@Cog("roles")
export default class ReactionRoles extends Module {

    messages: Collection<string, RoleMessage> = new Collection();

    onInit() {
        this.messages = new Collection();
        RoleMessage.find().then(rms => {
            rms.forEach(rm => this.messages.set(rm.message, rm));
        });

        this.bot.client.on("messageReactionAdd", this.toggleRole.bind(this))
        this.bot.client.on("messageReactionRemove", this.toggleRole.bind(this))
        log.info("Reaction roles initialised!")
    }

    @Command({ aliases: ["registerroles"] })
    @Restricted(["MANAGE_ROLES"])
    @ServerOnly
    async reactionroles(message: Message, args: string[], bot: Bot) {
        if (args.length == 0) {
            message.channel.send("<:wirklich:711126263514792019>")
            return;
        }
        let mess = await message.channel.messages.fetch(args.shift()).catch(undefined);
        if (!mess || mess.deleted) return;
        let emojis = [];
        let roles = [];
        for (let arg of args.join(" ").split(/;\s*/)) {
            console.log(arg);
            let rres = /\s*(<a?:.+:(\d+)>)\s*:\s*(.+)\s*$/gm.exec(arg) || /\s*()([^:\s]+)\s*:\s*(.+)\s*$/gm.exec(arg);
            console.log(rres);
            let name = rres[3];
            let emoji = rres[2];
            if (!emoji) continue;
            message.guild.roles.fetch(undefined, true);
            let role = message.guild.roles.cache.find(role => role.name == name);
            if (!role) role = await message.guild.roles.create({ data: { name: name } });
            roles.push(role.id);
            emojis.push(emoji);
            mess.react(rres[1] || emoji).catch(reason => {/* fuck it */ });
            log.info(`Emoji ${emoji} maps to ${role.id} role`);
        }
        (bot.modules.get("roles") as ReactionRoles).registerSelector(mess,emojis,roles);
    }

    async registerSelector(mess: Message, emojis: string[], roles: string[]) {
        let rm = this.messages.get(mess.id) || new RoleMessage(mess.id);
        emojis.forEach(e => rm.emoji.push(e));
        roles.forEach(r => rm.roles.push(r));
        rm.save();
        this.messages.set(mess.id, rm);
    }

    async toggleRole(reaction: MessageReaction, user: User) {
        if (reaction.partial) reaction = await reaction.fetch();
        let mess = await reaction.message.fetch();
        let rm = this.messages.get(mess.id);
        if (rm) {
            let index = rm.emoji.lastIndexOf(reaction.emoji.id || reaction.emoji.name);
            if (index == -1) return;
            let role = rm.roles[index];
            let member = await reaction.message.guild.members.fetch(user.id);
            if (member.roles.cache.has(role)) member.roles.remove(role);
            else member.roles.add(role);
        }
    }
}