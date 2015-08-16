/**
 * Node Modules
 */
var Promise = require('promise');

/**
 * Library modules
 */


/**
 * buildapp
 * 
 * @global - qsocks global connection object
 * @data - serialized app json
 */

function buildapp(global, data) {
	if(typeof data === 'string') { data = JSON.parse(data); }
	
	console.log(data.properties.qTitle);
	
	var context = {
		global: global
	};
	
	var time = Date.now()

	global.createApp(data.properties.qTitle + time)
	.then(function(response) {
		console.log(response);
		return global.openDoc( response.qAppId);
	})
	.then(function(app) {
		return context.app = app;
	})
	.then(function() {
		return context.app.setAppProperties(data.properties);
	})
	.then(function() {
		return context.app.setScript(data.loadScript);
	})
	.then(function() {
		return context.app.createObject(data.sheet[0].qProperty).then(function(handle) {
			return Promise.all(data.sheet[0].qChildren.map(function(d) {
				return handle.createChild(d.qProperty)
			}))
		})
	})
	.then(function() {
		return Promise.all(data.dataconnection.map(function(d) {
			return context.app.createConnection(d.qConnection)
		}));
	})
	.then(function() {
		return context.app.doSave();
	})
	.then(function() {
		return context.app.doReload();
	})
	.then(function() {
		return context.app.doSave();
	})
	.catch(function(error) {
		console.log(error);
	})
	
};
module.exports = buildapp;