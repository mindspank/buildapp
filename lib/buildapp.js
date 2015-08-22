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
	if(typeof data === 'undefined') throw new Error('Expects qsocks global and json data.');
	if(typeof data === 'string') data = JSON.parse(data);
		
	var context = {
		global: global
	};
	
	var time = Date.now()

	return global.createApp(data.properties.qTitle + time)
	.then(function(response) {
		return global.openDoc(response.qAppId);
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
		return Promise.all(data.dimension.map(function(d) {
			return context.app.createDimension(d);
		}));
	})
	.then(function() {
		return Promise.all(data.measure.map(function(d) {
			return context.app.createMeasure(d);
		}));
	})
	.then(function() {
		return Promise.all(data.masterobject.map(function(d) {
			return context.app.createObject(d.qProperty).then(function(obj) {
				return obj.setProperties(d.qProperty);
			});
		}));
	})
	.then(function() {
		return Promise.all(data.sheet.map(function(d) {
			return context.app.createObject(d.qProperty).then(function(handle) {
				return handle.setFullPropertyTree(d);
			});	
		}))
	})
	.then(function() {
		return Promise.all(data.snapshot.map(function(d) {
			//Snapshot but using the bookmark class.
			return context.app.createBookmark(d);
		}));
	})
	.then(function() {
		return Promise.all(data.story.map(function(d) {
			return context.app.createObject(d.qProperty).then(function(handle) {
				return handle.setFullPropertyTree(d);
			})
		}))
	})
	.then(function() {
		// Add snapshots to slide items
		return context.app.getAllInfos();
	})
	.then(function(objects) {
		return Promise.all(objects.qInfos.filter(function(d) {
			return d.qType === 'slideitem'
		}).map(function(d) {
			return context.app.getObject(d.qId);
		}));
	})
	.then(function(handles) {
		return Promise.all(handles.map(function(d) {
			return d.getLayout().then(function(layout) {
				if(layout.style.id) {
					return d.embedSnapshotObject(layout.style.id);
				}
			});
		}));
		// End of adding snapshots to slide item
	})
	.then(function() {
		return Promise.all(data.dataconnection.map(function(d) {
			return context.app.createConnection(d.qConnection)
		}));
	})
	.then(function() {
		return context.app.doSave();
	});
	
};
module.exports = buildapp;