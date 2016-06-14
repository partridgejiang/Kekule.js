/**
 * @fileoverview
 * DataProvider is a special class to provide part of large amount of data to other widgets (e.g., DataTable).
 * For example, suppose a database table is filled with 1000 records, the provider can fetch 100 items from it
 * first, then the next 100 ones.
 * @author Partridge Jiang
 */

/*
 * requires /lan/classes.js
 * requires /utils/kekule.utils.js
 * requires /localizations/
 */

(function(){
"use strict";

/**
 * DataSet is a special class to provide large amount of data to other widgets (e.g., DataTable).
 * As transport large amount of data on internet is time cosuming, dataset may tranfer part of data at a time.
 * For example, suppose a database table is filled with 1000 records, the dataSet can fetch 100 items from it
 * first, then the next 100 ones in a secondary query.
 * BaseDataSet is the base class of all providers.
 *
 * @class
 * @augments ObjectEx
 *
 * @property {Bool} enableCache Whether previous fetched data can be cached for further use.
 * @property {Int} defaultTimeout Default timeout milliseconds when fetching data. 0 means never timeout.
 * @property {Array} sortFields Field names to sort data. If field name is prefixed with '!', means sort in desc order.
 *   e.g. ['id', '!name'].
 */
/**
 * Invoked when record count in dataset is changed
 *   event param of it has field: {totalCount}
 * @name Kekule.Widget.BaseDataSet#totalCountChange
 * @event
 */
/**
 * Invoked when data in dataset is changed
 *   event param of it has field: {totalCount}
 * @name Kekule.Widget.BaseDataSet#dataChange
 * @event
 */
Kekule.Widget.BaseDataSet = Class.create(ObjectEx,
/** @lends Kekule.Widget.BaseDataSet# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.BaseDataSet',
	/** @private */
	PREFIX_SORT_DESC: '!',
	/** @private */
	initProperties: function()
	{
		this.defineProp('enableCache', {'dataType': DataType.BOOL,
			'getter': function() {
				return this.getPropStoreFieldValue('enableCache') && this.getCacheAvailable();
			},
			'setter': function(value) {
				this.setPropStoreFieldValue('enableCache', value);
				if (!value)
					this.clearCache();
			}
		});
		this.defineProp('defaultTimeout', {'dataType': DataType.INT});

		this.defineProp('sortFields', {
			'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				var a = value? Kekule.ArrayUtils.toArray(value): null;
				this.setPropStoreFieldValue('sortFields', a);
				this.sortFieldsChanged(a);
			}
		});

		// private
		this.defineProp('cache', {'dataType': DataType.ARRAY});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setEnableCache(true);
		this.setCache([]);
		this.setDefaultTimeout(20000);
	},
	/** @ignore */
	finalize: function($super)
	{
		this.clearCache();
		this.setCache(null);
		$super();
	},

	/**
	 * Notify the data in dataset has been changed.
	 * @private
	 */
	dataChanged: function()
	{
		this.clearCache();
		this.invokeEvent('dataChange');
	},

	/* @private */
	/*
	getSortFieldInfo: function(sortFields)
	{
		var sortFieldInfos = [];
		for (var i = 0, l = sortFields.length; i < l; ++i)
		{
			var info = {};
			var field = sortFields[i] || '';
			if (field.startsWith(this.PREFIX_SORT_DESC))  // sort desc
			{
				info.field = field.substr(1);
				info.desc = true;
			}
			else
			{
				info.field = field;
				info.desc = false;
			}
			sortFieldInfos.push(info);
		}
		return sortFieldInfos;
	},
	*/
	/**
	 * Called when sort fields is changed.
	 * @param {Array} newFields
	 * @private
	 */
	sortFieldsChanged: function(newFields)
	{
		// usually sort field change caused cache to invalidate
		this.clearCache();
		this.doSortFieldsChanged(newFields);
	},
	/**
	 * Do actual work of sorting data.
	 * Descendants need to override this method.
	 * @param {Array} newFields
	 */
	doSortFieldsChanged: function(newFields)
	{
		// do nothing here
	},

	/**
	 * Returns total data item length.
	 * Returns -1 needs unknown.
	 * @returns {Int}
	 */
	getTotalCount: function()
	{
		return this.doGetTotalCount() || 0;
	},
	/**
	 * Do actual work of get data item length.
	 * Descendants should override this method.
	 * @returns {Int}
	 * @private
	 */
	doGetTotalCount: function()
	{
		// do nothing here
	},
	/**
	 * Notify total record count in dataset has been changed.
	 * Descendants should call this method when necessary.
	 * @private
	 */
	totalCountChanged: function(newCount)
	{
		this.invokeEvent('totalCountChange', {'totalCount': newCount});
	},
	/**
	 * Returns the first index of data (usually 0).
	 * Descendants may override this method.
	 * @returns {Int}
	 */
	getFirstIndex: function()
	{
		return 0;
	},
	/**
	 * Returns the first index of data (usually total data count - 1).
	 * Descendants may override this method.
	 * @returns {Int}
	 */
	getLastIndex: function()
	{
		return (this.getTotalCount() || 0) - 1;
	},

	/**
	 * Returns whether this provider can use cache.
	 * Descendants may override this method.
	 * @returns {Bool}
	 */
	getCacheAvailable: function()
	{
		return true;
	},
	/**
	 * Remove all data in cache.
	 */
	clearCache: function()
	{
		this.getCache().length = 0;
		return this;
	},
	/**
	 * Save array of data to cache.
	 * @param {Array} data
	 * @param {Int} fromIndex Starting index in cache.
	 * @param {Int} count Total data item count
	 * @private
	 */
	saveCacheData: function(data, fromIndex)
	{
		//if (this.getEnableCache())
		{
			var cache = this.getCache();
			var currIndex = fromIndex;
			for (var i = 0; i < data.length; ++i)
			{
				cache[currIndex] = data[i] || null;
				++currIndex;
			}
		}
	},
	/**
	 * Try load data from cache. If cache does not have all essential data, null will be returned.
	 * @param {Int} fromIndex
	 * @param {Int} count
	 * @returns {Array}
	 * @private
	 */
	loadCacheData: function(fromIndex, count)
	{
		if (!this.getEnableCache())
			return null;
		else
		{
			var cache = this.getCache();
			if (cache.length < fromIndex + count)
				return null;

			var result = [];
			for (var i = fromIndex, l = fromIndex + count; i < l; ++i)
			{
				var item = cache[i];
				if (item === undefined)  // not in cache
					return null;
				else
					result.push(item);
			}
			return result;
		}
	},
	/**
	 * Fetch data in a range.
	 * @param {Hash} options Options may include the following fields:
	 *   {
	 *     fromIndex: from index of data,
	 *     count: count of data item to retrieve, 0 means retrieve all data,
	 *     ignoreCache: Force to not use cache even if enableCache property is true,
	 *     timeout: milliseconds,
	 *     callback: callback function called when data are successful retrieved, callback(dataArray).
	 *     errCallback: callback when error occurs callback(err)
	 *     timeOutCallback: callback when timeout. If this callback is not set, errCallback will be called instead.
	 *   }
	 */
	fetch: function(options)
	{
		var op = Object.extend({
			'fromIndex': 0,
			'count': 0
			//'timeout': this.getDefaultTimeout()
		}, options);
		op.timeout = op.timeout || this.getDefaultTimeout();

		// try load from cache first
		if (this.getEnableCache())
		{
			var data = this.loadCacheData(op.fromIndex, op.count);
			if (data)
			{
				op.callback(data);
				return;
			}
		}

		var self = this;
		var timeouted = false;
		var done = function(data)
		{
			if (timeouted)
				return;
			if (timeoutId)
				clearTimeout(timeoutId);
			if (options.callback)
				options.callback(data);
			if (self.getEnableCache())  // cache data
			{
				self.saveCacheData(data, op.fromIndex);
			}
		};
		var error = function(err)
		{
			if (timeouted)
				return;
			if (timeoutId)
				clearTimeout(timeoutId);
			if (options.errCallback)
				options.errCallback(err);
		};
		if (op.timeout > 0)
		{
			var timeoutCallback = function()
			{
				if (timeoutId)
					clearTimeout(timeoutId);
				//console.log(op.timeout, op.timeoutCallback, op.errCallback);
				timeouted = true;
				if (op.timeoutCallback)
					op.timeoutCallback();
				else if (options.errCallback)
					options.errCallback(Kekule.$L('ErrorMsg.FETCH_DATA_TIMEOUT'));
			};
			var timeoutId = setTimeout(timeoutCallback, op.timeout);
		}
		op.callback = done;
		op.errCallback = error;
		var result = this.doFetch(op.fromIndex, op.count, op.callback, op.errCallback);
	},
	/**
	 * Do actual work of fetch data.
	 * Descendants should override this method.
	 * @param {Int} fromIndex
	 * @param {Int} count
	 * @param {Func} callback
	 * @param {Func} errCallback
	 */
	doFetch: function(fromIndex, count, callback, errCallback)
	{
		// fo nothing here
	}
});

