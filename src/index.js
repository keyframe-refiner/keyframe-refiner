const srcImg = document.getElementById('src-image');
const fileInput = document.getElementById('input-file');
const destCanvas = document.getElementById('dest-canvas');
const grayScaleBtn = document.getElementById('gray-scale-btn');
const downloadBtn = document.getElementById('download-btn');
const sources = [
    // {
    //     filename: string,
    //     type: string,
    //     canvas: HTMLCanvasElement,
    // }
];
const results = [
    // {
    //     filename: string,
    //     type: string,
    //     canvas: HTMLCanvasElement,
    // }
];

let max_w = 0;
let max_h = 0;

function convertImageToGray(img) {
    let dst = new cv.Mat();
    cv.cvtColor(img, dst, cv.COLOR_RGBA2GRAY, 0);
    return dst;
}
//最大サイズに合わせて画像サイズを適合
function size_match(img, x, y) {
    const { width, height } = img.size();
    let dst = new cv.Mat();
    let s = new cv.Scalar(255, 0, 0, 255);
    cv.copyMakeBorder(img, dst, 0, y - height, 0, x - width, cv.BORDER_CONSTANT, s);
    return dst;
}

//入力画像の最大サイズチェック
function check_maxsize() {
    for (const source of sources) {
        const { width, height } = source.canvas;

        if (max_w < width) {
            max_w = width;
        }

        if (max_h < height) {
            max_h = height;
        }
    }
}

//円検出
function check_circle(img) {
    dst = new cv.Mat();
    cv.medianBlur(img, dst, 5);
    var circles = new cv.Mat();     //c++の配列がcv.Mat()
    cv.HoughCircles(dst, circles, cv.HOUGH_GRADIENT, 1, 20, 50, 30, 0, 0);

    let center;
    try {
        if (circles.cols != 1)
            throw new Error("画像に円が2つ以上あります");

        let x = circles.data32F[0];
        let y = circles.data32F[1];
        let radius = circles.data32F[2];
        center = new cv.Point(x, y);
        cv.circle(dst, center, radius, new cv.Scalar(0, 255, 0, 255), cv.FILLED);
        // cv.circle(dst, center, radius,new cv.Scalar(0, 255, 0, 255), cv.FILLED);

    } catch (error) {
        console.log(error.message);
        alert('画像に円が2つ以上あります');
    }
    // cv.imshow('dest-canvas', dst);
    dst.delete();
    circles.delete();
    return center
}

//ダウンロード時に使用
function dataUriToBlob(dataUri) {
    const b64 = atob(dataUri.split(',')[1]);
    const u8 = Uint8Array.from(b64.split(''), e => e.charCodeAt());
    return new Blob([u8], { type: 'image/jpg' });
}

async function loadImage(file) {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    img.src = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

            // メモリ解放
            URL.revokeObjectURL(img.src);

            resolve(canvas);
        }

        img.onerror = reject;
    });
}

fileInput.addEventListener('change', async () => {
    sources.length = 0;

    for (const file of fileInput.files) {
        const canvas = await loadImage(file);

        sources.push({
            filename: file.name,
            type: file.type,
            canvas,
        });
    }
});

grayScaleBtn.addEventListener('click', async () => {
    if (fileInput.files.length === 0) {
        alert('画像を選択してください！');
        return;
    }

    results.length = 0;
    check_maxsize();

    let standard_x, standard_y;

    for (let i = 0; i < sources.length; i++) {
        console.log(sources[i].filename);

        let src = cv.imread(sources[i].canvas);
        // 最大画像サイズを取得するプログラム
        let dst = size_match(src, max_w, max_h);    //最大サイズに合わせるようにサイズ変更

        let rect = new cv.Rect(1000, 0, 500, 200);     //(始点x、始点y、横幅、縦幅)

        let cut_img = src.roi(rect);
        let gray_img = convertImageToGray(cut_img);
        cut_img.delete();

        //円検出
        let center= check_circle(gray_img);
        gray_img.delete();
        console.log(center);


        let shifted_img = new cv.Mat();

        if (i === 0) {
            //円の位置の基準を決定
            standard_x = center.x;
            standard_y = center.y;

            //基準だから平行移動させない　
            src.copyTo(shifted_img);
        } else {
            //位置合わせ処理
            const M = cv.matFromArray(
                2, 3, cv.CV_32F,
                [1, 0, standard_x - center.x,
                 0, 1, standard_y - center.y]
            );
            cv.warpAffine(src, shifted_img, M, {
                width: max_w,
                height: max_h,
            }); // 0枚目の原画に合わせて平行移動
        }

        // cv.imshow(destCanvas, shifted_img);

        const outputCanvas = document.createElement('canvas');
        cv.imshow(outputCanvas, shifted_img);

        results.push({
            filename: sources[i].filename.replace(/(?=\.\w+$)/, '_out'),
            type: sources[i].type,
            canvas: outputCanvas,
        });

        dst.delete();
        src.delete();
        shifted_img.delete();
    }
});

async function canvasToBlob(canvas, type) {
    return new Promise(resolve => {
        canvas.toBlob(resolve, type);
    });
}

downloadBtn.addEventListener('click', async () => {
    const zipWriter = new zip.ZipWriter(new zip.BlobWriter('application/zip'));

    for (const res of results) {
        await zipWriter.add(
            res.filename,
            new zip.BlobReader(await canvasToBlob(res.canvas, res.type)),
        );
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(await zipWriter.close());
    link.download = 'results.zip';
    link.click();
});
