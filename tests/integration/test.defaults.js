'use strict';
if (!process.env.LEVEL_ADAPTER &&
    !process.env.LEVEL_PREFIX &&
    !process.env.AUTO_COMPACTION &&
    !process.env.ADAPTERS) {
  // these tests don't make sense for anything other than default leveldown
  var path = require('path');
  const { mkdirSync } = require('fs');
  var rimraf = require('rimraf');

  describe('defaults', function () {

    beforeEach(function () {
      return new PouchDB('mydb').destroy().then(function () {
        return new PouchDB('mydb', {db: require('memdown')}).destroy();
      });
    });

    afterEach(function (done) {
      rimraf.sync('./tmp/_pouch_.');
      rimraf.sync('./tmp/path');
      done();
    });

    it('should allow prefixes', function () {
      var prefix = './tmp/path/to/db/1/';
      var dir = path.join(prefix, '/tmp/');
      var dir2 = path.join('./tmp/_pouch_./', prefix);
      var dir3 = path.join(dir2, './tmp/_pouch_mydb');
      mkdirSync(dir, { recursive:true });
      mkdirSync(dir2, { recursive:true });
      mkdirSync(dir3, { recursive:true });

      var db = new PouchDB('mydb', {prefix});
      return db.info().then(function (info1) {
        info1.db_name.should.equal('mydb');
        return db.destroy();
      });
    });

    it('Defaults leaks eventEmitters', function () {
      PouchDB.defaults({db: require('memdown') });
      PouchDB.defaults({db: require('memdown') });
      PouchDB.defaults({db: require('memdown') });
      PouchDB.defaults({db: require('memdown') });
    });

    it('should allow us to set a prefix by default', function () {
      var prefix = './tmp/path/to/db/2/';
      var dir = path.join(prefix, '/tmp/');
      var dir2 = path.join('./tmp/_pouch_./', prefix);
      var dir3 = path.join(dir2, './tmp/_pouch_mydb');
      mkdirSync(dir, { recursive:true });
      mkdirSync(dir2, { recursive:true });
      mkdirSync(dir3, { recursive:true });

      var CustomPouch = PouchDB.defaults({
        prefix
      });
      var db = CustomPouch({name: 'mydb'});
      return db.info().then(function (info1) {
        info1.db_name.should.equal('mydb');
        return db.destroy();
      });
    });

    it('should allow us to use memdown', function () {
      var opts = { name: 'mydb', db: require('memdown') };
      var db = new PouchDB(opts);
      return db.put({_id: 'foo'}).then(function () {
        var otherDB = new PouchDB('mydb');
        return db.info().then(function (info1) {
          return otherDB.info().then(function (info2) {
            info1.doc_count.should.not.equal(info2.doc_count);
            return otherDB.destroy();
          }).then(function () {
            return db.destroy();
          });
        });
      });
    });

    it('should allow us to destroy memdown', function () {
      var opts = {db: require('memdown') };
      var db = new PouchDB('mydb', opts);
      return db.put({_id: 'foo'}).then(function () {
        var otherDB = new PouchDB('mydb', opts);
        return db.info().then(function (info1) {
          return otherDB.info().then(function (info2) {
            info1.doc_count.should.equal(info2.doc_count);
            return otherDB.destroy();
          }).then(function () {
            var db3 = new PouchDB('mydb', opts);
            return db3.info().then(function (info) {
              info.doc_count.should.equal(0);
              return db3.destroy();
            });
          });
        });
      });
    });

    it('should allow us to use memdown by default', function () {
      var CustomPouch = PouchDB.defaults({db: require('memdown')});
      var db = new CustomPouch('mydb');
      return db.put({_id: 'foo'}).then(function () {
        var otherDB = new PouchDB('mydb');
        return db.info().then(function (info1) {
          return otherDB.info().then(function (info2) {
            info1.doc_count.should.not.equal(info2.doc_count);
            return otherDB.destroy();
          }).then(function () {
            return db.destroy();
          });
        });
      });
    });


    it('should inform us when using memdown', function () {
      var opts = { name: 'mydb', db: require('memdown') };
      var db = new PouchDB(opts);
      return db.info().then(function (info) {
        info.backend_adapter.should.equal('MemDOWN');
      });
    });

    it('constructor emits destroyed when using defaults', function () {
      var CustomPouch = PouchDB.defaults({db: require('memdown')});

      var db = new CustomPouch('mydb');
      return new Promise(function (resolve) {
        CustomPouch.once('destroyed', function (name) {
          name.should.equal('mydb');
          resolve();
        });
        db.destroy();
      });
    });

    it('db emits destroyed when using defaults', function () {
      var CustomPouch = PouchDB.defaults({db: require('memdown')});

      var db = new CustomPouch('mydb');
      return new Promise(function (resolve) {
        db.once('destroyed', resolve);
        db.destroy();
      });
    });

    it('constructor emits creation event', function (done) {
      var CustomPouch = PouchDB.defaults({db: require('memdown')});

      CustomPouch.once('created', function (name) {
        name.should.equal('mydb', 'should be same thing');
        done();
      });
      new PouchDB('mydb');
    });

    // somewhat odd behavior (CustomPouch constructor always mirrors PouchDB),
    // but better to test it explicitly
    it('PouchDB emits destroyed when using defaults', function () {
      var CustomPouch = PouchDB.defaults({db: require('memdown')});

      var db = new CustomPouch('mydb');
      return new Promise(function (resolve) {
        PouchDB.once('destroyed', function (name) {
          name.should.equal('mydb');
          resolve();
        });
        db.destroy();
      });
    });

    // somewhat odd behavior (CustomPouch constructor always mirrors PouchDB),
    // but better to test it explicitly
    it('PouchDB emits created when using defaults', function (done) {
      var CustomPouch = PouchDB.defaults({db: require('memdown')});

      PouchDB.once('created', function (name) {
        name.should.equal('mydb', 'should be same thing');
        done();
      });
      new CustomPouch('mydb');
    });

    it('should be transitive (#5922)', function () {
      var CustomPouch = PouchDB
        .defaults({db: require('memdown')})
        .defaults({});

      var db = new CustomPouch('mydb');
      return db.info().then(function (info) {
        info.backend_adapter.should.equal('MemDOWN');
      });
    });
  });
}
