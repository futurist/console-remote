const http = require('http')
const fs = require('fs')
const LOG = 'data.log'
const PORT = process.env.PORT || process.env.DEFAULT_PORT || 16666

http.createServer((req, res)=>{

  if(req.method==='POST'){
    const str=[Buffer.from('\n\n'+ req.url + ' ' + (new Date()) + '\n' )]
    req.on('data', data=>str.push(data))
    req.on('end', ()=>{
      fs.appendFile(LOG, Buffer.concat(str), err=>console.log(err))
    })
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,PATCH,DELETE,CONNECT,TRACE'
    })
  }

  if(req.url=='/view'){
    res.writeHead(200, {
      'Content-Type': 'text/plain',
    })
    fs.createReadStream(LOG).pipe(res)
  } else {
    res.end()
  }
}).listen(PORT)

