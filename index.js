// const fsPromises = fs.promises;
// https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await#answer-47190904

// https://github.com/lovell/sharp/issues/185#issuecomment-87466839
// sharp(input)
//   .resize( ... )
//   .toBuffer()
//   .then(function(data) {
//     return writeFileAsync(output, data, {mode: ... , flag: ... });
//   })
//   .then( ... )

// Parallelism issues, with multi-thousand images
// https://github.com/lovell/sharp/issues/1251#issuecomment-395011222
// https://github.com/lovell/sharp/issues/1251#issuecomment-447209921

// const fs = require('fs');
const mkdirp = require('mkdirp');
const sharp = require('sharp');
const path = require('path');
const glob = require('glob');

const config = {
    input: './img/in/',
    output: './img/out/',
    // Beware if same basename, it will overwrite to leave only one (no filename collision detection)
    globPattern: `*.jpg`, // `*.jpg,*.jpeg,*.png`,

    makeRectangles: true,
    makeRatioCrops: true,
    makeJpeg: true,
    makeWebp: true,
    makeAvif: false,
    makeHeif: false,
    positionStrategies: [
        // [filenamePrefix, Strategy] (benchmark: 5 images, 4 ratios, 10 sizes = 500 images)
        ['-c', 'centre'], // 'centre' very fast (1.00)
        ['', 'attention'], // 'attention' is visually better in majority (1.75)
        ['-e', 'entropy'], // 'entropy' looks for busy/complexity, visually worse in majority (2.25)
    ],
    imageRatios: [
        [4, 6],
        [16, 9],
        [22, 9],
        [1, 1],
    ],
    imageSizes: [100, 150, 200, 400, 600, 800, 1000, 1200, 1600, 2000],
    // if you only output eg, 1600 (to replace just that set of files),
    // update the fileNumber sequence used to make each filename, eg `[3,9]` > `filename-03@16_9.jpg` `filename-09@16_9.jpg`
    fileNumber: [], // default: will use the index + 1, filenames start 01, 02, 03, ...
};

const avifOptions = {
    quality: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100], // default: 50
    // 0: slow & small, 9: fast & large
    // in testing 6,7,8,9 produce identical results to each other
    speed: [0, 1, 2, 3, 4, 5, 9], // default: 5
    // '4:2:2' half of the color info of 4:4:4 // but not supported by sharp
    // '4:2:0' quarter of the color info of 4:4:4
    chromaSubsampling: ['4:4:4', '4:2:0'], // default: '4:4:4'
};

const heifOptions = {
    quality: [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100], // default: 50
    compression: ['av1'], // default: 'av1' // doesn't like 'hevc'
    // 0: slow & small, 9: fast & large
    speed: [0, 1, 2, 3, 4, 5, 9], // default: 5
    // '4:2:2' half of the color info of 4:4:4 // but not supported by sharp
    // '4:2:0' quarter of the color info of 4:4:4
    chromaSubsampling: ['4:4:4', '4:2:0'], // default: '4:4:4'
};

// Variable Image Quality depending on size
config.qualities = {
    jpg: {
        lg: {
            size: 1600,
            quality: 60,
        },
        md: {
            size: 1000,
            quality: 65,
        },
        sm: {
            size: 0,
            quality: 70,
        },
    },
    webp: {
        lg: {
            size: 1600,
            quality: 55,
        },
        md: {
            size: 1000,
            quality: 60,
        },
        sm: {
            size: 0,
            quality: 65,
        },
    },
};

const imageQualities = (size, type) => {
    if (size > config.qualities[type].lg.size) {
        return config.qualities[type].lg.quality;
    }
    if (size > config.qualities[type].md.size) {
        return config.qualities[type].md.quality;
    }
    return config.qualities[type].sm.quality;
};

const globOptions = {
    cwd: config.input,
    stat: true,
    nodir: true,
    mark: true,
};
const filesArray = glob.sync(config.globPattern, globOptions);

// Work out total number of images
let totalImages = 0;
totalImages += config.makeJpeg ? 1 : 0;
totalImages += config.makeWebp ? 1 : 0;
totalImages += config.makeAvif ? 1 : 0;
totalImages += config.makeHeif ? 1 : 0;

const totalRegularImages = config.makeRectangles ? config.imageSizes.length : 0;
const totalRatioImages = config.makeRatioCrops
    ? config.positionStrategies.length * config.imageRatios.length * config.imageSizes.length
    : 0;

// List actual files that are involved
console.table(filesArray);
// List the config
console.table({
    'CPU threads': sharp.concurrency(),
    imageRatios: config.imageRatios.length,
    positionStrategies: config.positionStrategies.length,
    imageSizes: config.imageSizes.length,
    'Total image variants': totalImages * (totalRegularImages + totalRatioImages),
    'Grand total images to be made': filesArray.length * (totalImages * (totalRegularImages + totalRatioImages)),
});

const promises = [];
const sharpStream = sharp({
    failOnError: false,
});

const imageStreamJpeg = function (
    imageSize,
    basename,
    imageNumber,
    resizeOptions = {
        width: imageSize,
    },
    filename = `${config.output}${basename}-${imageNumber}`
) {
    promises.push(
        sharpStream
            .setMaxListeners(0)
            .clone()
            .resize(resizeOptions)
            .jpeg({ quality: imageQualities(imageSize, 'jpg') })
            .toFile(`${filename}.jpg`)
    );
};

