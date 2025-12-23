const fs = require('fs');
const http = require('http');

const logFile = 'diagnostic_log.txt';

function log(message) {
    fs.appendFileSync(logFile, `${new Date().toISOString()}: ${message}\n`);
}

log('Starting diagnostic script');

try {
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end('Diagnostic server working');
    });

    server.on('error', (e) => {
        log(`Server error: ${e.message}`);
    });

    server.listen(3001, '0.0.0.0', () => {
        log('Server listening on port 3001 (0.0.0.0)');
    });

    log('Server create call finished');
} catch (e) {
    log(`Exception: ${e.message}`);
}
