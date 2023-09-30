const mongoose = require("mongoose");
const Candle = require('./model/candle');
const user = require('./model/user')
const cart = require('./model/cart')
mongoose.connect('mongodb://ilhemcandle:Ilhem200204@ac-je5p6fq-shard-00-00.l7qhaom.mongodb.net:27017,ac-je5p6fq-shard-00-01.l7qhaom.mongodb.net:27017,ac-je5p6fq-shard-00-02.l7qhaom.mongodb.net:27017/?ssl=true&replicaSet=atlas-uwij4k-shard-0&authSource=admin&retryWrites=true&w=majority&appName=AtlasApp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
require('dotenv').config();

const multer = require('multer');
const { cloudinary, storage } = require('./cloudinary')
const upload = multer({ storage })
/*cloudinary.uploader.upload('./css/candle.jpg', { folder: 'ilhemcandle' }, (error, result) => {
    if (error) {
        console.error('Error uploading image:', error);
    } else {
        console.log('Image uploaded successfully:', result.url);
    }
});*/
const names = ["Cups", "Flowers", "Cactus", "Gloves",
    "Birthday", "Ring Bearers", "Gifts", "Oval Tray", "Wave Tray",
    "Moonlight", "Heart", "Bubble Candles", "Candle Shellfish (Bigsize)",
    "Rounded Tray", "Cloud Tray", "Love-Spring", "Roses's vase", "shell Tray",
    "Oysters", "Candle Shellfish (Smallsize)", "Woman Stray", "Cloud Candle",
    "Blossoms Candle", "Pumpkin Candle", "Statue", "Apples", "Collar supports", "Shell", "Rectangular tray",
    "Bubble Tray", "Round tray", "Phone Holder"
];
const categories = ["Candle", "Candle", "Candle", "Candle",
    "Candle", "Platre", "Candle", "Platre", "Platre", "Candle",
    "Candle", "Candle", "Candle", "Platre", "Platre", "Candle",
    "Platre", "Platre", "Candle", "Candle", "Platre",
    "Candle", "Candle", "Candle", "Platre", "Candle", "Platre", "Platre"
    , "Platre", "Platre", "Platre", "Platre"];
const images = ["https://res.cloudinary.com/dgs4gikav/image/upload/v1694882608/Ilhemcandle/wo4vbogz58oklbkk6ym4.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882608/Ilhemcandle/nbwxr1q0mopoctznjjao.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882603/Ilhemcandle/slmvahj7gfcbng8tsdga.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882611/Ilhemcandle/dcfmsdln0cte5ri2911t.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882602/Ilhemcandle/xjnrppvay7hjsakwqcqb.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882630/Ilhemcandle/Ring%20Bearers.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882610/Ilhemcandle/ub4natc2acmvjyv99m0e.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882623/Ilhemcandle/Oval%20Tray.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882630/Ilhemcandle/Wavy%20Tray.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882621/Ilhemcandle/Moonlight.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882616/Ilhemcandle/aebjlkmldxkyhzsmjuei.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882602/Ilhemcandle/k0bnejegibco2qvcoiur.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882632/Ilhemcandle/Candle%20Shellfish.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882624/Ilhemcandle/Rounded%20Tray.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882630/Ilhemcandle/Cloudy%20Tray.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882619/Ilhemcandle/Love-Spring.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882615/Ilhemcandle/gohvdsvr3f3s0akhcold.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882627/Ilhemcandle/Plaster%20Shellfish.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882628/Ilhemcandle/Oysters.jpg"
    , "https://res.cloudinary.com/dgs4gikav/image/upload/v1694882632/Ilhemcandle/Candle%20Shellfish.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1694973169/Ilhemcandle/jvhzqio18q3pjlqayv2g.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1695070099/Ilhemcandle/ogplxb3dbedo2gfuofdm.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1695070098/Ilhemcandle/isbn4irifdps3nkkxqqc.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1695070100/Ilhemcandle/x4zz2olgww60vjfnes3i.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1695070100/Ilhemcandle/ps3dhy9hy3d9xp3okth7.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1695070082/Ilhemcandle/isszmjl7ipa0q5clsngw.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1695675856/supportcollier_uidsfs.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1695675855/shelllll_yl286v.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1695675853/rectangulare_tray_plueif.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1695675775/bubble_tray_l1nnxt.jpg", "https://res.cloudinary.com/dgs4gikav/image/upload/v1695676162/roundtray_ah9mym.jpg",
    "https://res.cloudinary.com/dgs4gikav/image/upload/v1696080186/Phone_Holder_cawfqt.jpg"
]
const prices = [550, 300, 200, 400, 750, 100, 180, 350, 350, 400, 30, 230, 500, 550, 450, 350, 450, 300, 250, 180, 350,
    200, 180, 400, 250, 300, 450, 300, 600, 400, 400, 300]
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
    console.log("database connected")
});
console.log(images.length)
const seeDB = async () => {
    await Candle.deleteMany({});
    // await user.deleteMany({});
    //await cart.deleteMany({})
    for (let i = 0; i < images.length; i++) {
        const cann = new Candle({
            title: names[i],
            price: prices[i],
            picture: images[i],
            categorie: categories[i]
        })
        await cann.save();
    }

    /*const updated = await user.findOneAndDelete(
        { email: "chakibselka164@gmail.com" },


    );
*/
    //const ana = user.find()
    //console.log(Candle.find())
    /* try {
         const result = await user.updateOne(
             {
                 username: "a"
             },
             {
                 $set: {
                     Cartitems: []
                 }
             }
         );
         console.log(`Updated ${result.nModified} user(s)`);
     } catch (error) {
         console.error("Error updating user cart:", error);
     }*/
    // Update documents with the old "Phone" field to use "Phonenumber"
    /* const seyi = await user.updateMany({ Phonenumber: { $exists: true } }, { $rename: { "Phonenumber": "Phonenumber" } });
     console.log(seyi)
     const phone = await user.find({ Phone: null })
     console.log("phone", phone)
     const phonze = await user.find({ Phonenumber: null });
     console.log("phonenumber", phonze);
     /*try {
         await user.collection.dropIndex("Phonenumber");
         console.log("Phonenumber index removed.");
     } catch (error) {
         console.error("Error dropping index:", error);
     }*/

    //await cart.deleteMany({})

}

seeDB().then(() => {
    mongoose.connection.close()
})
