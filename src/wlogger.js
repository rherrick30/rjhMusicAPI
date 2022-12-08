//import winston from 'winston/lib/winston/config';
const winston = require('winston')

const { createLogger, format, transports } = require('winston')

const winstonLogs = new winston.Container();

const addDate = format((info, opts) => {
    info.message = `${new Date().toISOString()}->${info.message}`
    return info;
  });
  
  winstonLogs.add('wlogger',{
      level: 'info',
      format: format.combine(
        addDate({}),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      transports: [
        //
        // - Write to all logs with level `info` and below to `quick-start-combined.log`.
        // - Write all logs error (and below) to `quick-start-error.log`.
        //
        new transports.File({ filename: './logs/error.log', level: 'error' }),
        new transports.File({ filename: './logs/combined.log' }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    
  })

  winstonLogs.add('playedSongs',{
  level: 'info',
  format: format.combine(
    addDate({}),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.File({ filename: './logs/playedSongs.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});



export default winstonLogs;