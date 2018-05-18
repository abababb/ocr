let AipOcrClient = require("baidu-aip-sdk").ocr;

// 设置APPID/AK/SK
let APP_ID = "11257987";
let API_KEY = "MMGDH4T8Ae4ZQgDK5cKLfa8k";
let SECRET_KEY = "buopkedYa2TasKT91axAegDbti6N6WUp";

// 新建一个对象，建议只保存一个对象调用服务接口
let client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);
let fs = require('fs');

let image = fs.readFileSync("assets/10921.jpg").toString("base64");

// 如果有可选参数
var options = {};
options["language_type"] = "CHN_ENG";
options["detect_direction"] = "true";
options["detect_language"] = "true";
options["probability"] = "true";

// 带参数调用通用文字识别, 图片参数为本地图片
client.generalBasic(image, options).then(function(result) {
    console.log(JSON.stringify(result));
}).catch(function(err) {
    // 如果发生网络错误
    console.log(err);
});;

