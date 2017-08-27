# backlog2slack

元記事: Backlog通知をサーバレス構成でslackに飛ばす on @Qiita http://qiita.com/kosuge/items/051922673cf57203f8db

これをほぼそのまま Serverless Framework でデプロイします

## 下準備など

* BacklogやSlack側の設定は元記事をご確認ください
* 元記事にある環境変数は、 serverless.yml の中に記述します。
* Serverless Framework の環境設定を済ませておいてください。
* AWS環境はCLIのデフォルト設定を使います。あらかじめCLIを使えるようにしておいてください。

## デプロイ

```
npm install
sls deploy
```

## 修正箇所

### 元記事の index.js

```
  if(event.room && event.requestParameters){
    // 通知先チャンネル取得
    console.log('room='+event.room);
    room = event.room;
    // json整形・メッセージ作成
    body = event.requestParameters;
```


### 修正後の index.js

```
  if (event.pathParameters.room && event.body) {
    // 通知先チャンネル取得
    room = event.pathParameters.room;
    console.log('room:', room);
    // json整形・メッセージ作成
    body = JSON.parse(event.body);
```