/**
 * A simple data set, stored all data in an internal array.
 *
 * @class
 * @augments Kekule.Widget.BaseDataSet
 * @param {Array} data
 *
 * @property {Array} data
 */
Kekule.Widget.ArrayDataSet = Class.create(Kekule.Widget.BaseDataSet,
/** @lends Kekule.Widget.ArrayDataSet# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.ArrayDataSet',
	/** @constructs */
	initialize: function($super, data)
	{
		$super();
		this.setData(data);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('data', {'dataType': DataType.ARRAY,
			'setter': function(value)
			{
				this.setPropStoreFieldValue('data', value);
				// if has sort fields, sort data first
				var sortFields = this.getSortFields();
				if (sortFields)
					this.doSortFieldsChanged(sortFields);
				this.dataChanged();
			}
		});
	},
	/** @ignore */
	getCacheAvailable: function()
	{
		// as all data are in data property, no need to cache.
		return false;
	},
	/** @ignore */
	doSortFieldsChanged: function(newFields)
	{
		/*
		var sortFieldInfos = this.getSortFieldInfo(newFields);
		var sortFunc = function(hash1, hash2)
			{
				var compareValue = 0;
				for (var i = 0, l = sortFieldInfos.length; i < l; ++i)
				{
					var field = sortFieldInfos[i].field;
					var v1 = hash1[field] || '';
					var v2 = hash2[field] || '';
					compareValue = (v1 > v2)? 1:
						(v1 < v2)? -1: 0;
					if (sortFieldInfos[i].desc)
						compareValue = -compareValue;
					if (compareValue !== 0)
						break;
				}
				return compareValue;
			};
		var data = this.getData() || [];
		data.sort(sortFunc);
		this.dataChanged();
		return this;
		*/

		var data = this.getData() || [];
		Kekule.ArrayUtils.sortHashArray(data, newFields);
		this.dataChanged();
		return this;
	},
	/** @ignore */
	doGetTotalCount: function()
	{
		return (this.getData() || []).length;
	},
	/** @ignore */
	doFetch: function(fromIndex, count, callback, errCallback)
	{
		var result = [];
		var data = this.getData() || [];
		for (var i = fromIndex, l = Math.min(fromIndex + count, data.length); i < l; ++i)
		{
			var item = data[i];
			result.push(item);
		}

		// debug
		/*
		var done = function()
		{
			//if ((fromIndex / count) % 2)
				callback(result);
			//else
			//	errCallback('A Error');
		};
		setTimeout(done, 500);
		*/

		callback(result);
	}
});

