// // Gulp and utilities
var gulp = require('gulp');
var pump = require('pump');
var gulpIf = require('gulp-if');
var useref = require('gulp-useref');
var runSequence = require('run-sequence');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var rsync = require('gulp-rsync');

// //HTML processing
 var nunjucksRender = require('gulp-nunjucks-render');
 var htmlhint = require('gulp-htmlhint');

// // CSS processing
 var sass = require('gulp-sass');
 var cssnano = require('gulp-cssnano');
 var autoprefixer = require('gulp-autoprefixer');

// // JS processing
var babel = require('gulp-babel'); // requires additional installation of babel-core
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');

// // Image processing
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');

// // Testing
 var browserSync = require('browser-sync').create();

// // Support tasks
gulp.task('nunjucks', function(cb) {
  pump(
    [
      gulp.src('src/nunjucks/pages/**/*.+(html|njk)'),
      nunjucksRender({
        envOptions: {
          tags: {
            blockStart: '<%',
            blockEnd: '%>',
            // variableStart: '<$',
            // variableEnd: '$>',
            // commentStart: '<#',
            // commentEnd: '#>'
          }
        },
        path: ['src/nunjucks/templates'] // must be specific to only render pages (not partials)
      }),
      gulp.dest('src')
    ],
    cb
  );
});


gulp.task('htmlhint', function(cb) {
  pump(
    [
      gulp.src('src/*.html'),
      htmlhint(),
      htmlhint.reporter()
    ],
    cb
  );
});

gulp.task('sass', function(cb) {
  pump(
    [
      gulp.src('src/scss/**/*.scss'),
      sourcemaps.init(),
      sass().on('error', sass.logError),
      sourcemaps.write(),
      autoprefixer(),
      gulp.dest('src/css'),
      browserSync.reload({
        stream: true
      }),
    ],
    cb
  );
});

gulp.task('jshint', function(cb) {
  pump(
    [
      gulp.src('src/js/*.js'),
      jshint(),
      jshint.reporter('default')
    ],
    cb
  );
});

// // TODO: review how to implement this
// gulp.task('babel', function(cb) {
//   pump(
//     [
//       gulp.src('src/js/*.js'),
//       babel({
//         presets: ['env']
//       }),
//       gulp.dest('dist/js')
//     ],
//     cb
//   );
// });

gulp.task('images', function(cb) {
  pump(
    [
      gulp.src('src/img/**/*'),
      cache(imagemin()),
      gulp.dest('dist/img')
    ],
    cb
  );
});

gulp.task('browserSync', function() {
  browserSync.init({
     server: { // comment these lines and uncomment proxy below for live testing
       baseDir: 'src'
     },
    //proxy: 'http://purl.co.nz/investment-quiz_Test/?rid=12345678',
    port: 3030,
    //https: true,
  });
});

gulp.task('useref', function(cb) {
  pump([
    gulp.src('src/*.html'),
    useref(),
    gulpIf('*.js', uglify()),
    gulpIf('*.css', cssnano()),
    gulp.dest('dist'),
    ],
    cb
  );
});

gulp.task('clean:dist', function() {
  return del.sync('dist');
})

gulp.task('cache:clear', function(cb) {
  return cache.clearAll(cb);
})

gulp.task('watch', ['browserSync','nunjucks','htmlhint','jshint','sass'], function() {
  gulp.watch('src/scss/**/*.scss', ['sass']);
  gulp.watch('src/nunjucks/**/*.njk', ['nunjucks']);
  gulp.watch('src/*.html', ['htmlhint', browserSync.reload]);
  gulp.watch('src/js/**/*.js', ['jshint', browserSync.reload]);
  gulp.watch('src/*.html').on('change',browserSync.reload); // workaround for html files not refreshing


});


// Main tasks
// Development
gulp.task('default', function(cb) {
  runSequence('nunjucks',['htmlhint','jshint','sass','browserSync', 'watch'],
    cb
  );
});

// // Live
gulp.task('build', function(cb) {
  runSequence('clean:dist','nunjucks',
    ['sass', 'useref', 'images'],['browserSync'],
    cb
  );
});

