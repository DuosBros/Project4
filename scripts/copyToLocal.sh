mongoexport --db medpharma --collection orders --out temp/orders.json
mongoexport --db medpharma --collection costs --out temp/costs.json
mongoexport --db medpharma --collection senders --out temp/senders.json
mongoexport --db medpharma --collection warehouse --out temp/warehouse.json
mongoexport --db medpharma --collection products --out temp/products.json