import * as Axios from "axios";
import { Message } from "discord.js";
import { Cog, Command, Module } from "../cog";
import { Bot } from "../index";
import log from "../log";
const axios = Axios.default;

@Cog("fun")
export default class Fun extends Module {

    constructor() {
        super();
    }

    @Command({ aliases: ["inspirobot", "ibot"] })
    inspire(message: Message, args: string[], bot: Bot) {
        axios.get('http://inspirobot.me/api?generate=true')
            .then(r => {
                message.channel.send({ files: [r.data] }).then(() => log.info('Inspiring pic sent.'))
            });
    }

    async handleMessage(message: Message, bot: Bot) {
        super.handleMessage(message, bot);
        if (message.channel.type === 'text' && !message.author.bot) {
            let last2 = (await message.channel.messages.fetch({ before: message.id, limit: 2 })).array();
            if (last2.length < 2 || !message.content) return;
            if (!last2[0].author.bot && !last2[1].author.bot && message.content == last2[0].content && message.content == last2[1].content && !last2[0].author.equals(last2[1].author) && !message.author.equals(last2[0].author) && !message.author.equals(last2[1].author)) message.channel.send(message.content);
        }
    }

}
