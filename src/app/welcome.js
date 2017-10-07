var Welcome = {
  finishOnboarding: function(cb) {
    global.AppSettingsDB.update({}, {$set: {onboarding: true}}, function(err, reply) {
      if (err) throw err;
  
      if (reply) {
        cb();
      }
    });
  }
}

module.exports = Welcome;