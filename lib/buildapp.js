/**
 * Node Modules
 */
var Promise = require('promise');
var extend = require('util')._extend;

/**
 * Library modules
 */


/**
 * buildapp
 * 
 * @global - qsocks global connection object
 * @data - serialized app json
 * @opts - Options
 */

function buildapp(global, data, opts) {
	if(typeof data === 'undefined') throw new Error('Expects qsocks global and json data.');
	if(typeof data === 'string') data = JSON.parse(data);
	
	/**
	 * Options
	 */
	var defaults = {
		filename: data.properties.qTitle,
		reload: false
	};

	var config = extend(defaults, opts)
	
	var context = {
		global: global
	};
	
	
	/**
	 * Main promise chain
	 */
	return global.createApp(config.filename + '.qvf')
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
		if(!data.appprops) return Promise.resolve();

		return Promise.all(data.appprops.map(function(d) {
			return context.app.createObject(d.qProperty).then(function(handle) {
				return handle.setFullPropertyTree(d);
			});	
		}));
		
	})
	.then(function() {
		return Promise.all(data.dimensions.map(function(d) {
			return context.app.createDimension(d);
		}));
	})
	.then(function() {
		return Promise.all(data.measures.map(function(d) {
			return context.app.createMeasure(d);
		}));
	})
	.then(function() {
		return Promise.all(data.masterobjects.map(function(d) {
			return context.app.createObject(d.qProperty).then(function(obj) {
				return obj.setProperties(d.qProperty);
			});
		}));
	})
	.then(function() {
		return Promise.all(data.sheets.map(function(d) {
			return context.app.createObject(d.qProperty).then(function(handle) {
				return handle.setFullPropertyTree(d);
			});	
		}))
	})
	.then(function() {
		return Promise.all(data.snapshots.map(function(d) {
			//Snapshot but using the bookmark class.
			return context.app.createBookmark(d);
		}));
	})
	.then(function() {
		return Promise.all(data.stories.map(function(d) {
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
		return Promise.all(data.dataconnections.map(function(d) {
			return context.app.createConnection(d.qConnection)
		}));
	})
	.then(function() {
		if ( config.reload ) {
			return context.app.doReload().then(function() { return context.app.doSave(); })
		}
		return context.app.doSave();
	})
	.then(function() { return context.app; });
	
};
module.exports = buildapp;