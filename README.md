1. 电脑上开squid代理，手机连代理，开下载，抓包，拿到所有图片。
2. 图片放入assets，每日定时执行脚本node main.js(或node qq.js)提取台词。
3. mongodb查询关键字: 
```
db.getCollection('raw').find({"data.words_result.words": /端木熙/}, {file: 1, "data.words_result.words": 1, _id: 0})
```
4. mongodb生成可以直接导出每张图ocr易读结果的json。

```
// baidu
db.getCollection('raw').mapReduce(
    function() {
        words = this.data.words_result.map(function(i){return i.words});
        file = parseInt(this.file.substr(0, this.file.length - 4));
        emit(file, words)
    },
    function (key, values) {
    },
    {
        query: {},
        out: "result"
    }
)

// qq
db.getCollection('qq_raw').mapReduce(
    function() {
        words = this.data.item_list.map(function(i){return i.itemstring});
        file = parseInt(this.file.substr(0, this.file.length - 4));
        emit(file, words)
    },
    function (key, values) {
    },
    {
        query: {},
        out: "qq_result"
    }
)
```
