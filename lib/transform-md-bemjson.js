'use strict';

const path = require('path');
const Q = require('q');
const _ = require('lodash');
const MarkdownBemjson = require('markdown-bemjson');
const baseUtil = require('gorshochek/src/util');

/**
 * Transforms page content source files from markdown format to bemjson
 * @param {Model} model - application model instance
 * @param {Object} options - task options
 * @param {Object} [options.markedOptions] - marked options for markdown parsing
 * @param {Number} [options.concurrency] - number of pages processed at the same time
 * @returns {Function}
 * @example
 * var Q = require('q');
 * var gorshochek = require('gorshochek');
 * var model = gorshochek.createModel();
 * Q()
 *    .then(tasks.core.mergeModels(model, {modelPath: './examples/model.ru.json'}))
 *    .then(tasks.docs.loadSourcesFromLocal(model))
 *    .then(tasks.docs.transformMdToBemjson(model))
 *    .then(tasks.core.saveModel(model))
 *    .then(tasks.core.rsync(model, {
 *        dest: './data',
 *        exclude: ['*.meta.json', 'model.json', '*.md']
 *    }))
 *    .done();
 */
module.exports = (model, options) => {
    options = options || {};
    options.concurrency = options.concurrency || 20;

    var markdownBemjson = MarkdownBemjson(options);

    /**
     * Returns true if given page has contentFile field
     * and value of this field ends on .md
     * @param {Object} page - model page object
     * @returns {Boolean}
     */
    function hasMarkdownSource(page) {
        return !!(page.contentFile && page.contentFile.match(/\.md$/));
    }

    /**
     * Transforms source text into bemjson.
     * @param {Object} page - page object
     * @param {String} md - markdown content of page
     * @returns {Promise}
     */
    function transform(page, md) {
        return Q('[' + JSON.stringify(markdownBemjson.convert(md), null, 4) + ']');
    }

    /**
     * Transform md content of page source file into bemjson
     * @param {Model} model - data model
     * @param {Object} page - page object
     * @returns {Promise}
     */
    function processPage(model, page) {
        const sourceFilePath = page.contentFile;
        const mdFileDirectory = path.dirname(sourceFilePath);
        const bemjsonFilePath = path.join(mdFileDirectory, 'index.bemjson');

        return Q(sourceFilePath)
            .then(baseUtil.readFileFromCache.bind(baseUtil))
            .then(transform.bind(null, page))
            .then(baseUtil.writeFileToCache.bind(baseUtil, bemjsonFilePath))
            .then(() => {
                page.contentFile = bemjsonFilePath;
                return page;
            });
    }

    return () => {
        return baseUtil
            .processPagesAsync(model, hasMarkdownSource, processPage, options.concurrency)
            .thenResolve(model);
    };
};
