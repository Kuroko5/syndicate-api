const express = require('express');
const api = express.Router();
const samplesRoute = require('./samples');
const reportRoute = require('./reports');
const variablesRoute = require('./variables');
const conditionsRoute = require('./conditions');
const skillsRoute = require('./skills');
const documentsRoute = require('./documents');
const documentsTypesRoute = require('./documentsTypes');
const usersRoute = require('./users');
const permissionsRoute = require('./permissions');
const profilesRoute = require('./profiles');
const viewsRoute = require('./views');
const stationsRoute = require('./stations');
const reportTypesRoute = require('./reportTypes');
const cardsRoute = require('./cards');
const devicesRoute = require('./devices');
const countersRoute = require('./counters');
/**
 * Dispath the differents routes.
 */

api.use('/samples', samplesRoute);
api.use('/reports', reportRoute);
api.use('/variables', variablesRoute);
api.use('/conditions', conditionsRoute);
api.use('/skills', skillsRoute);
api.use('/documents', documentsRoute);
api.use('/documentsTypes', documentsTypesRoute);
api.use('/users', usersRoute);
api.use('/permissions', permissionsRoute);
api.use('/profiles', profilesRoute);
api.use('/views', viewsRoute);
api.use('/stations', stationsRoute);
api.use('/cards', cardsRoute);
api.use('/reportTypes', reportTypesRoute);
api.use('/devices', devicesRoute);
api.use('/counters', countersRoute);

module.exports = api;
