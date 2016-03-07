'use strict';

const Q = require('q');
const baseUtil = require('gorshochek/src/util');

const walk = require('bem-walk');

module.exports = function(model, options) {
    options = options || {};
    options.concurrency = options.concurrency || 20;

    /**
     * Returns true if page type is 'lib'.
     * @param {Object} page - page object
     * @returns {Boolean}
     */
    function isLib(page) {
        return page.type === 'lib';
    }

    /**
     * @param {Model} model - data model
     * @param {Object} page - page object
     * @returns {Promise}
     */
     function processPage(model, page) {
         return Q()
             .then(() => {
                 walker = walk(['.cache/libs-data/bem-components-2.4.0/desktop.docs/']);

                 walker
                     .on('data', function(item) {
                         var block = item.entity.block;

                         blocks[block] || (blocks[block] = {});
                         blocks[block][item.tech] = item.path;
                         console.log('item', item);
                     })
                     .on('error', function(err) {
                         console.log('error', err);
                     });

                 walker.on('end', function() {
                     langs.forEach(function(lang) {
                         onBlocksIntrospected(url, cb);
                     });
                 });

                 return page;
             });
     }

    return () => {
        return baseUtil
            .processPagesAsync(model, isLib, processPage, options.concurrency)
            .thenResolve(model);
    };
}