const imageStreamWebp = function (
    imageSize,
    basename,
    imageNumber,
    resizeOptions = {
        width: imageSize,
    },
    filename = `${config.output}${basename}-${imageNumber}`
) {
    promises.push(
        sharpStream
            .setMaxListeners(0)
            .clone()
            .resize(resizeOptions)
            .webp({ quality: imageQualities(imageSize, 'webp') })
            .toFile(`${filename}.webp`)
    );
};

const imageStreamAvif = function (
    imageSize,
    basename,
    imageNumber,
    resizeOptions = {
        width: imageSize,
    },
    filename = `${config.output}${basename}-${imageNumber}`
) {
    avifOptions.quality.forEach((qly) => {
        avifOptions.speed.forEach((spd) => {
            avifOptions.chromaSubsampling.forEach((cs) => {
                const csname = cs.replace(/:/g, '');
                promises.push(
                    sharpStream
                        .setMaxListeners(0)
                        .clone()
                        .resize(resizeOptions)
                        .avif({
                            quality: qly,
                            lossless: false,
                            speed: spd,
                            chromaSubsampling: cs,
                        })
                        .toFile(`${filename}-${qly}-${spd}-${csname}.avif`)
                );
            });
        });
    });
};

const imageStreamHeif = function (
    imageSize,
    basename,
    imageNumber,
    resizeOptions = {
        width: imageSize,
    },
    filename = `${config.output}${basename}-${imageNumber}`
) {
    heifOptions.quality.forEach((qly) => {
        heifOptions.speed.forEach((spd) => {
            heifOptions.compression.forEach((comp) => {
                heifOptions.chromaSubsampling.forEach((cs) => {
                    const csname = cs.replace(/:/g, '');
                    promises.push(
                        sharpStream
                            .setMaxListeners(0)
                            .clone()
                            .resize(resizeOptions)
                            .heif({
                                quality: qly,
                                lossless: false,
                                compression: comp,
                                speed: spd,
                                chromaSubsampling: cs,
                            })
                            .toFile(`${filename}-${qly}-${spd}-${comp}-${csname}.heif`)
                    );
                });
            });
        });
    });
};

const makeImages = function (options) {
    const { imageSize, basename, imageNumber, resizeOptions, filename } = options;

    if (config.makeJpeg) {
        imageStreamJpeg(imageSize, basename, imageNumber, resizeOptions, filename);
    }
    if (config.makeWebp) {
        imageStreamWebp(imageSize, basename, imageNumber, resizeOptions, filename);
    }
    if (config.makeAvif) {
        imageStreamAvif(imageSize, basename, imageNumber, resizeOptions, filename);
    }
    if (config.makeHeif) {
        imageStreamHeif(imageSize, basename, imageNumber, resizeOptions, filename);
    }
};

function sharprun(basename, file) {
    config.imageSizes.forEach((imageSize, i) => {
        // In case the amount of filename numbers in the array dont match the amount of sizes
        const imageFileNumber = config.fileNumber.length === config.imageSizes.length ? config.fileNumber[i] : i + 1;
        const imageNumber = imageFileNumber.toString().padStart(2, '0');

        // ORIGINAL RECTAGULAR CROPS
        if (config.makeRectangles) {
            makeImages({ imageSize, basename, imageNumber });
        }

        // RATIO CROPS
        if (config.makeRatioCrops) {
            config.positionStrategies.forEach(([strategyLabel, strategyType]) => {
                let strategyPosition;

                if (strategyType === 'centre') {
                    strategyPosition = strategyType;
                } else if (strategyType !== '') {
                    strategyPosition = sharp.strategy[strategyType];
                } else {
                    strategyPosition = sharp.strategy.entropy;
                }

                config.imageRatios.forEach(([ratioHeight, ratioWidth]) => {
                    const imageRatio = ratioWidth / ratioHeight;
                    const resizeOptions = {
                        width: imageSize,
                        height: Math.round(imageSize * imageRatio),
                        fit: sharp.fit.cover,
                        position: strategyPosition,
                    };
                    const filename = `${config.output}${basename}-${imageNumber}@${ratioHeight}_${ratioWidth}${strategyLabel}`;

                    makeImages({ imageSize, basename, imageNumber, resizeOptions, filename });
                });
            });
        }
    });

    // If all the same size, resize it here, then pipe it to the loop
    // sharp(`${config.input}${file}`).resize({ width: 400 }).pipe(sharpStream);
    sharp(`${config.input}${file}`).pipe(sharpStream);

    Promise.all(promises)
        .then((res) => {
            console.log(sharp.counters());
            // console.log('Done!', res);
            // console.log(sharp.cache());
        })
        .catch((err) => {
            console.error("Error processing files, let's clean it up", err);
            // try {
            //     // fs.unlinkSync("originalFile.jpg");
            //     // fs.unlinkSync("optimized-500.jpg");
            //     // fs.unlinkSync("optimized-500.webp");
            // } catch (e) {
            //     console.log(e);
            // }
        });
}

function theImages() {
    filesArray.forEach((file) => {
        const basename = path.basename(file, path.extname(file));
        sharprun(basename, file);
    });
}

function sharpify() {
    // Wait for folders to be made
    // [Nice solution from](https://github.com/lovell/sharp/issues/1052#issuecomment-349401421)
    (async () => {
        await mkdirp(`${config.output}`);

        theImages();
    })();
}

sharpify();

// https://github.com/sindresorhus/got#gotstreamurl-options
// got.stream("https://www.example.com/some-file.jpg").pipe(sharpStream);
