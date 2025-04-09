const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const logDirectory = path.join(__dirname, '../logs');


const logger = winston.createLogger({
  level: 'info', 
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),  
        winston.format.simple()    
      ),
    }),
    new winston.transports.DailyRotateFile({
        filename: path.join(logDirectory, '%DATE%.log'),
        datePattern: 'YYYY-MM-DD',      
      zippedArchive: true,             
      maxSize: '20m',                  
      maxFiles: '14d',                
      format: winston.format.combine(
        winston.format.timestamp(),    
        winston.format.json()       
      ),
    }),
  ],
});

module.exports = logger;
