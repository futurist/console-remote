const http = require('http')
const fs = require('fs')
const {parse} = require('url')

require('dotenv').config()
const {MongoClient} = require('mongodb')
const HTTP_PORT = process.env.PORT || process.env.DEFAULT_PORT || 16666
const {LOG_FILE, MONGO_URL, MONGO_DB} = process.env

http.createServer((req, res)=>{
  const {url} = req
  const {query={}, pathname} = parse(url, true)

  if(req.method==='POST'){
    const date = new Date()
    const str=[]
    req.on('data', data=>str.push(data))
    req.on('end', ()=>{
      const data = Buffer.concat(str).toString('utf8')
      if(LOG_FILE) fs.appendFile(
        LOG_FILE,
        '\n\n'+ url + ' ' + date + '\n' + data,
        err=>console.log(err)
      )
      if(saveToMongo) saveToMongo({
        data, date, url
      }, (err)=>console.log(err))
    })
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,PATCH,DELETE,CONNECT,TRACE'
    })
  }

  if(pathname=='/view'){
    console.log(query)
    res.writeHead(200, {
      'Content-Type': 'text/plain',
    })
    if(LOG_FILE){
      const data = fs.createReadStream(LOG_FILE)
      data.on('error', err=>res.end('no data'))
      data.pipe(res)
    }
    if(readFromMongo) {
      let q = evalExpression(query.query)
      console.log('query',q)
      readFromMongo(q || [], (err,cursor)=>{
        if(err) return console.log(err)
        cursor.toArray((err, docs)=>{
          if(err) return console.log(err)
          res.end(JSON.stringify(docs))
        })
      })
    }
  } else {
    res.end()
  }
}).listen(HTTP_PORT)

var saveToMongo
var readFromMongo
console.log(MONGO_URL+MONGO_DB)
MongoClient.connect(MONGO_URL+MONGO_DB, function(err, client) {
  if(err) return console.log(err)
  console.log('connected to mongodb')
  const db = client.db(MONGO_DB)
  saveToMongo = (data, cb)=>
    db.collection('logs').insertOne(data, cb)
  readFromMongo = (query, cb)=>
    db.collection('logs').aggregate(query, cb)
})

function evalExpression(str){
  try{
    return new Function('return ('+str+')')()
  }catch(e){}
}
