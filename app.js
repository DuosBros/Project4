var express = require('express');
var enforce = require('express-sslify');
var helmet = require('helmet')
var io;
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan = require('morgan');
var app = express();
var env = app.get('env');

app.use(helmet());

app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(__dirname + "/public"));
app.set('mongodb.url', 'mongodb://localhost:27017/medpharma');
//app.set('mongodb.url', 'mongodb://localhost:27017/tranmedgroup');
app.set('salt', 'superSer123.bullsh18t');
app.set('tokenExpiracy', 60 * 30 * 2 * 2 * 12 * 2);
app.set('DELETED_ORDERS_STATE', 'abandoned');
app.set('ACTIVE_ORDERS_STATE', 'active');
app.set('DRAFT_ORDERS_STATE', 'draft');
app.set('ARCHIVED_ORDERS_STATE', 'archived');
app.set('EXPIRED_ORDERS_STATE', 'expired');
app.set('zaslat-base-uri', 'https://www.zaslat.cz/api/v1/');
//app.set('zaslat-base-uri', 'https://test.zaslat.cz/api/v1/');
app.set('zaslat-pickup-uri', 'pickups/add');
app.set('zaslat-get-pickups-uri', 'pickups/list')
app.set('zaslat-rates-uri', 'rates/get')
app.set('zaslat-get-all-shipments-uri', 'shipments/list');
app.set('zaslat-get-shipments-tracking-uri', 'shipments/tracking');
app.set('zaslat-create-shipment', 'shipments/create');
app.set('zaslat-label', 'shipments/label');
app.set('bank-base-uri', 'https://www.fio.cz/ib_api/rest/periods/o3mjc3g69SqnDBaE7Ul7AvafQldh3MUDanF9A837CfmRMsG0idVjPIh0TAb7WVE4/');

app.set('zaslat-token', 'CLqoi4we0JEaJTCLY25uk7QXdSzgNt5qevOxAlLA');
app.set('dropbox-token', 'iNhg1bcaxL8AAAAAAABAS-Nu_J1oDWWOrMvcFXGvmwnHc8iDr2sKNIMaYdafoWN-');

app.set('gmail-redirect-uri', 'http://localhost:3000/rest/gmail/oauthcallback');
app.set('gmail-base-uri', 'https://www.googleapis.com/gmail/v1/users/tnmephagroup@gmail.com/')

if (env != 'development') {
    app.use(enforce.HTTPS({ trustProtoHeader: true }));
    app.set('mongodb.url', 'mongodb://medpharma2:TranMedGroup12e@ds153890.mlab.com:53890/heroku_gvlqrgxg');
    app.set('gmail-redirect-uri', 'https://medpharmavn.herokuapp.com/rest/gmail/oauthcallback');
}

morgan.token('remote-user', function getRemoveUser (req) {
    return req.headers.authorization;
})
app.use(morgan('combined'))
//app.disable('etag');

app.use(bodyParser.urlencoded({'extended':'true'}));


var MongoClient = require('mongodb').MongoClient;
var dbUrl = app.get('mongodb.url');

MongoClient.connect(dbUrl, {}, function(err, db) {
    if (err) {
        console.log("Cannot connect to MongoDB at " + dbUrl);
        throw err;
    }
    console.log("MongoDB connected at " + dbUrl);
    app.set('mongodb', db);

    var server = require('http').createServer(app);
    server.listen(process.env.PORT || 3000);
    io = require('socket.io')(server);
    app.set('socket.io.listener', io);


    require('./routes/orders.js')(app);
    require('./routes/costs.js')(app);
    require('./routes/others.js')(app);
    require('./routes/pdfGeneration.js')(app);
    require('./routes/charts.js')(app);
    require('./routes/warehouse.js')(app);
    require('./routes/zaslat-api.js')(app);
    require('./routes/bank.js')(app);
    require('./routes/notifications.js')(app);
    require('./routes/gmail.js')(app);
    require('./routes/scripts.js')(app);
    require('./routes/default')(app);

    console.log("Server running!");
});



