const AipOcrClient = require("baidu-aip-sdk").ocr;
const fs = require('fs');
const Rx = require('rxjs/Rx');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');


// 设置APPID/AK/SK
const APP_ID = "11257987";
const API_KEY = "MMGDH4T8Ae4ZQgDK5cKLfa8k";
const SECRET_KEY = "buopkedYa2TasKT91axAegDbti6N6WUp";

const PATH = 'assets/lingqi';
const dbUrl = 'mongodb://localhost:27017';
const dbName = 'lingqi';

// 新建一个对象，建议只保存一个对象调用服务接口
let client = new AipOcrClient(APP_ID, API_KEY, SECRET_KEY);
let callApi = (file) => {
  let image = fs.readFileSync(PATH + '/' + file).toString("base64");

  /*
  // 通用文字识别
  let options = {};
  options["language_type"] = "CHN_ENG";
  options["detect_direction"] = "true";
  options["detect_language"] = "true";
  options["probability"] = "true";

  // 带参数调用通用文字识别, 图片参数为本地图片
  return client.generalBasic(image, options);
  */

  // 高精度版
  let options = {};
  options["detect_direction"] = "true";
  options["probability"] = "true";

  // 带参数调用通用文字识别（高精度版）
  return client.accurateBasic(image, options);

  // 含位置高精度版
  /*
  let options = {};
  options["recognize_granularity"] = "big";
  options["detect_direction"] = "true";
  options["vertexes_location"] = "true";
  options["probability"] = "true";

  // 带参数调用通用文字识别（含位置高精度版）
  return client.accurate(image, options);
  */

  /*
  // 含生僻字版
  let options = {};
  options["language_type"] = "CHN_ENG";
  options["detect_direction"] = "true";
  options["detect_language"] = "true";
  options["probability"] = "true";

  // 带参数调用通用文字识别（含生僻字版）, 图片参数为本地图片
  return client.generalEnhance(image, options);
  */

  /*
  // 网络图片文字识别
  let options = {};
  options["detect_direction"] = "true";
  options["detect_language"] = "true";

  // 带参数调用网络图片文字识别, 图片参数为本地图片
  return client.webImage(image, options)
  */
}


// Use connect method to connect to the server
MongoClient.connect(dbUrl,{useNewUrlParser: true}, function(err, client) {
  assert.equal(null, err);

  const db = client.db(dbName);
  const collection = db.collection('raw');

  let dirFiles = fs.readdirSync(PATH);
  dirFiles.sort((f1, f2) => {
    f1 = f1.substr(0, f1.length - 4);
    f2 = f2.substr(0, f2.length - 4);
    return parseInt(f1) - parseInt(f2);
  });

  let count = 50;// 每日免费接口次数限制
  let intervalStream = Rx.Observable.interval(2000).take(count);
  let requestStream = Rx.Observable.from(dirFiles).take(count);
  requestStream = intervalStream.zip(requestStream, (interval, request) => request);
  let responseStream = requestStream.flatMap(file => Rx.Observable.fromPromise(callApi(file)));
  let dbStream = responseStream
    .zip(requestStream, (response, file) => {
      if (response.error_code) {
        throw response.error_msg;
      }
      return {file: file, data: response}
    })
    .flatMap(data => Rx.Observable.fromPromise(collection.insertOne(data)));

  dbStream.zip(requestStream, (dbResult, file) => file)
    .subscribe(
        data => {
          console.log(data);
          fs.unlinkSync(PATH + '/' + data);
        },
        err => {
          console.log(err);
          client.close();
        },
        () => {
          console.log('完成');
          client.close();
        }
        );
});
