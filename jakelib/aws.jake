var util = require('util');
var fs   = require('fs');

namespace('aws', function () {
	
	desc('Prerequisite to most jake tasks.  This loads credentials in NodeJS.');
	task('loadCredentials', { async: true }, { breakOnError: true }, function() {
    var ex = jake.createExec(['aws configure get aws_access_key_id']);
    ex.addListener('stdout', function (msg) {
      if(!msg || msg.length < 5) 
        fail("No awscli credentials found.  Please run 'aws configure'");
      else
        complete();
    });
    ex.run();
	});
});

