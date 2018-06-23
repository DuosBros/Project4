
mongoexport --host ds153890.mlab.com:53890/heroku_gvlqrgxg --port 53890 -u medpharma -p 'TranMedGroup!234' --db medpharma --collection orders --out temp/orders.json
mongoexport --host ds153890.mlab.com:53890/heroku_gvlqrgxg --port 53890 -u medpharma -p 'TranMedGroup!234' --db medpharma --collection costs --out temp/costs.json
mongoexport --host ds153890.mlab.com:53890/heroku_gvlqrgxg --port 53890 -u medpharma -p 'TranMedGroup!234' --db medpharma --collection senders --out temp/senders.json
mongoexport --host ds153890.mlab.com:53890/heroku_gvlqrgxg --port 53890 -u medpharma -p 'TranMedGroup!234' --db medpharma --collection warehouse --out temp/warehouse.json
mongoexport --host ds153890.mlab.com:53890/heroku_gvlqrgxg --port 53890 -u medpharma -p 'TranMedGroup!234' --db medpharma --collection products --out temp/products.json
mongoexport --host ds153890.mlab.com:53890/heroku_gvlqrgxg --port 53890 -u medpharma -p 'TranMedGroup!234' --db medpharma --collection users --out temp/users.json


mongoimport --drop --db medpharma --collection orders --file temp/orders.json
mongoimport --drop --db medpharma --collection costs --file temp/costs.json
mongoimport --drop --db medpharma --collection senders --file temp/senders.json
mongoimport --drop --db medpharma --collection warehouse --file temp/warehouse.json
mongoimport --drop --db medpharma --collection products --file temp/products.json
mongoimport --drop --db medpharma --collection users --file temp/users.json