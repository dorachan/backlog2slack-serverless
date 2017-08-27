'use strict';

//requires
const Slack = require('slack-node');
const slack = new Slack();

// settings (lambda環境変数)
var BOTNAME = process.env['BOTNAME'];
var BASEURL = process.env['BASEURL'];
var WEBHOOKURI = process.env['WEBHOOKURI'];

slack.setWebhook(WEBHOOKURI);

// Format chat message
function makeChatMessage(body) {
  var msgObj = new Object();
  var label = "";
  var bl_key = "";
  var bl_summary = "";
  var bl_comment = "";
  var bl_url = "";

  switch (body.type) {
    case 1:
      label = "追加";
      bl_key = "[" + body.project.projectKey + "-" + body.content.key_id + "]";
      bl_summary = "「" + body.content.summary + "」";
      bl_url = BASEURL + "view/" + body.project.projectKey + "-" + body.content.key_id;
      bl_comment = body.content.description;
      break;
    case 2:
      label = "更新";
      bl_key = "[" + body.project.projectKey + "-" + body.content.key_id + "]";
      bl_summary = "「" + body.content.summary + "」";
      bl_url = BASEURL + "view/" + body.project.projectKey + "-" + body.content.key_id;
      bl_comment = body.content.description;
      break;
    case 3:
      label = "コメント";
      bl_key = "[" + body.project.projectKey + "-" + body.content.key_id + "]";
      bl_summary = "「" + body.content.summary + "」";
      bl_url = BASEURL + "view/" + body.project.projectKey + "-" + body.content.key_id + "#comment-" + body.content.comment.id;
      bl_comment = body.content.comment.content;
      break;
    case 14:
      label = "課題まとめて更新";
      bl_key = "";
      bl_summary = "";
      bl_url = BASEURL + "projects/" + body.project.projectKey;
      bl_comment = body.createdUser.name + "さんが課題をまとめて操作しました。";
      break;
    case 5:
      label = "Wiki追加";
      bl_key = "";
      bl_summary = "「" + body.content.name + "」";
      bl_url = BASEURL + "alias/wiki/" + body.content.id;
      bl_comment = body.createdUser.name + "さんがWikiページを追加しました。";
      break;
    case 6:
      label = "Wiki更新";
      bl_key = "";
      bl_summary = "「" + body.content.name + "」";
      bl_url = BASEURL + "alias/wiki/" + body.content.id;
      bl_comment = body.createdUser.name + "さんがWikiページを更新しました。";
      break;
    case 11:
      label = "SVNコミット";
      bl_key = "[r" + body.content.rev + "]";
      bl_summary = "";
      bl_url = BASEURL + "rev/" + body.project.projectKey + "/" + body.content.rev;
      bl_comment = body.content.comment;
      break;
    case 12:
      label = "Gitプッシュ";
      var git_rev = body.content.revisions[0].rev;
      git_rev = git_rev.substr(0, 10);
      bl_key = "[" + git_rev + "]";
      bl_summary = "";
      bl_url = BASEURL + "git/" + body.project.projectKey + "/" + body.content.repository.name + "/" + body.content.revision_type + "/" + body.content.revisions[0].rev;
      bl_comment = body.content.revisions[0].comment;
      break;
    case 18:
      label = "プルリクエスト追加";
      bl_key = "( 担当:" + body.content.assignee.name + " )";
      bl_summary = "「" + body.content.summary + "」";
      bl_url = BASEURL + "git/" + body.project.projectKey + "/" + body.content.repository.name + "/pullRequests/" + body.content.number;
      bl_comment = body.content.description;
      break;
    case 19:
      label = "プルリクエスト更新";
      bl_key = "( 担当:" + body.content.assignee.name + " )";
      bl_summary = "「" + body.content.summary + "」";
      bl_url = BASEURL + "git/" + body.project.projectKey + "/" + body.content.repository.name + "/pullRequests/" + body.content.number;
      bl_comment = body.content.description;
      break;
    case 20:
      label = "プルリクエストコメント";
      bl_key = "( 担当:" + body.content.assignee.name + " )";
      bl_summary = "";
      bl_url = BASEURL + "git/" + body.project.projectKey + "/" + body.content.repository.name + "/pullRequests/" + body.content.number + "#comment-" + body.content.comment.id;
      bl_comment = body.content.comment.content;
      break;

    default:
      return;
  }
  console.log(label);

  if (label) {
    msgObj['message'] = bl_key + " " +
      label +
      bl_summary +
      " by " + body.createdUser.name +
      "\n " + bl_url;
    // 長いコメントは後ろカット
    if (bl_comment.length > 200) {
      bl_comment = bl_comment.substr(0, 200) + "...";
    }
    msgObj['comment'] = bl_comment;
  }
  return msgObj;
}

// POST Slack
function postSlack(channel, message, comment) {
  // 引用コメント部分整形
  var attachments_opts = "";
  if (comment) {
    attachments_opts = {
      "color": "#42ce9f",
      "fields": [
        {
          "value": comment,
          "short": false
        }
      ]
    };
  }

  return new Promise(function (resolve, reject) {
    slack.webhook({
      channel: channel,
      username: BOTNAME,
      text: message,
      attachments: [attachments_opts]
    }, function (err, response) {
      if (err) {
        console.log(response);
        reject(new Error('Error'));
        return;
      } else {
        resolve(response);
      }
    });
  });

}

// Main Handler
exports.handler = function (event, context, callback) {
  var room;
  var body;
  var slackObj = new Object();

  console.log('event:', JSON.stringify(event, null, 4));

  if (event.pathParameters.room && event.body) {
    // 通知先チャンネル取得
    room = event.pathParameters.room;
    console.log('room:', room);
    // json整形・メッセージ作成
    body = JSON.parse(event.body);
    slackObj = makeChatMessage(body);

    // Slack投稿
    if (slackObj) {
      postSlack(room, slackObj['message'], slackObj['comment']);
    }
  } else {
    console.log('対象チャンネルが指定されていないか、データが取得できません。');
  }

  callback(null, 'Done.');

};