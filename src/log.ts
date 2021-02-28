import * as winston from "winston";
import * as chalk from "chalk";
export default winston.createLogger({
    format: winston.format.combine(winston.format.timestamp({format:"YYYY-MM-DD HH:mm:ss"}), winston.format.printf(info=>`${info.timestamp} ${colourLevel(info.level)} | ${info.message}`)),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: "durst.log"})
    ]
})

function colourLevel(level: string) {
    switch(level) {
        case "info": return chalk.bgGreen(level);
        case "warn": return chalk.bgYellow(level);
        case "error": return chalk.bgRed(level);
    }
}