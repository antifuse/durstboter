import * as winston from "winston";
export default winston.createLogger({
    format: winston.format.combine(winston.format.timestamp({format:"YYYY-MM-DD HH:mm:ss"}), winston.format.printf(info=>`${info.timestamp} ${info.level} | ${info.message}`)),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: "durst.log"})
    ]
})