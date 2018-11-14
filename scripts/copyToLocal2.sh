
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection orders --out temp/orders.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection costs --out temp/costs.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection senders --out temp/senders.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection warehouse --out temp/warehouse.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection products --out temp/products.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection users --out temp/users.json


mongoimport --drop --db medpharma --collection orders --file temp/orders.json
mongoimport --drop --db medpharma --collection costs --file temp/costs.json
mongoimport --drop --db medpharma --collection senders --file temp/senders.json
mongoimport --drop --db medpharma --collection warehouse --file temp/warehouse.json
mongoimport --drop --db medpharma --collection products --file temp/products.json
mongoimport --drop --db medpharma --collection users --file temp/users.json