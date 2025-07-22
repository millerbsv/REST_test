const newman = require('newman');
const fs = require('fs');
const chalk = require('chalk');
const axios = require('axios'); // para autenticación

const collectionFile = 'test-collection.json';
const resultFile = 'resultados.txt';

const results = [];

// Paso 1: Autenticarse primero
async function authenticateAndRun() {
  try {
    // 🔐 Llamada a tu endpoint de autenticación
    const authResponse = await axios.post('https://api.tuapp.com/login', {
      usuario: 'admin',
      clave: '123456'
    });

    const token = authResponse.data.token;
    console.log(chalk.cyan(`✔ Token recibido: ${token}`));

    // Paso 2: Cargar colección y agregar token a cada petición
    const collection = require(`./${collectionFile}`);

    collection.item.forEach((item) => {
      if (!item.request.header) item.request.header = [];

      // Quitar cualquier encabezado Authorization existente
      item.request.header = item.request.header.filter(h => h.key.toLowerCase() !== 'authorization');

      // Agregar Authorization con Bearer token
      item.request.header.push({
        key: 'Authorization',
        value: `Bearer ${token}`,
        type: 'text'
      });
    });

    // Paso 3: Ejecutar la colección con Newman
    newman.run({
      collection,
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

  } catch (err) {
    console.error(chalk.red(`✖ Error de autenticación:`), err.message);
  }
}

// Inicia el proceso
authenticateAndRun();
