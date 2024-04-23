// 模組化:將schema及model從主程式拆出來
const mongoose = require("mongoose");
/*
Schema定義MongoDB文件的結構與規則：
1.欄位的資料類型
2.欄位是否為必須
3.欄位的預設值
4.驗證規則
*/
const postSchema = new mongoose.Schema(
    {
      content: {
        type: String,
        // 透過陣列來顯示回饋訊息
        required: [true, 'Content 未填寫']
      },
      image: {
        type:String,
        default:""
      },
      createdAt: {
        type: Date,
        // 使用Date.now作為函數引用，而非立即調用。若使用Date.now()將導致所有實例共享相同的創建時間
        default: Date.now, // default是指若沒有填寫，預設所給的值
        // select為false代表建立這個屬性，但不會被find()找出來而具保護效果，作用範圍僅限於Node.js後端的查詢，對於其他非Node.js環境或工具可能不具有效性
        select: false
      },
      name: {
          type: String,
          required: [true, '貼文姓名未填寫']
      },
      likes: {
          type:Number,
          default:0
        }
    }
);
// 在mongoose中，model()允許將已定義好的schema整合為可操作的模型，具有與MongoDB互動的多種方法
// 習慣上model會用大寫
const Post = mongoose.model('Post', postSchema);
/*
model第一個參數是模型名稱，會自動對應到MongoDB的collection名稱
第二個參數是schema
第三個參數是強制對應的MongoDB的collection名稱(可不填)

第一個參數在進到MongoDB時，會因為要符合習慣而自動變更
全英文小寫
複數形式
Room => rooms
Study => studies
cookies => 因符合MongoDB習慣而無變化

若想要依照自己的collection名稱
方法1：在 model() 的第三个參數中指定集合名稱
mongoose.model('ModelName', modelNameSchema, 'custom_collection_name');

方法2：在 mongoose.Schema() 的第二個參數中指定集合名稱 (寫死在schema)
new mongoose.Schema({ schema definition }, { collection: 'custom_collection_name' });
*/

module.exports = Post;