'use strict';

const Q = require('q');
const gorshochek = require('gorshochek');
const markedOpts = require('./marked-opts');

const model = gorshochek.createModel();
const tasks = gorshochek.tasks;
const params = process.env;

// console.log('Start build data with params:');
// console.log('modelPath: ', params.modelPath);
// console.log('token: ', params.token);
// console.log('host: ', params.host);
// console.log('dest: ', params.dest);

Q()
    .then(tasks.core.mergeModels(model, {modelPath: params.modelPath}))
    // .then(tasks.meta.generateTagPages(model)) // Включить когда в модели появятся теги
    .then(tasks.docs.loadSourceFromGithub(model, {token: params.token}))
    .then(tasks.docs.loadSourceFromLocal(model))
    .then(require('./gorshochek-task-process-libs')(model))
    .then(tasks.docs.transformMdToHtml(model, {markedOptions: markedOpts}))
    .then(tasks.page.createHeaderTitle(model))
    .then(tasks.page.createHeaderMeta(model))
    .then(tasks.page.createBreadcrumbs(model))
    .then(tasks.override.overrideDocLinks(model))
    .then(tasks.override.processDocImages(model, {imageFolder: '/'}))
    .then(tasks.sitemap.createSitemapXML(model, {host: params.host}))
    .then(tasks.core.saveModel(model))
    .then(tasks.core.rsync(model, {
        dest: params.dest,
        exclude: ['*.meta.json', 'model.json', '*.md']
    }))
    .done(() => {
        // console.info('Successfully built: %s to %s',  params.modelPath, params.dest);
    }, error => {
        console.error(error.stack);
    });
