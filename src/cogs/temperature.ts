import axios from "axios";
import { Message } from "discord.js";
import { Bot } from "..";
import { Cog, Command, Module } from "../cog";

@Cog("temp")
export default class Temp extends Module {
    @Command()
    antitemp(message: Message, args: string[], bot: Bot) {
        axios.get("http://localhost:3328/temp").then(res => {
            message.channel.send(`Die Temperatur in Antis Zimmer beträgt ${res.data.temperature} °C bei einer relativen Luftfeuchtigkeit von ${res.data.humidity}%`);
        });
    }
}