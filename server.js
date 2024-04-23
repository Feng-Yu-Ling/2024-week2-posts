const http = require('http');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
//模組化的Post model，習慣上model會用大寫
const Post = require("./models/post");
// 指定.env檔所在的位置，並將.env檔案中的環境變數載入到process.env中
dotenv.config({path:"./config.env"});

const DB = process.env.DATABASE.replace(
    "<password>",
    process.env.DATABASE_PASSWORD
);

mongoose
// port號/後面接資料庫名稱，若不存在則會新增
.connect(DB)
.then(() => console.log('資料庫連接成功'));

// req:request物件，包含客戶端的詳細資訊
// res:response物件，包含伺服器端的詳細資訊
const requestListener = async(req, res)=>{
    const headers = {
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
        'Content-Type': 'application/json'
    }
    // 初始化body為空字串以累積從請求接收到的數據
    let body = "";
    // 監聽請求流的"data"事件，當數據塊可讀時，將觸發此事件，然後將chunk作為參數傳遞給callback函式，添加到body字串。這過程會持續直到所有的數據被接收完畢
    req.on('data', chunk=>{
        body+=chunk;
    })
    
    // 取得所有貼文
    if(req.url=="/posts" && req.method == "GET"){
        // 等待資料庫回傳結果，因為這是一個異步操作，會返回promise，所以需要加await
        const post = await Post.find();
        res.writeHead(200,headers);
        // 將object轉換為字串，不然伺服器無法解析
        res.write(JSON.stringify({
            "status": "success",
            post
        }));
        res.end();
    }
    // 新增一筆貼文
    else if(req.url=="/posts" && req.method == "POST"){
        // 監聽請求流的"end"事件，當所有的數據塊接收完畢時將觸發這事件。"end"事件不需要參數，因為所有數據都已透過"data"事件處理完畢
        req.on('end',async()=>{
            try{
                const data = JSON.parse(body);
                if(data.content !== undefined){
                    // 新增資料 (透過create方法，較直覺，這是mongoose優化的作法)
                    // 創建實例並保存到資料庫的過程，因為這是一個異步操作，會返回promise，所以需要加await
                    // 由於這裡用了await，所以上一層的函式要加async才可以正確執行
                    const newPost = await Post.create(
                        {
                            name: data.name,
                            content: data.content,
                        }
                    );
                    res.writeHead(200,headers);
                    // 將object轉換為字串，不然伺服器無法解析
                    res.write(JSON.stringify({
                        "status": "success",
                        "data": newPost,
                    }));
                    res.end();
                    
                }
                else{
                    res.writeHead(400,headers);
                    // 將object轉換為字串，不然伺服器無法解析
                    res.write(JSON.stringify({
                        "status": "false",
                        "message": "欄位未填寫正確，或無此 post ID",
                    }));
                    res.end();
                }
            }
            catch(error){
                res.writeHead(400,headers);
                // 將object轉換為字串，不然伺服器無法解析
                res.write(JSON.stringify({
                    "status": "false",
                    "message": error,
                }));
                res.end();
            }
        })
    }

    // 刪除全部貼文
    else if(req.url=="/posts" && req.method == "DELETE"){
        await Post.deleteMany({});
        const posts = await Post.find();
        res.writeHead(200, headers);
        // 將object轉換為字串，不然伺服器無法解析
        res.write(JSON.stringify(
            {
                "status":"success",
                posts
            }
        ))
        res.end();
    }

    // 刪除一筆貼文
    else if(req.url.startsWith("/posts/") && req.method=="DELETE"){
        try{
        const id = req.url.split('/').pop();
        // 等待資料庫刪除完成，因為這是一個異步操作，會返回promise，所以需要加await
        const searchResult = await Post.findByIdAndDelete(id);
        if(!searchResult){
            res.writeHead(400, headers);
            // 將object轉換為字串，不然伺服器無法解析
            res.write(JSON.stringify({
                "status":"false",
                "message":"無此 post ID"
            }))
            res.end();
        }
        else{
            res.writeHead(200,headers);
            // 將object轉換為字串，不然伺服器無法解析
            res.write(JSON.stringify({
                "status": "success",
                "data": null,
        }));
        res.end();
        }
        }
        catch(error){
            res.writeHead(400, headers);
            // 將object轉換為字串，不然伺服器無法解析
            res.write(JSON.stringify({
                "status":"false",
                "message":"post ID格式不正確"
            }))
            res.end();
        }
    }

    // 更新一筆貼文
    else if(req.url.startsWith("/posts/") && req.method=="PATCH"){
        // 監聽請求流的"end"事件，當所有的數據塊接收完畢時將觸發這事件。"end"事件不需要參數，因為所有數據都已透過"data"事件處理完畢
        req.on("end", async()=>{
            try{
                const data = JSON.parse(body);
                const id = req.url.split("/").pop();
                // 等待資料庫更新資料，因為這是一個異步操作，會返回promise，所以需要加await
                // 由於這裡用了await，所以上一層的函式要加async才可以正確執行
                const searchResult = await Post.findByIdAndUpdate(id, data);
                if(!searchResult){
                res.writeHead(400, headers);
                // 將object轉換為字串，不然伺服器無法解析
                res.write(JSON.stringify({
                    "status":"false",
                    "message":"無此 post ID"
                }))
                res.end();
                }
                else{
                // 等待資料庫回傳結果，因為這是一個異步操作，會返回promise，所以需要加await
                const updatedPost = await Post.findById(id)
                res.writeHead(200, headers);
                // 將object轉換為字串，不然伺服器無法解析
                res.write(JSON.stringify({
                    "status":"success",
                    "data":updatedPost
                }));
                res.end();
                }
            }
            catch(error){
                res.writeHead(400, headers);
                // 將object轉換為字串，不然伺服器無法解析
                res.write(JSON.stringify({
                    "status":"false",
                    "message":"欄位未填寫正確，或post ID格式不正確"
                }))
                res.end();
            }
        })
    }


    else if(req.method == "OPTIONS"){
        res.writeHead(200,headers);
        res.end();
    }
    else{
        res.writeHead(404,headers);
        // 將object轉換為字串，不然伺服器無法解析
        res.write(JSON.stringify({
            "status": "false",
            "message": "無此網站路由"
        }));
        res.end();
    }
}
const server = http.createServer(requestListener);

const port = process.env.PORT || 3000;
server.listen(port);