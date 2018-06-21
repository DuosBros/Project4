mongoimport --drop --db medpharma --collection orders --file backup/orders.json
mongoimport --drop --db medpharma --collection costs --file backup/costs.json
mongoimport --drop --db medpharma --collection senders --file backup/senders.json
mongoimport --drop --db medpharma --collection warehouse --file backup/warehouse.json
mongoimport --drop --db medpharma --collection products --file backup/products.json