# Sharpify

NodeJS batch image resize and format using Sharp and libvips

## Setup

1. `yarn`
2. `node index.js`

## What is this

This outputs all the images in the `img/in/` folder, includes them in a bunch of badly coded Javascript Promises, convoluted forEach loops, and then spits them out in multiple sizes, quality settings, and formats. It also makes some cropped images with those settings too.

It works for my needs :)

### Input

`file.jpg`

### Output

`{originalFilename}-{size}@{cropRatio}.jpg`

size = 01 (smallest @ 100px) to 10 (largest @ 2000px)

- input-01.jpg
- input-01@16_9.jpg
- input-01@1_1.jpg
- input-01@22_9.jpg
- input-02.jpg
- input-02@16_9.jpg
- input-02@1_1.jpg
- input-02@22_9.jpg
- input-03.jpg
- input-03@16_9.jpg
- input-03@1_1.jpg
- input-03@22_9.jpg
- input-04.jpg
- input-04@16_9.jpg
- input-04@1_1.jpg
- input-04@22_9.jpg
- input-05.jpg
- input-05@16_9.jpg
- input-05@1_1.jpg
- input-05@22_9.jpg
- input-06.jpg
- input-06@16_9.jpg
- input-06@1_1.jpg
- input-06@22_9.jpg
- input-07.jpg
- input-07@16_9.jpg
- input-07@1_1.jpg
- input-07@22_9.jpg
- input-08.jpg
- input-08@16_9.jpg
- input-08@1_1.jpg
- input-08@22_9.jpg
- input-09.jpg
- input-09@16_9.jpg
- input-09@1_1.jpg
- input-09@22_9.jpg
- input-10.jpg
- input-10@16_9.jpg
- input-10@1_1.jpg
- input-10@22_9.jpg
- [and all the above, in `*.webp`]
