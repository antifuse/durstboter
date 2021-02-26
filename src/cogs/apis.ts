import * as Axios from "axios";
import { Message } from "discord.js";
import { Bot, Command } from "../index";
import log from "../log";
const axios = Axios.default;

export default class funnyapis {
    
    @Command({aliases: ["inspirobot", "ibot"], cog: "fun"})
    inspire(message: Message, args: string[], bot: Bot) {
        axios.get('http://inspirobot.me/api?generate=true')
            .then(r=>{
                message.channel.send({files: [r.data]}).then(()=>log.info('Inspiring pic sent.'))
            });
    }
    
}
