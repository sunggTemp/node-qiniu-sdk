const File = require('./file');
const Bucket = require('./bucket');
const token = require('./lib/token');
const rp = require('request-promise');
const EncodedEntryURI = require('./lib/EncodedEntryURI');
const urlsafe_base64_encode = require('./lib/urlsafe_base64_encode');

module.exports = SDK;

/**
 * 
 * @param {String} AccessKey 
 * @param {String} SecretKey 
 */
function SDK(AccessKey, SecretKey){
  if (!AccessKey || !SecretKey) throw new Error('Both AccessKey and SecretKey are required');
  this.AccessKey = AccessKey;
  this.SecretKey = SecretKey;
}
// 创建Bucket类
SDK.prototype.bucket = function(bucketName){
  return new Bucket(bucketName, this);
};
// 创建File类
SDK.prototype.file = function(scope){
  return new File(scope, this);
};
/**
 * 获取 Bucket 列表
 * 官方文档：https://developer.qiniu.com/kodo/api/3926/get-service
*/
SDK.prototype.buckets = function(){
  let options = {
    host: 'http://rs.qbox.me',  // 指定特定的请求域名
    path: '/buckets'  // 指定请求的path
  };
  return this.rs(options);
};
/**
 * 异步第三方资源抓取
 * 官方文档：https://developer.qiniu.com/kodo/api/4097/asynch-fetch
*/
SDK.prototype.sisyphus = function(options){
  if (typeof options !== 'object')
    return Promise.reject(new Error('options param must be an Object'));
  if (typeof options.body !== 'object')
    return Promise.reject(new Error('options.body param must be an Object'));
  
  // 默认是华东地区
  options.zone = options.zone || 'z0';

  // 生成HTTP 请求鉴权
  options.path = '/sisyphus/fetch';
  options.host = 'api-' + options.zone + '.qiniu.com';
  options.method = 'POST';
  options['Content-Type'] = 'application/json';
  if (Array.isArray(options.body.url)) options.body.url = options.body.url.join(';');
  let qiniu_token = token.qiniu.call(this, options);

  return rp({
    method: 'POST',
    url: 'http://api-' + options.zone + '.qiniu.com' + options.path,
    headers: {
      'Authorization': qiniu_token,
      'Content-Type': 'application/json'
    },
    json: true,
    body: options.body
  });
};
/**
 * 批量操作 测试未通过
 * 官方文档：https://developer.qiniu.com/kodo/api/1250/batch
 */
SDK.prototype.batch = function(options){
  if (!Array.isArray(options.ops) || options.ops.length === 0)
    return Promise.reject(new Error('options.ops must be an array and options.ops is not an empty array'));

  options.host = 'http://rs.qiniu.com';
  options.path = '/batch';
  options.body = '';

  try {
    // 循环设置body
    options.ops.forEach(item => {
      options.body += 'op=' + this.getOperation(item) + '&';
    });
    // 去掉最后一个"&"
    options.body = options.body.replace(/\&$/, '');

    // options.url = options.host + options.path + '?' + options.body;
  } catch (error) {
    return Promise.reject(error);
  }

  return this.rs(options);
};
/**
 * Tool: 获取资源操作指令，只针对可批量操作的功能
*/
SDK.prototype.getOperation = function(options){
  switch (options._type) {
    case 'delete':
      return '/delete/' + EncodedEntryURI(options.bucket, options.fileName);
    case 'move':
      var EncodedEntryURISrc = EncodedEntryURI(options.bucket, options.fileName);
      var EncodedEntryURIDest = EncodedEntryURI(options.bucket, options.dest);
      var force = !!options.force;
      return '/move/' + EncodedEntryURISrc + '/' + EncodedEntryURIDest + '/force/' + force;
    case 'copy': 
      var EncodedEntryURISrc = EncodedEntryURI(options.bucket, options.fileName);
      var EncodedEntryURIDest = EncodedEntryURI(options.bucket, options.dest);
      var force = !!options.force;
      // 指定请求的path
      return '/copy/' + EncodedEntryURISrc + '/' + EncodedEntryURIDest + '/force/' + force;
    case 'chstatus': 
      // 指定请求的path
      return '/chstatus/' + EncodedEntryURI(options.bucket, options.fileName) + '/status/' + options.status;
    case 'deleteAfterDays': 
      return '/deleteAfterDays/' + EncodedEntryURI(options.bucket, options.fileName) + '/' + options.deleteAfterDays;
    case 'chtype': 
      return '/chtype/' + EncodedEntryURI(options.bucket, options.fileName) + '/type/' + options.type;
    case 'stat': 
      return '/stat/' + EncodedEntryURI(options.bucket, options.fileName);
    case 'prefetch':
      return '/prefetch/' + EncodedEntryURI(options.bucket, options.fileName);
    case 'chgm':
      var encodedEntryURI = EncodedEntryURI(options.bucket, options.fileName);
      // var EncodedMimeType = EncodedEntryURI(options.bucket, options.fileName);
      var path = '/chgm/' + encodedEntryURI;
      options.mime && (path += '/mime/' + urlsafe_base64_encode(options.mime));
      options.meta_key = options.meta_key || 'meta_key';
      path += '/x-qn-meta-' + options.meta_key;
            //  '/<EncodedMetaValue>';
      options.mime && (path += '/cond/' + options.cond);
    default:
      throw new Error('Invalid _type: ' + options._type);
  }
};
/**
 * Tool: 管理系列统一发送请求
 */
SDK.prototype.rs = function(options){
  // 生成管理凭证
  let access_token = token.access.call(this, options);

  // 构造请求配置
  let request_options = {
    method: options.method || 'POST',
    url: options.url || (options.host || 'http://rs.qiniu.com') + options.path,
    headers: {
      'Authorization': 'QBox ' + access_token
    },
    json: true,
    form: options.form || {}
  };

  // 设置content-type
  if (options['content-type']) {
    request_options.headers['content-type'] = options['content-type'];
  }

  // 发送请求
  return rp(request_options);
};