/**
 * A class to divide data from dataSet to multiple pages,
 * should be used together with data table widget.
 * @class
 * @augments ObjectEx
 * @param {Kekule.Widget.BaseDataSet} dataSet
 *
 * @property {Kekule.Widget.BaseDataSet} dataSet The data provider to fetch data
 * @property {Int} pageSize Item count in one page.
 * @property {Int} currPageIndex Index of current page.
 * @property {Array} currPageData Cache data of current page.
 * @property {Array} sortFields Field names to sort data in dataset.
 */
/**
 * Invoked when data of new page is starting to retrieve.
 *   event param of it has field: {pageIndex}
 * @name Kekule.Widget.DataPager#pageRetrieve
 * @event
 */
/**
 * Invoked when page index is changed and data are successfully retrieved.
 *   event param of it has field: {pageIndex, data}
 * @name Kekule.Widget.DataPager#dataFetched
 * @event
 */
/**
 * Invoked when retrieving data error.
 *   event param of it has field: {err}
 * @name Kekule.Widget.DataPager#dataError
 * @event
 */
/**
 * Invoked when page count is changed
 *   event param of it has field: {pageCount}
 * @name Kekule.Widget.DataPager#pageCountChange
 * @event
 */
Kekule.Widget.DataPager = Class.create(ObjectEx,
/** @lends Kekule.Widget.DataPager# */
{
	/** @private */
	CLASS_NAME: 'Kekule.Widget.DataPager',
	/** @constructs */
	initialize: function($super, dataSet)
	{
		$super();
		this.setDataSet(dataSet);
	},
	/** @private */
	initProperties: function()
	{
		this.defineProp('dataSet', {'dataType': 'Kekule.Widget.BaseDataSet',
			'setter': function(value)
			{
				var old = this.getDataSet();
				if (value !== old)
				{
					this.setPropStoreFieldValue('dataSet', value);
					this.dataSetChange(old, value);
					this.switchToPage(this.getCurrPageIndex() || 0);
				}
			}
		});
		this.defineProp('pageSize', {'dataType': DataType.INT,
			'setter': function(value)
			{
				if (value !== this.getPageSize())  // page size change, need to reload data in cache
				{
					this.setPropStoreFieldValue('pageSize', value);
					this.pageCountChanged(this.getPageCount());
					this.switchToPage(this.getCurrPageIndex() || 0);
				}
			}
		});
		this.defineProp('currPageIndex', {'dataType': DataType.INT});
		this.defineProp('currPageData', {'dataType': DataType.ARRAY});

		this.defineProp('sortFields', {
			'dataType': DataType.ARRAY,
			'serializable': false,
			'getter': function()
			{
				return this.getDataSet() && this.getDataSet().getSortFields();
			},
			'setter': function(value)
			{
				if (this.getDataSet())
				{
					this.getDataSet().setSortFields(value);
					//this.sortFieldsChanged();
				}
			}
		});
	},
	/** @ignore */
	initPropValues: function($super)
	{
		$super();
		this.setCurrPageIndex(0);
	},

	/** @private */
	dataSetChange: function(oldDataSet, newDataSet)
	{
		if (oldDataSet)
		{
			oldDataSet.RemoveEventListener('dataChange', this.reactDataSetDataChange, this);
			oldDataSet.RemoveEventListener('totalCountChange', this.reactDataSetTotalCountChange, this);
		}
		if (newDataSet)
		{
			newDataSet.addEventListener('dataChange', this.reactDataSetDataChange, this);
			newDataSet.addEventListener('totalCountChange', this.reactDataSetTotalCountChange, this);
		}
		this.pageCountChanged(this.getPageCount());
	},
	/** @private */
	reactDataSetDataChange: function(e)
	{
		this.dataChanged();
	},
	/**
	 * Called when data in dataset has been changed, need to refetch data.
	 * @private
	 */
	dataChanged: function()
	{
		this.pageCountChanged(this.getPageCount());
		this.switchToPage(this.getCurrPageIndex() || 0);
	},

	/** @private */
	reactDataSetTotalCountChange: function(e)
	{
		this.pageCountChanged(this.getPageCount());
	},

	/* @private */
	/*
	sortFieldsChanged: function()
	{
		//this.switchToPage(this.getCurrPageIndex() || 0);
	},
	*/

	/**
	 * Returns total page count.
	 * @returns {Int}
	 */
	getPageCount: function()
	{
		var dataset = this.getDataSet();
		var totalCount = dataset? (dataset.getTotalCount() || 0): 0;
		return Math.ceil(totalCount / this.getPageSize());
	},
	/**
	 * Notify page count has been changed.
	 * @private
	 */
	pageCountChanged: function(newPageCount)
	{
		this.invokeEvent('pageCountChange', {'pageCount': newPageCount});
	},
	/**
	 * Returns data in current page.
	 * @param {Hash} options Options may include the following fields:
	 *   {
	 *     pageIndex: index of data page. If not set, currPageIndex will be used,
	 *     ignoreCache: Force to not use cache even if enableCache property is true,
	 *     timeout: milliseconds,
	 *     callback: callback function called when data are successful retrieved, callback(dataArray).
	 *     errCallback: callback when error occurs callback(err)
	 *     timeOutCallback: callback when timeout. If this callback is not set, errCallback will be called instead.
	 *   }
	 * @private
	 */
	fetchPageData: function(options)
	{
		var pageSize = this.getPageSize();
		var pageIndex = Kekule.ObjUtils.isUnset(options.pageIndex)? this.getCurrPageIndex(): options.pageIndex;
		var fromIndex = pageSize * pageIndex;
		var count = this.getPageSize();
		var ops = Object.create(options);
		Object.extend(ops, {'fromIndex': fromIndex, 'count': count});
		this.getDataSet().fetch(ops);
		return this;
	},

	/**
	 * Request data on page index.
	 * When data is retrieved, event pageSwitched will be invoked.
	 * When error or timeout, event pageSwitchError will be invoked.
	 * @param {Int} pageIndex
	 * @param {Int} timeout
	 */
	switchToPage: function(pageIndex, timeout)
	{
		var self = this;
		var ops = {
			'pageIndex': pageIndex,
			'timeout': timeout,
			'callback': function(data)
			{
				self.setCurrPageData(data);
				self.setCurrPageIndex(pageIndex);
				self.invokeEvent('dataFetched', {'pageIndex': pageIndex, 'data': data});
			},
			'errCallback': function(err)
			{
				self.invokeEvent('dataError', {'error': err});
				Kekule.error(err);  // TODO: need to invoke an exception here?
			}
		};
		this.invokeEvent('pageRetrieve', {'pageIndex': pageIndex});
		this.fetchPageData(ops);
	}
});

})();