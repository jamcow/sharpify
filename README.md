# Sharpify

NodeJS batch image resize and format using Sharp and libvips

## Setup and run

1. Put image(s) in the `img/in/` folder
2. `yarn`
3. `node index.js`

## What is this

JPG in, optimised JPG and WEBP out.

Originally for outputting image galleries (multi-thousand). For X number of photos, Photoshop took 40 seconds, libvips was around 8 seconds. Resizing, applying a watermark and outputting thumbnail and image.

This processes and outputs all the images in the `img/in/` folder, includes them in a bunch of badly coded Javascript Promises, convoluted forEach loops, and then spits them out in multiple sizes, quality settings, and formats. It also makes some cropped images with those settings too.

Can be better optimised to use CPU cores better, group formats together, use buffer/pipelines optimally, etc... And config by default outputs lots of variations. This was also made for generating placeholder stock images to go on a cheap CDN.

You could run a server to dynamically generate images with dynamic sizes, but issues are: cost (if you have the money - just use cloudinary/imgix), server CPU, and caching/security). I didn't want to bother with all that, and just stuck the static images on a CDN (private and secure).

### Input

`file.jpg`

### Output

Each input image will generate:

- original ratio, and 4 custom ratios (4:6, 16:9, 22:9, 1:1)
- each custom ratio has 3 crop positions (centre, attention, entropy)
- there are 10 image widths for each original (1 &times; 10), and custom ratio with crop position ((4 &times; 3) &times; 10) (100px, 150px, 200px, 400px, 600px, 800px, 1000px, 1200px, 1600px, 2000px)
- total of 130 files &times; each image format &times; original file.

`{originalFilename}-{size}@{cropRatio}.jpg`

size = 01 (smallest @ 100px) to 10 (largest @ 2000px)

```bash
input-01.jpg
input-01@1_1.jpg
input-01@1_1-c.jpg
input-01@1_1-e.jpg
input-01@16_9.jpg
input-01@16_9-c.jpg
input-01@16_9-e.jpg
input-01@22_9.jpg
input-01@22_9-c.jpg
input-01@22_9-e.jpg
input-01@4_6.jpg
input-01@4_6-c.jpg
input-01@4_6-e.jpg
input-02.jpg
input-02@1_1.jpg
input-02@1_1-c.jpg
input-02@1_1-e.jpg
input-02@16_9.jpg
input-02@16_9-c.jpg
input-02@16_9-e.jpg
input-02@22_9.jpg
input-02@22_9-c.jpg
input-02@22_9-e.jpg
input-02@4_6.jpg
input-02@4_6-c.jpg
input-02@4_6-e.jpg
input-03.jpg
input-03@1_1.jpg
input-03@1_1-c.jpg
input-03@1_1-e.jpg
input-03@16_9.jpg
input-03@16_9-c.jpg
input-03@16_9-e.jpg
input-03@22_9.jpg
input-03@22_9-c.jpg
input-03@22_9-e.jpg
input-03@4_6.jpg
input-03@4_6-c.jpg
input-03@4_6-e.jpg
input-04.jpg
input-04@1_1.jpg
input-04@1_1-c.jpg
input-04@1_1-e.jpg
input-04@16_9.jpg
input-04@16_9-c.jpg
input-04@16_9-e.jpg
input-04@22_9.jpg
input-04@22_9-c.jpg
input-04@22_9-e.jpg
input-04@4_6.jpg
input-04@4_6-c.jpg
input-04@4_6-e.jpg
input-05.jpg
input-05@1_1.jpg
input-05@1_1-c.jpg
input-05@1_1-e.jpg
input-05@16_9.jpg
input-05@16_9-c.jpg
input-05@16_9-e.jpg
input-05@22_9.jpg
input-05@22_9-c.jpg
input-05@22_9-e.jpg
input-05@4_6.jpg
input-05@4_6-c.jpg
input-05@4_6-e.jpg
input-06.jpg
input-06@1_1.jpg
input-06@1_1-c.jpg
input-06@1_1-e.jpg
input-06@16_9.jpg
input-06@16_9-c.jpg
input-06@16_9-e.jpg
input-06@22_9.jpg
input-06@22_9-c.jpg
input-06@22_9-e.jpg
input-06@4_6.jpg
input-06@4_6-c.jpg
input-06@4_6-e.jpg
input-07.jpg
input-07@1_1.jpg
input-07@1_1-c.jpg
input-07@1_1-e.jpg
input-07@16_9.jpg
input-07@16_9-c.jpg
input-07@16_9-e.jpg
input-07@22_9.jpg
input-07@22_9-c.jpg
input-07@22_9-e.jpg
input-07@4_6.jpg
input-07@4_6-c.jpg
input-07@4_6-e.jpg
input-08.jpg
input-08@1_1.jpg
input-08@1_1-c.jpg
input-08@1_1-e.jpg
input-08@16_9.jpg
input-08@16_9-c.jpg
input-08@16_9-e.jpg
input-08@22_9.jpg
input-08@22_9-c.jpg
input-08@22_9-e.jpg
input-08@4_6.jpg
input-08@4_6-c.jpg
input-08@4_6-e.jpg
input-09.jpg
input-09@1_1.jpg
input-09@1_1-c.jpg
input-09@1_1-e.jpg
input-09@16_9.jpg
input-09@16_9-c.jpg
input-09@16_9-e.jpg
input-09@22_9.jpg
input-09@22_9-c.jpg
input-09@22_9-e.jpg
input-09@4_6.jpg
input-09@4_6-c.jpg
input-09@4_6-e.jpg
input-10.jpg
input-10@1_1.jpg
input-10@1_1-c.jpg
input-10@1_1-e.jpg
input-10@16_9.jpg
input-10@16_9-c.jpg
input-10@16_9-e.jpg
input-10@22_9.jpg
input-10@22_9-c.jpg
input-10@22_9-e.jpg
input-10@4_6.jpg
input-10@4_6-c.jpg
input-10@4_6-e.jpg
```

and all the above, in `*.webp`

## AVIF

In testing, quality values of `6, 7, 8, and 9` generated identical file output (SHA512).
Even with `quality: 60`, `speed 0`, filesizes aren't much lower (sometimes larger if quality is above 60) than a well optimised Mozjpeg JPG.
Definitely going to be used in the future, but needs a fair amount of optimisation, and especially careful to decide if applying to picture content. Detailled images can remain crisp, but images with mid-tones/hazy (eg, clouds, misty fields) tend to suffer blurring and loss of details, especially if the image has detailled areas too. Similar to webp in that regard.
