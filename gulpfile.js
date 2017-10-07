const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');

gulp.task('scss', function () {
  return gulp.src('./scss/app.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('app.css'))
    .pipe(gulp.dest('./src/client/css'));
});

gulp.task('watch:scss', () => {
  gulp.watch('scss/**/*', ['scss']);
});

gulp.task('default', ['scss']);
gulp.task('watch', ['scss', 'watch:scss']);