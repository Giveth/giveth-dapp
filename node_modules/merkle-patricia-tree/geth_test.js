var Trie = require('./secure')
var levelup = require('levelup')
var leveldown = require('leveldown')
var rlp = require('rlp')

var db = levelup('/Users/hdrewes/Library/Ethereum/geth/chaindata')
var stateRoot = "d7f8974fb5ac78d9ac099b9ad5018bedc2ce0a72dad1827a1709da30580f0544" // Block #222
var stateRootG = "12582945fc5ad12c3e7b67c4fc37a68fc0d52d995bb7f7291ff41a2739a7ca16" // Genesis block

var gav = Buffer.from('8a40bfaa73256b60764c1bf40675a99083efb075', 'hex')

// DB test
db.createReadStream()
  .on('data', function (data) {
    console.log(data)
    console.log(data.key.toString('hex'), '=', data.value.toString('hex'))
  })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    console.log('Stream closed')
  })
  .on('end', function () {
    console.log('Stream ended')
  })

var testBuffer = Buffer.from('00d0433b8723d784060a05859c7a604568f4ef67b39eece9cdfcb7e3e63ec763', 'hex')
db.get(testBuffer, { encoding: 'binary' }, function (err, value) { console.log(value); })

db.get(Buffer.from(stateRootG, 'hex'), { encoding: 'binary' }, function (err, value) { console.log(value); })

// Trie test
var trie = new Trie(db, '0x' + stateRoot)

var stream = trie.createReadStream()
stream.on('data', function (data){ console.log(data) }).on('end', function() { console.log('End.')} )

trie.get(gav, function (err, val) {
  var decoded = rlp.decode(val);
  console.log(decoded);
})

