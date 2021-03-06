var promise = require('radiodan-client').utils.promise,
    google  = require('googleapis'),
    gcal    = google.calendar('v3');

module.exports.create = function(oauth2Client) {
  var instance = {},
       eventsIntervalId;

  instance.calendarList = function() {
    var dfd = promise.defer();

    gcal.calendarList.list(
      {auth: oauth2Client},
      function(err, calendars) {
        if(err) {
          dfd.reject(err);
        } else {
          dfd.resolve(calendars);
        }
      }
    );

    return dfd.promise;
  };

  instance.refreshEvents = function(calendarId, player) {
    var refreshInterval = 60*1000;

    function fetchEvents() {
      console.log('refreshEvents');
      instance.eventList(calendarId)
        .then(function(events) {
          player.setEvents(events);
        });
    }

    if(eventsIntervalId) {
      clearInterval(eventsIntervalId);
    }

    eventsIntervalId = setInterval(fetchEvents, refreshInterval);
  }

  instance.eventList = function(calendarId) {
    var dfd = promise.defer();

    gcal.events.list(
      {
        calendarId: calendarId,
        auth: oauth2Client,
        singleEvents: true,
        orderBy: 'startTime'
      },
      function(err, events) {
        if(err) {
          dfd.reject(err);
        } else {
          var now = new Date(),
              evs = [];

          events.items.forEach(function(e) {
            var thisEvent = {
              name: e.summary,
              start: new Date(e.start.dateTime),
              end: new Date(e.end.dateTime),
              calendar: e.organizer.displayName,
              link: e.htmlLink
            };

            // only include if event is in present / future
            if(now < thisEvent.start || now < thisEvent.end) {
              evs.push(thisEvent);
            }
          });

          dfd.resolve(evs);
        }
      }
    );

    return dfd.promise;
  };

  return instance;
};
