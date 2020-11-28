const gulp = require('gulp');
const sonarqubeScanner = require('sonarqube-scanner');
const projectName = require('./package.json').name;
gulp.task('default', callback => {
  sonarqubeScanner(
    {
      serverUrl: 'server sonar',
      options: {
        'sonar.projectName': projectName,
        'sonar.login': 'password to gzenereata'
      }
    },
    callback
  );
});
