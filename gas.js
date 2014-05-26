/**
 * チャットワークのタスクをGoogleカレンダーのイベントとして登録する
 *
 * @param {assoc} config
 */
function cwtaskToEvent(config) {
  var client = ChatWorkClient.factory({token: config.api_token});
  
  // イベントの参加者のメールアドレス（指定なしの場合はScript実行者のログインメールアドレス）
  config.guest_email = config.guest_email || Session.getActiveUser().getEmail();
  
  // イベント登録したいタスク担当者のaccount_id（指定なしの場合はAPI実行者のaccount_id）
  config.account_id  = config.account_id || client.get('/me')['account_id'];
  
  var calendar_id = config.calendar_id;
  var room_id     = config.room_id;
  var guest_email = config.guest_email;
  var account_id  = config.account_id;
  
  // 未完了タスクを取得
  var mytask_list = client.getRoomTasks(room_id, {
    account_id: account_id,
    status: 'open'
  });
  
  // チャットワークのタスクで期限があるものを、カレンダーの予定として登録
  var calendar  = CalendarApp.getCalendarById(calendar_id);
  var task_info = {};
  var db        = ScriptDb.getMyDb();
  var save_data = {type: config2identifier(config), task_id: 0};

  for (var i = 0, len = mytask_list.length; i < len; i++) {
    task_info = mytask_list[i];
    
    save_data.task_id = task_info.task_id;

    // 期限が設定されている かつ まだカレンダーへ登録していない場合は登録処理をする
    if (task_info.limit_time && db.query(save_data).hasNext() == false) {
      calendar.createAllDayEvent(task_info.body, new Date(task_info.limit_time * 1000), {
        guests: guest_email
      });
      
      // 登録済みとしてデータ保存
      db.save(save_data);
    }
  }
}

var config2identifier = function(config) {
  var identifier = '';
  var white_list = ['calendar_id', 'room_id', 'account_id'];
  for (var i = 0, len = white_list.length, key =''; i < len; i++) {
    key = white_list[i];
    identifier = identifier + getMD5(config[key]);
  }
  return identifier;
}


/*
 See:Google Apps Help forum
 http://www.google.com/support/forum/p/apps-script/thread?tid=0a18d7ca49d1cdf4&hl=en
*/
var getMD5 = function(string) {
  var theHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, string);
  var txt_hash = '';
  for (j = 0; j < theHash.length; j++) {
    var hashVal = theHash[j];
    if (hashVal < 0)
      hashVal += 256; 
    if (hashVal.toString(16).length == 1)
      txt_hash += "0";
    txt_hash += hashVal.toString(16);
  }
  return txt_hash;
}
