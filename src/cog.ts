import { Collection, DiscordAPIError, Guild, Message, PermissionResolvable } from "discord.js";
import Bot from "./bot";
const Functions = Symbol("Functions");

/**
 * Only allows commands to be run on servers.
 * @category Command Decorator
 */
export function ServerOnly(target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = (message: Message, ...args: any[]) => {
        if (!message.member) return;
        method.apply(this, [message].concat(args));
    }
}

/**
 * Restricts a command to members with all given permissions.
 * @category Command Decorator
 * @param requiredPerms The channel-specific permissions required to run the command.
 */
export function Restricted(requiredPerms: PermissionResolvable[] | "bot_owner") {
    return function (target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) {
        const method = descriptor.value;
        descriptor.value = async (message: Message, ...args: any[]) => {
            if (message.author.id == /*(await message.client.fetchApplication())*/message.application.owner.id) {
                method.apply(this, [message].concat(args));
                return;
            }
            if (requiredPerms == "bot_owner") {
                message.channel.send('<:wirklich:711126263514792019>');
                return;
            }
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

/**
 * Helper decorator to enable command registration.
 * @param name The name of the cog. Defaults to "std" - always give a name for non-standard cogs!
 * @category Module Decorator
 */
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

/**
 * Marks methods as bot commands, registering them with the module.
 * @param options An options object, containing a name and/or an array of aliases.
 * @category Command Decorator
 */
export function Command(options?: { name?: string, aliases?: string[], cog?: string }) {
    return function (target: Module, propertyKey: string, descriptor: PropertyDescriptor) {
        target[Functions] = target[Functions] || new Map();
        options = options || {};
        let primaryName = options.name || propertyKey;
        target[Functions].set(primaryName.toLowerCase(), descriptor.value);
        options.aliases?.forEach(alias => target[Functions].set(alias, descriptor.value));
    }
}

/**
 * The Module class represents a single bot cog, processing messages and events on its own and working mostly independently from the main bot class.
 */
export class Module {

    /**
     * The module's name, usually set by the {@link Cog} decorator.
     */
    public name: string;

    /**
     * A collection of commands mapped to their names and their aliases.
     */
    public commands: Collection<string, Function>;

    /**
     * The bot instance owning this module.
     */
    public bot: Bot;

    /**
     * Creates a new running instance of this module.
     * @param bot The module's parent bot instance.
     */
    public constructor(bot: Bot) {
        this.bot = bot;
    }

    /**
     * The module's message handler. Per default, this delegates the message to all command methods.  
     * @param message The incoming message.
     * @param bot The bot instance receiving the message. Not even needed anymore.
     */
    public handleMessage(message: Message, bot: Bot) {
        let prefix = message.guild ? this.bot.cache.guilds.get(message.guild.id).prefix : this.bot.cfg.dmprefix;
        if (message.content.startsWith(prefix)) {
            let args = message.content.slice(prefix.length).split(/ +/);
            let command = this.commands.get(args.shift().toLowerCase());
            if (command) command.apply(this, [message, args, this.bot]);
        }
    }

    /**
     * Runs when the cog is activated in a guild.
     * @param guild The guild the cog was activated in
     */
    public onActivation(guild: Guild) {}
    /**
     * Runs when the cog is "inserted" into the bot.
     */
    public onInit() {}

    /**
     * Runs when a global cache invalidation is called, should refresh individual modules' caches.
     */
    public updateCache() {}
}