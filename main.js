const { Mongo } = require('./app/class/mongo');
const config = require('./environnement/configuration.json');
const Document = require('./services/documentsService');
const Sample = require('./services/samplesService');
const Variable = require('./services/variablesService');
const Report = require('./services/reportsService');
const User = require('./services/usersService');
const DocumentCategory = require('./services/documentsCategoriesService');
const DocumentType = require('./services/documentsTypesService');
const Station = require('./services/stationsService');
const ReportType = require('./services/reportTypesService');
const Card = require('./services/cardsService');
const Device = require('./services/devicesService');
const Counter = require('./services/countersService');

async function main() {
  const mongodb = Mongo.instance();
  await Promise.all([
    mongodb.connectAdvanced(
      config.DATABASE.URI || process.env.MONGO_URI, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      },
      null,
    ),
    Sample.init(),
    Document.init(),
    Variable.init(),
    Report.init(),
    User.init(),
    DocumentCategory.init(),
    DocumentType.init(),
    Station.init(),
    ReportType.init(),
    Card.init(),
    Device.init(),
  ]);

  Counter.init();
}

module.exports = main;
