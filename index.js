'use strict';

const mkdirp = require('mkdirp')
// mkdirp https://github.com/lovell/sharp/issues/1052

// const fsPromises = fs.promises;
// https://stackoverflow.com/questions/40593875/using-filesystem-in-node-js-with-async-await#answer-47190904

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const glob = require("glob")

const dir_in = "./img/in/";
const dir_out = "./img/out/";

// const g_pattern = `*.jpg,*.jpeg,*.png`;
const g_pattern = `*.jpg`;
const g_options = {cwd: dir_in, stat: true, nodir: true, mark: true};

const filesarray = glob.sync(g_pattern, g_options);
console.table(filesarray);

// 2000 jpg @ 60, webp 55
// 1600 jpg @ 65, webp 60
// 1000 jpg @ 70, webp 65

function sharprun(basename, file) {

    const sharpStream = sharp({
        failOnError: false
    });

    const promises = [];
    const i_sizes = [100,150,200,400,600,800,1000,1200,1600,2000];
    // const i_sizes = [1600];
    const ratios = [[16,9], [22,9], [1,1]];

    // const strategy = ["attention", "entropy"];
    const strategy = ["attention"]; // Attention is better in majority
    let i = 1;
    let j = 1;

    // RECTANGULAR
    i_sizes.forEach(img_size => {
        const jpeg_quality = (img_size > 1600) ? 60 : (img_size > 1000) ? 65 : 70;
        const webp_quality = (img_size > 1600) ? 55 : (img_size > 1000) ? 60 : 65;
        // console.info(`Outputting rectangle size: ${i}`);

        // sample-15-07.jpg >> {sample-15}-{07}.jpg {filename}-{img_num}.ext
        // sample-15-07@22_9.jpg >> {sample-15}-{07}@{22_9}.jpg {filename}-{img_num}@{img_ratio}.ext
        let img_num = i.toString().padStart(2, '0');

        // JPEG output
        promises.push(
            sharpStream
                .setMaxListeners(0)
                .clone()
                .resize({ width: img_size })
                .jpeg({quality: jpeg_quality})
                .toFile(`${dir_out}jpg/${basename}-${img_num}.jpg`)
        );

        // WEBP output
        promises.push(
            sharpStream
                .setMaxListeners(0)
                .clone()
                .resize({ width: img_size })
                .webp({quality: webp_quality})
                .toFile(`${dir_out}webp/${basename}-${img_num}.webp`)
        );

        i++;
    });

    // RATIO CROPS
    i_sizes.forEach(img_size => {
        const jpeg_quality = (img_size > 1600) ? 60 : (img_size > 1000) ? 65 : 70;
        const webp_quality = (img_size > 1600) ? 55 : (img_size > 1000) ? 60 : 65;
        // console.info(`Outputting cropped size: ${j}`);

        // sample-15-07.jpg >> {sample-15}-{07}.jpg {filename}-{img_num}.ext
        // sample-15-07@22_9.jpg >> {sample-15}-{07}@{22_9}.jpg {filename}-{img_num}@{img_ratio}.ext
        let img_num = j.toString().padStart(2, '0');

        // Can crop more intelligently using 'entropy' or 'attention'
        strategy.forEach(img_strategy => {
            let strategyLabel;
            let this_strategy;

            if (img_strategy.charAt(0) === "a"){
                strategyLabel = "";
                this_strategy = sharp.strategy.attention;
            }
            else {
                strategyLabel = "-" + img_strategy.charAt(0);
                this_strategy = sharp.strategy.entropy;
            }

            ratios.forEach(ratio => {

                const r1 = ratio[0];
                const r2 = ratio[1];
                const img_ratio = (r2 / r1);

                // JPEG output
                promises.push(
                    sharpStream
                        .setMaxListeners(0)
                        .clone()
                        .resize({
                            width: img_size,
                            height: Math.round(img_size * img_ratio),
                            fit: sharp.fit.cover,
                            position: this_strategy
                            // position: sharp.strategy.entropy
                        })
                        .jpeg({quality: jpeg_quality})
                        .toFile(`${dir_out}jpg/${basename}-${img_num}@${r1}_${r2}${strategyLabel}.jpg`)
                );

                // WEBP output
                promises.push(
                    sharpStream
                        .setMaxListeners(0)
                        .clone()
                        .resize({
                            width: img_size,
                            height: Math.round(img_size * img_ratio),
                            fit: sharp.fit.cover,
                            position: this_strategy
                            // position: sharp.strategy.entropy
                        })
                        .webp({quality: webp_quality})
                        .toFile(`${dir_out}webp/${basename}-${img_num}@${r1}_${r2}${strategyLabel}.webp`)
                );
            });

            j++;
        });
    });

    // const i_qualities = [100,70,65,60,55,50,45,40,35,30,5,1];
    // i_qualities.forEach(img_q => {
    //     promises.push(
    //         sharpStream
    //             .setMaxListeners(0)
    //             .clone()
    //             .resize({ width: img_size })
    //             .webp({//                 quality: img_q//             })
    //             .toFile(`${dir_out}webp/${basename}@${img_q}.webp`)
    //     );
    // });

    // If all the same size, resize it here, then pipe it to the loop
    // sharp(`${dir_in}${file}`).resize({ width: 400 }).pipe(sharpStream);
    sharp(`${dir_in}${file}`).pipe(sharpStream);

    Promise.all(promises)
    // .then(res => { console.log("Done!", res); })
    .then(res => { console.log("Done!"); })
    .catch(err => {
        console.error("Error processing files, let's clean it up", err);
        try {
            // fs.unlinkSync("originalFile.jpg");
            // fs.unlinkSync("optimized-500.jpg");
            // fs.unlinkSync("optimized-500.webp");
        } catch (e) { }
    });
}

function theImages() {
    filesarray.forEach(file => {
        const basename = path.basename(file, path.extname(file));
        sharprun(basename, file);
    });
}

function sharpify() {

    // Wait for folders to be made
    // https://github.com/lovell/sharp/issues/1052#issuecomment-349401421
    (async () => {
        await mkdirp(`${dir_out}webp/`);
        await mkdirp(`${dir_out}jpg/`);
      
        theImages();
      })();
}

sharpify();

// https://github.com/sindresorhus/got#gotstreamurl-options
// got.stream("https://www.example.com/some-file.jpg").pipe(sharpStream);
