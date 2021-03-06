const expect = require('chai').expect;
const debug = require('debug')('test');
const Qiniu = require('../index');
const qiniu_config = require('./resource/qiniu.config');
const qiniu = new Qiniu(qiniu_config.AccessKey, qiniu_config.SecretKey);

const common = {
  bucketName: null
};
describe('Bucket 相关方法测试', function(){
  this.timeout(20000);
  before(function(){
    // 随机个名字
    common.bucketName = new Date().getTime() + '';
  });
  it('mk 创建 Bucket', function(done){
    qiniu.bucket(common.bucketName)
    .mk()
    .then(function(result){
      debug('创建bucket：%s并返回：%s', common.bucketName, JSON.stringify(result));
      expect(result).to.be.an('object');
      done();
    })
    .catch(console.error);
  });
  it('image 设置 Bucket 镜像源', function(done){
    qiniu.bucket(common.bucketName)
    .image('http://p0vquqra2.bkt.clouddn.com')
    .then(function(result){
      debug('设置Bucket镜像源并返回：%s', JSON.stringify(result));
      expect(result).to.be.an('object');
      done();
    })
    .catch(console.error);
  });
  it('private 设置 Bucket 访问权限', function(done){
    qiniu.bucket(common.bucketName)
    .private(1)
    .then(function(result){
      debug('设置Bucket访问权限并返回：%s', JSON.stringify(result));
      expect(result).to.be.an('object');
      done();
    })
    .catch(console.error);
  });
  it('domain 获取 Bucket 空间域名', function(done){
    qiniu.bucket(common.bucketName)
    .domain()
    .then(function(result){
      debug('获取Bucket空间域名并返回：%s', JSON.stringify(result));
      expect(result).to.be.an('array');
      done();
    })
    .catch(console.error);
  });
  it('list 资源列举', function(done){
    qiniu.bucket(common.bucketName)
    .list({ limit: 100 })
    .then(function(result){
      debug('资源列举并返回：%s', JSON.stringify(result));
      expect(result).to.be.an('object');
      expect(result.items).to.be.an('array');
      done();
    })
    .catch(console.error);
  });
  it('drop 删除 Bucket', function(done){
    qiniu.bucket(common.bucketName)
    .drop()
    .then(function(result){
      debug('删除Bucket并返回：%s', JSON.stringify(result));
      expect(result).to.be.an('object');
      done();
    })
    .catch(console.error);
  });
});