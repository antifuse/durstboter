import * as winston from "winston";
import * as chalk from "chalk";
winston.addColors({
    error: "red",
    warn: "yellow",
    info: "cyan",
    debug: "green"
});

export default winston.createLogger({
    format: winston.format.combine(winston.format.timestamp({format:"YYYY-MM-DD HH:mm:ss"}), winston.format.printf(info=>`${info.timestamp} ${info.level} | ${info.message}`), winston.format.colorize()),
    transports: [
        new winston.transports.Console({level: "debug"}),
        new winston.transports.File({filename: "durst.log"})
    ]
})
