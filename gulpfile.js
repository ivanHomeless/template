const server = require("browser-sync").create();
const gulp = require("gulp");
const sass = require("gulp-sass");
const plumber = require("gulp-plumber");
const minify = require("gulp-csso");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const rename = require("gulp-rename");
const postcss = require("gulp-postcss");
const concat = require("gulp-concat");
const imagemin = require("gulp-imagemin");
const webp = require("gulp-webp");
const svgstore = require("gulp-svgstore");
const spritesmith = require("gulp.spritesmith");
const gulpif = require("gulp-if");
const sourcemaps = require("gulp-sourcemaps");
const rigger = require("gulp-rigger");
const autoprefixer = require("autoprefixer");
const posthtml = require("gulp-posthtml");
const include = require("posthtml-include");
const del = require("del");
const merge = require("merge-stream");


gulp.task("clean", function() {
    return del("build");
});

gulp.task("copy", function() {
    return gulp.src([
        //"source/fonts/**/*.{woff, woff2}",
        "source/images/**",
        "source/pictures/**"
        ], {
            base: "source"
        })
        .pipe(gulp.dest("build"));
});

gulp.task("html", function() {
    return gulp.src("source/*.html")
        .pipe(posthtml([
            include()
        ]))
        .pipe(gulp.dest("build"));
});

gulp.task("style", function() {
    return gulp.src("source/sass/style.scss")
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: "expanded"}).on("error", sass.logError))
        .pipe(postcss([
            autoprefixer()
        ]))
        .pipe(gulp.dest("build/css"))
        .pipe(minify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("build/css"))
        .pipe(server.stream());
});

gulp.task("js-libs", function() {
    return gulp.src([
            "./node_modules/jquery/dist/jquery.min.js",
            "./node_modules/bootstrap/dist/js/bootstrap.min.js"
       ])
        .pipe(concat("libs.js"))
        .pipe(gulp.dest("build/js"))
        .pipe(server.stream());
});

gulp.task("script", function() {
    return gulp.src([
            "source/js/**/*.js"
        ])
        .pipe(gulp.dest("build/js"))
        .pipe(babel({
            presets: ["@babel/env"]
        }))
        .pipe(uglify())
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest("build/js"))
        .pipe(server.stream());
});

gulp.task("images", function() {
    return gulp.src([
        "source/images/**/*.{jpg,jpeg,png,svg}",
        "source/pictures/**/*.{jpg,jpeg,png,svg}"
    ], {
        base: "source"
    })
    .pipe(imagemin([
        imagemin.optipng({optimizationLevel: 3}),
        imagemin.jpegtran({progressive: true}),
        imagemin.svgo()
    ]))
    .pipe(gulp.dest("build"));
});

gulp.task("webp", function() {
    return gulp.src([
        "source/images/**/*.{jpg,jpeg,png,svg}",
        "source/pictures/**/*.{jpg,jpeg,png,svg}"
    ], {
        base: "source"
    })
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build"));
});

gulp.task("sprite-svg", function() {
    return gulp.src("source/images/icon-slide*")
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename("sprite.svg"))
        .pipe(imagemin([imagemin.svgo()]))
        .pipe(gulp.dest("source/images"))
        .pipe(gulp.dest("build/images"));
});

gulp.task("sprite-img", function () {
  var spriteData = gulp.src([
        "source/images/icon-email.png",
        "source/images/icon-phone.png"
    ])
  .pipe(imagemin([
        imagemin.optipng({optimizationLevel: 3}),
        imagemin.jpegtran({progressive: true}),
    ]))
  .pipe(spritesmith({
    imgName: "sprite.png",
    imgPath: "/images/sprite.png",
    cssName: "_sprite.scss",
    /*retinaSrcFilter: "test/*@2x.png",
    retinaImgName: "sprite@2x.png",
    retinaImgPath: "test/sprite@2x.png",*/
    padding: 5
  }));

  var imgStream = spriteData.img
    .pipe(gulp.dest("build/images"));

  var cssStream = spriteData.css
    .pipe(gulp.dest("source/sass"));

  return merge(imgStream, cssStream);
});

gulp.task("serve",  function() {
    server.init({
        server: "build/"
    });

    gulp.watch("source/sass/**/*.{scss, sass}", gulp.parallel("style"));
    gulp.watch("source/js/**/*.js", gulp.parallel("script"));
    gulp.watch("source/*.html", gulp.parallel("html")).on("change", server.reload);
});

gulp.task("img", gulp.series(["images", "webp", "sprite-img", "sprite-svg"]));
gulp.task("build", gulp.series(["clean", "img", "js-libs", "style", "script", "html"]));