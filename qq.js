const md5 = require('blueimp-md5')
const fs = require('fs')
const fetch = require('node-fetch')
const Rx = require('rxjs/Rx');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const APP_ID = '1106918076'
const APP_KEY = 'rR0L5EZQ8K4ARchN'

const PATH = 'assets/lingqi2';
const dbUrl = 'mongodb://localhost:27017';
const dbName = 'lingqi';
const colName = 'qq_raw';
const INTERVAL = 2000;
let count = 50;

let callApi = (file) => {
  let image = fs.readFileSync(PATH + '/' + file).toString("base64");
  let params = {
    'app_id': APP_ID,
    'time_stamp': Math.floor(Date.now()/1000),
    'nonce_str': Math.random().toString(36).substr(7),
    'image': image,
  }
  let parseParams = (params) => {
    let seg = Object.keys(params)
      .filter(i => params[i] !== '')
      .sort().map(k => {
        return k + '=' + encodeURIComponent(params[k])
      })
    seg.push('app_key=' + APP_KEY)
    let body = seg.join('&')
    let sign = md5(body).toUpperCase()
    body += '&sign=' + sign
    return body
  }
  let url = 'https://api.ai.qq.com/fcgi-bin/ocr/ocr_generalocr'
  return fetch(url, {
    method: 'POST',
    body: parseParams(params),
    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
  }).then(res => res.json())
}


// Use connect method to connect to the server
MongoClient.connect(dbUrl,{useNewUrlParser: true}, function(err, client) {
  assert.equal(null, err);

  const db = client.db(dbName);
  const collection = db.collection(colName);

  let dirFiles = fs.readdirSync(PATH);
  dirFiles.sort((f1, f2) => {
    f1 = f1.substr(0, f1.length - 4);
    f2 = f2.substr(0, f2.length - 4);
    return parseInt(f1) - parseInt(f2);
  });

  let intervalStream = Rx.Observable.interval(INTERVAL).take(count);
  let requestStream = Rx.Observable.from(dirFiles).take(count);
  requestStream = intervalStream.zip(requestStream, (interval, request) => request);
  let responseStream = requestStream.flatMap(file => Rx.Observable.fromPromise(callApi(file)));
  let dbStream = responseStream
    .zip(requestStream, (response, file) => {
      if (response.ret !== 0) {
        throw response;
      }
      return {file: file, data: response.data}
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
