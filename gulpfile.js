const { src, dest, watch, series, parallel } = require('gulp')

// 搭建本地服务器
const browserSync = require('browser-sync')
// 删除文件
const del = require('del')
// 压缩html
const htmlMin = require('gulp-htmlmin')
// 转换ES5
const babel = require('gulp-babel')
// 压缩js
const terser = require('gulp-terser')
// less 转 css
const less = require('gulp-less')
const px2rem = require('gulp-px2rem')
// css 兼容浏览器
const postcss = require('gulp-postcss')
const postcssPresetEnv = require('postcss-preset-env')
// 压缩 css
const minify = require('gulp-minify-css')
// 获取源文件流，将每个文件转换为字符串，并将每个转换后的字符串注入目标流文件中的占位符
const inject = require('gulp-inject')

const htmlTask = () => {
  return src('./src/*.html', { base: './src' })
    // 压缩html
    .pipe(htmlMin({
      collapseWhitespace: true
    }))
    .pipe(dest('./dist'))
}

const jsTask = () => {
  return src('./src/js/*.js', { base: './src' })
    // 转换 ES5
    .pipe(babel({ presets: ['@babel/preset-env'] }))
    // 压缩 js
    .pipe(terser({ mangle: { toplevel: true } }))
    .pipe(dest('./dist'))
}

const lessTask = () => {
  return src('./src/css/index.less', { base: './src' })
    // less 转 css
    .pipe(less())
    // px 转 rem
    .pipe(px2rem({
      replace: true,
      rootValue: 16,
      mediaQuery: false,
      minPixelValue: 2,
      propList: ['font', 'font-size', 'line-height', 'letter-spacing']
    }))
    // css 兼容浏览器
    .pipe(postcss([postcssPresetEnv()]))
    // 压缩 css
    .pipe(minify())
    .pipe(dest('./dist'))
}

const injectHtml = () => {
  return src('./dist/*.html')
    // 将 js 和 css 引入到 html 中
    .pipe(inject(src(['./dist/js/*.js', './dist/css/*.css']), { relative: true }))
    .pipe(dest('./dist'))
}

// 搭建本地服务器
const bs = browserSync.create()
const serve = () => {
  watch('./src/*.html', series(htmlTask, injectHtml))
  watch('./src/js/*.js', series(jsTask, injectHtml))
  watch('./src/css/**/*.less', series(jsTask, lessTask))

  bs.init({
    port: 8080,
    open: true,
    files: './dist/*',
    server: {
      baseDir: './dist'
    }
  })
}

const clean = () => {
  return del(['dist'])
}

// 同步执行
const buildTask = series(clean, parallel(htmlTask, jsTask, lessTask) /* 异步执行 */, injectHtml)
const serveTask = series(buildTask, serve)

module.exports = {
  buildTask,
  serveTask
}