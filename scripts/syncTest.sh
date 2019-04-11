
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection orders --out temp/orders.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection costs --out temp/costs.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection senders --out temp/senders.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection warehouse --out temp/warehouse.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection products --out temp/products.json
mongoexport --host ds153890.mlab.com:53890 -u medpharma2 -p TranMedGroup12e -d heroku_gvlqrgxg --collection users --out temp/users.json
 
mongoimport -h ds137483.mlab.com:37483 -d heroku_q57klscp -u medpharma2 -p TranMedGroup12e -d heroku_q57klscp --collection orders --drop --file temp/orders.json

mongoimport -h ds137483.mlab.com:37483 -d heroku_q57klscp -u medpharma2 -p TranMedGroup12e -d heroku_q57klscp --collection costs --drop --file temp/costs.json

mongoimport -h ds137483.mlab.com:37483 -d heroku_q57klscp -u medpharma2 -p TranMedGroup12e -d heroku_q57klscp --collection senders --drop --file temp/senders.json

mongoimport -h ds137483.mlab.com:37483 -d heroku_q57klscp -u medpharma2 -p TranMedGroup12e -d heroku_q57klscp --collection warehouse --drop --file temp/warehouse.json

mongoimport -h ds137483.mlab.com:37483 -d heroku_q57klscp -u medpharma2 -p TranMedGroup12e -d heroku_q57klscp --collection products --drop --file temp/products.json

mongoimport -h ds137483.mlab.com:37483 -d heroku_q57klscp -u medpharma2 -p TranMedGroup12e -d heroku_q57klscp --collection users --drop --file temp/users.json