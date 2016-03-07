var path = require('path'),
    fs = require('fs'),
    cp = require('child_process'),

    _ = require('lodash'),
    Q = require('q'),
    enb = require('enb'),
    runSequence = require('run-sequence'),
    rimraf = require('rimraf'),

    gulp = require('gulp'),
    batch = require('gulp-batch'),
    browserSync = require('browser-sync');

const LANGUAGES = ['en', 'ru'];

const CACHE_DIRS = LANGUAGES.reduce((prev, language) => {
    prev[language] = './.cache/gorshochek-cache-' + language;
    return prev;
}, {});
const DATA_DIR_PREFIX = './.cache/gorshochek-data-';
const DATA_DIRS = LANGUAGES.reduce((prev, language) => {
    prev[language] = DATA_DIR_PREFIX + language;
    return prev;
}, {});
const OUTPUT = './output';
const OUTPUT_ROOT = OUTPUT + '/bem.info/';
const OUTPUT_DIRS = LANGUAGES.reduce((prev, language) => {
    prev[language] = OUTPUT_ROOT + language;
    return prev;
}, {});

const BUNDLES_DIR = 'bundles';
const BUNDLES = fs.readdirSync(BUNDLES_DIR);
const BEMTREE = BUNDLES.reduce((prev, bundle) => {
    prev[bundle] = path.join(BUNDLES_DIR, bundle, bundle + '.bemtree.js');
    return prev;
}, {});
const BEMHTML = BUNDLES.reduce((prev, bundle) => {
    prev[bundle] = path.join(BUNDLES_DIR, bundle, bundle + '.bemhtml.js');
    return prev;
}, {});

function removeFolder(folder) {
    return Q.denodeify(rimraf)(folder);
}

function runSubProcess(file, options) {
    const defer = Q.defer();
    const proc = cp.fork(file, options);
    proc.on('error', (error) => defer.reject(error));
    proc.on('close', () => defer.resolve());
    proc.on('exit', () => defer.resolve());
    return defer.promise;
}

function compilePages(lang, bundle) {
    return runSubProcess('./lib/template.js', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        env: {
            GORSHOCHEK_CACHE_FOLDER: CACHE_DIRS[lang],
            bemtree: BEMTREE[bundle],
            bemhtml: BEMHTML[bundle],
            bundle,
            source: DATA_DIRS[lang],
            destination: OUTPUT_DIRS[lang],
            destinationRoot: OUTPUT,
            langs: LANGUAGES,
            lang,
            DEBUG: process.env.DEBUG
        }
    });
}

// Подготовка директорий output-*

gulp.task('clean-output', () => { rimraf.sync(OUTPUT); });
gulp.task('copy-misc-to-output', ['clean-output'], () => {
    Q.all(gulp.src('static/index.html').pipe(gulp.dest(OUTPUT)).pipe(gulp.dest(OUTPUT_ROOT)),
        LANGUAGES.map(lang => {
            return gulp.src([
                'static/{favicon.ico,robots.txt}'
            ]).pipe(gulp.dest(OUTPUT_DIRS[lang]));
    }));
});

// Сборка данных

gulp.task('libs-build', function(done) {
    require('bem-lib-site-data')(path.resolve('.cache/libs/bem-components-2.4.0'));
});

gulp.task('data-clean', () => Q.all(_.values(DATA_DIRS).map(removeFolder)));
gulp.task('data-cache-clean', () => Q.all(_.values(CACHE_DIRS).map(removeFolder)));
gulp.task('data-build', () => Q.all(LANGUAGES.map(lang => {
    return runSubProcess('./lib/data-builder.js', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        env: {
            GORSHOCHEK_CACHE_FOLDER: CACHE_DIRS[lang],
            modelPath: `./content-${lang}/model.${lang}.json`,
            host: `http://${lang}.bem.info`,
            dest: DATA_DIRS[lang],
            token: process.env.TOKEN,
            DEBUG: process.env.DEBUG
        }
    });
})));
gulp.task('data', () => runSequence('data-clean', 'data-cache-clean', 'data-build'));

// Шаблонизация данных

gulp.task('enb-make', () => enb.make());

gulp.task('copy-static', () => Q.all(LANGUAGES.map(lang => {
    var files = BUNDLES.map(bundle => {
        return path.join(BUNDLES_DIR, bundle, bundle + '.min.*')
    });

    return gulp.src(files).pipe(gulp.dest(OUTPUT_DIRS[lang]));
})));

gulp.task('copy-sitemap-xml', () => Q.all(LANGUAGES.map(lang => {
    return gulp.src(path.join(DATA_DIRS[lang], 'sitemap.xml'))
        .pipe(gulp.dest(path.join(OUTPUT_DIRS[lang])));
})));

gulp.task('build-html', () => Q.all(LANGUAGES.map(lang => {
    return Q.all(BUNDLES.map(compilePages.bind(null, lang)));
})));

gulp.task('copy-static-images', () => Q.all(LANGUAGES.map(lang => {
    return gulp.src(path.join(DATA_DIRS[lang], 'static/*'))
        .pipe(gulp.dest(OUTPUT_DIRS[lang]));
})));

gulp.task('compile-pages', () => runSequence(
    'enb-make',
    'drop-templates-cache',
    'copy-static',
    'copy-static-images',
    'copy-sitemap-xml',
    'build-html'
));

// Наблюдатель

gulp.task('watch', () => {
    gulp.watch(['content-*/**/*'], batch((event, done) => runSequence('data-build', done)));
    gulp.watch(['blocks/**/*'], batch((event, done) => runSequence('enb-make', 'copy-static', done)));

    // compile pages then bemtree/bemhtml bundle or data changes
    BUNDLES.forEach(bundle => {
        var bemtree = path.join(process.cwd(), BEMTREE[bundle]),
            bemhtml = path.join(process.cwd(), BEMHTML[bundle]);
        gulp.watch([
                bemtree, bemhtml,
                path.join(DATA_DIR_PREFIX + '*', bundle, '**'),
                path.join(DATA_DIR_PREFIX + '*', bundle + '.js'),
            ],
            batch((event, done) => {
                delete require.cache[bemhtml];
                delete require.cache[bemtree];

                LANGUAGES.forEach(lang => {
                    console.log('lang', lang, 'bundle', bundle);
                    compilePages(lang, bundle)
                });

                done();
            }
        ));
    });
});

gulp.task('browser-sync', () => {
    browserSync.create().init({
        files: OUTPUT + '/**',
        server: { baseDir: OUTPUT },
        port: 8008,
        open: false,
        online: false,
        logLevel: 'silent',
        notify: false,
        ui: false,
        middleware: function (req, res, next) {
            req.url.match(/svgz/) && res.setHeader('Content-Encoding', 'gzip');
            next();
        }
    });
});

gulp.task('default', (done) => runSequence(
    'copy-misc-to-output',
    // 'data-build',
    'enb-make',
    'copy-static',
    'copy-static-images',
    'copy-sitemap-xml',
    'build-html',
    'watch',
    'browser-sync',
    done
));
