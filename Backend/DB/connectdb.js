const mongoose = require('mongoose');
require('dotenv').config();

// * This is the mongodb Atlas connection link
const dbConnect = process.env.db_link;


// * Theses are the parameters
// const connectionParams = {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// };

// * This is the mongodb Atlas connection
mongoose.connect(dbConnect).then(() => {

    console.log('Hurrah! MongoDB connection successfully established :)');

}).catch((err) => {

    console.log('Sorry Bro! MongoDB is not connected :(', err);

})