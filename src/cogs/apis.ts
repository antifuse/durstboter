import * as Axios from "axios";
import { Message } from "discord.js";
import { Cog, Command, Module } from "../cog";
import { Bot } from "../index";
import log from "../log";
const axios = Axios.default;

@Cog("fun")
export default class Funnyapis extends Module {

    constructor() {
        super();
    }
    
    @Command({aliases: ["inspirobot", "ibot"]})
    inspire(message: Message, args: string[], bot: Bot) {
        axios.get('http://inspirobot.me/api?generate=true')
            .then(r=>{
                message.channel.send({files: [r.data]}).then(()=>log.info('Inspiring pic sent.'))
            });
    }

    handleMessage(message: Message, bot: Bot) {
        super.handleMessage(message, bot);
    }
    
}
