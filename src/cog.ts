import { Collection, DiscordAPIError, Guild, Message, PermissionResolvable } from "discord.js";
import { Bot } from ".";
const Functions = Symbol("Functions");

export function ServerOnly(target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = (message: Message, ...args: any[]) => {
        if (!message.member) return;
        method.apply(this, [message].concat(args));
    }
}


export function Restricted(requiredPerms: PermissionResolvable[]) {
    return function (target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) {
        const method = descriptor.value;
        descriptor.value = (message: Message, ...args: any[]) => {
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

export function Cog(name?: string) {
    return function<T extends { new(...args: any[]): {} }>(Base: T) {
        return class extends Base {
            public name: string;
            public commands: Collection<string, Function>;
            constructor(...args: any[]) {
                super(...args);
                this.name = name || "std";
                this.commands = new Collection();
                Base.prototype[Functions].forEach((fun, call) => {
                    this.commands.set(call, fun.bind(this));
                })
            }
        }
    }
}

export function Command(options?: { name?: string, aliases?: string[], cog?: string }) {
    return function (target: Module, propertyKey: string, descriptor: PropertyDescriptor) {
        target[Functions] = target[Functions] || new Map();
        options = options || {};
        let primaryName = options.name || propertyKey;
        target[Functions].set(primaryName.toLowerCase(), descriptor.value);
        options.aliases?.forEach(alias => target[Functions].set(alias, descriptor.value));
    }
}

export class Module {
    public name: string;
    public commands: Collection<string, Function>;
    public bot: Bot;
    public constructor(bot: Bot) {
        this.bot = bot;
    }
    public handleMessage(message: Message, bot: Bot) {
        let prefix = message.guild ? bot.cache.guilds.get(message.guild.id).prefix : bot.cfg.dmprefix;
        if (message.content.startsWith(prefix)) {
            let args = message.content.slice(prefix.length).split(/ +/);
            let command = this.commands.get(args.shift().toLowerCase());
            if (command) command.apply(this, [message, args, bot]);
        }
    }

    public onActivation(guild: Guild) {}
    public onInit() {}
    public updateCache() {}
}