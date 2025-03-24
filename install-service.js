
const { setupService } = require('./server');

// Install RakshaWall as a Windows service
const service = setupService();
service.install();