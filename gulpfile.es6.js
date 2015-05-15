'use strict';

import 'source-map-support/register';

import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import gulp_concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import gutil from 'gulp-util';
import shell from 'gulp-shell';
import jasmine from 'gulp-jasmine';
import reporters from 'jasmine-reporters';
import jasmine_phantom from 'gulp-jasmine-phantom';
import path from 'path';
import webpack from 'gulp-webpack';

let compile = (src, dest) =>
  gulp
  .src(src)
  .pipe(sourcemaps.init())
  .pipe(babel({
    sourceMap: true,
    modules: 'common',
    }))
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(dest));

let browser_compile = (src, dest) =>
  gulp
  .src(src)
  .pipe(sourcemaps.init())
  .pipe(webpack({
    output: {
      path: __dirname,
      filename: dest
    }
  }))
  .pipe(uglify())
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest('.'));

gulp.task('node:compile', [], () => compile('src/*.js', 'lib'));
gulp.task('browser:compile', [], () => browser_compile('lib/contenttic.js', 'contenttic.min.js'));
gulp.task('browser:test:compile', [], () => browser_compile('lib/run-test.js', 'contenttic-test.min.js'));
gulp.task('compile', ['node:compile', 'browser:compile', 'browser:test:compile'], () => {});

gulp.task('phantom:test', ['browser:test:compile'], () =>
  gulp
  .src('contenttic-test.min.js')
  .pipe(jasmine_phantom({
    integration: true,
    includeStackTrace: true
  })));
gulp.task('node:test', ['node:compile'], () =>
  gulp
  .src('lib/run-test.js')
  .pipe(jasmine({
    includeStackTrace: true,
    reporter: new reporters.JUnitXmlReporter({
      savePath: '.',
      filePrefix: 'test-node'
      })
  })));

gulp.task('test', ['phantom:test', 'node:test'], () => {});

gulp.task('default', ['compile'], () => {});
// vim:set ts=2 sw=2 et:
