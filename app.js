// Подключаем библиотеку ws
const WebSocket = require('ws');
const {handleConnection} = require("./routes/сonections");
const config = require('./config/config.js')
const db = require('./data_base/db')
const wss = new WebSocket.Server({port: config.port});


wss.on('connection', handleConnection)
