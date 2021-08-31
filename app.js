const express = require('express')
const http = require('http')
const cors = require('cors')
const path = require('path')

require('dotenv').config();
const app = express()

const PORT = process.env.PORT || 12000;

async function onServerStart() {
    console.log(`Listening at port ${PORT}`);

    // Test DB
    const db = require('./config/database');
    db.authenticate()
        .then(() => console.log('Database connected...'))
        .catch(err => console.log('DB Error: ' + err))
}

function main() {
    app.use(require('cors')())
    app.use(express.json())
    app.use(require('skipper')());
    app.use(cors())
    const server = http.createServer(app)
    server.listen(PORT, onServerStart);

    // open routes
    app.get('/api', (req, res) => { res.send('Server is running') })

    app.use('/api', require('./routes'))
}

main();







