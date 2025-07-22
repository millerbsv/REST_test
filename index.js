const newman = require('newman');
const fs = require('fs');
const chalk = require('chalk');

const collectionFile = 'test-collection.json';
const resultFile = 'resultados.txt';

const results = [];

newman.run({
    collection: require(`./${collectionFile}`),
    reporters: 'cli'
}).on('request', (err, args) => {
    const requestName = args.item.name;
    const statusCode = args.response.code;
    const responseBody = args.response.stream.toString();
    
    const isOk = statusCode === 200;

    const log = `${requestName} - Status: ${statusCode} - ${isOk ? chalk.green('✔ OK') : chalk.red('✖ ERROR')}`;
    console.log(log);

    results.push({
        name: requestName,
        status: statusCode,
        statusLabel: isOk ? '✔ OK' : '✖ ERROR',
        response: responseBody
    });
}).on('done', () => {
    const report = results.map(r => 
        `${r.name}\nStatus: ${r.status} - ${r.statusLabel}\nResponse:\n${r.response}\n---\n`
    ).join('\n');

    fs.writeFileSync(resultFile, report);
    console.log(chalk.blue(`\nArchivo de resultados guardado en ${resultFile}`));
});
