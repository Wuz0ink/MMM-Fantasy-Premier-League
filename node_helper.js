/* Magic Mirror
 * Node Helper: MMM-Fantasy-Premier-League
 *
 * By Wuz0ink
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
const fetch = require("node-fetch");


module.exports = NodeHelper.create({

	start: function() {
		console.log("Starting node_helper for module: " + this.name);

		this.started = false;
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === "MMM-Fantasy-Premier-League-CONFIG" && this.started == false) {
			console.log("Working notification system. Notification:", notification, "payload: ", payload);
			this.config = payload;
			this.started = true;
			this.getData();

		}
	},

	getData: function() {
		var self = this;

		console.log('Fetching league data for module: ' + this.name);
		//Clearing league list
		this.leagues = [];

		for(l in this.config.leagueIds){
			// url used to get league and team details
			var url = "https://fantasy.premierleague.com/api/leagues-classic/" + this.config.leagueIds[l].id + "/standings";
			console.log("Fetching data from: " + url);

			var request = require('request');
			var options = {
				'method': 'GET',
				'url': url,
				'headers': {
				}
			};
			request(options, function (error, response) {
				if (error) throw new Error(error);
				var jsonObj = JSON.parse(response.body);
				self.processLeague(jsonObj);
			});

		}
	},

	processLeague: function(data) {


		var leagueTeams = [];
		var leagueName = data.league.name;
		leagueName = this.truncate(leagueName);

		var leagueId = data.league.id;

		for(team in data.standings.results){
			var playerId = data.standings.results[team].id;
			var teamName = data.standings.results[team].entry_name;
			teamName = this.truncate(teamName);

			var playerName = data.standings.results[team].player_name;
			playerName = this.truncate(playerName);

			var rank = data.standings.results[team].rank;
			var totalPoints = data.standings.results[team].total;
			var gwPoints = data.standings.results[team].event_total;

			leagueTeams.push({
				playerId: playerId,
				teamName: teamName,
				playerName: playerName,
				rank: rank,
				totalPoints: totalPoints,
				gwPoints: gwPoints,
			});
		}

		this.leagues.push({
			leagueId: leagueId,
			leagueName: leagueName,
			leagueTeams: leagueTeams
		});

		this.displayAndSchedule("league", this.leagues);
	},

	truncate: function(data){

		if (this.config.truncateAfter > 0) {
			if (data.indexOf(" ",this.config.truncateAfter) > 0)  {
					data = data.substring(0, data.indexOf(" ",this.config.truncateAfter));
			}
		}

		return data;
	},

	displayAndSchedule: function(notification, payload){


		if(notification == "league" && payload.length > 0){
			this.sendSocketNotification("MMM-Fantasy-Premier-League-LEAGUE", payload);
		}

		this.scheduleUpdate();
	},

	scheduleUpdate: function() {
		var self = this;
		var nextLoad = this.config.updateInterval;

		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function() {
			self.getData();
		}, nextLoad);
	}
});
