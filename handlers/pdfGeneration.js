
const path = require('path');
var rootPath = path.resolve(__dirname + '/../');

var fonts = {
	Roboto: {
		normal: rootPath + '/libs/pdfmake/fonts/Roboto-Regular.ttf',
		bold: rootPath + '/libs/pdfmake/fonts/Roboto-Medium.ttf',
		italics: rootPath + '/libs/pdfmake/fonts/Roboto-Italic.ttf'
	}
};

var PdfPrinter = require('../libs/pdfmake/printer');
var printer = new PdfPrinter(fonts);

var Q = require('q');
const fs = require('fs');
var dateFormat = require('dateformat');

var OthersHandler = require('./others').Handler;
var others;

var allProductsData;

require('isomorphic-fetch')
var Dropbox = require('dropbox').Dropbox;
var dbx;

Handler = function(app) {
	dbx = new Dropbox({ accessToken: app.get('dropbox-token') });
	others = new OthersHandler(app);

	others.getAllProductsJson()
	.then(function(products) {
		allProductsData = products;
	})
};

Handler = function(app, shit2) {
	if (app) {
		dbx = new Dropbox({ accessToken: app.get('dropbox-token') });
		others = new OthersHandler(app);

		others.getAllProductsJson()
		.then(function(products) {
			allProductsData = products;
		})
	} else {
		console.log('script');
		dbx = new Dropbox({ accessToken: 'iNhg1bcaxL8AAAAAAABAS-Nu_J1oDWWOrMvcFXGvmwnHc8iDr2sKNIMaYdafoWN-' });
	}
};

Handler.prototype.generatePdf = function(order, index, dataForScripts) {
	var deferred = Q.defer();

	if (dataForScripts) {
		allProductsData = dataForScripts;
	}

	var ZERO_AMOUNT_NO_CURRENCY = "0,00";
	var ZERO_AMOUNT_WITH_CURRENCY = "0,00 Kč"
	var dateformat = 'dd.mm.yyyy';
	var DATUM_SPLATNOSTI_DAYS = 14;

    var vs = '';
	if(order.payment.vs) {
		vs = order.payment.vs;
    }
    var dnesniDatum = new Date();
	var datumSplatnosti = new Date();
	datumSplatnosti.setTime( datumSplatnosti.getTime() + DATUM_SPLATNOSTI_DAYS * 86400000 );
    var aktualniRok = dnesniDatum.getFullYear();

	var invoiceNumber = '' + vs;

	var address = order.address;
	var firstName = '';
	var lastName = '';
	var street = '';
	var city = '';
	var psc = '';
	var streetNumber = '';
	if(address.firstName) {
		firstName = address.firstName;
	}
	if(address.lastName) {
		lastName = address.lastName;
	}
	if(address.street) {
		street = address.street;
	}
	if(address.city) {
		city = address.city;
	}
	if(address.psc) {
		psc = address.psc;
	}
	if(address.streetNumber) {
		streetNumber = address.streetNumber;
	}

	var postovneCena = 0 + '';
	if(order.payment.price) {
		postovneCena = order.payment.price;
	}

	var totalPrice = order.totalPrice;
	var totalPriceStr = appendDecimalPointAndZerosBehindAmount(totalPrice);

	var products = order.products;

	var totalPriceNormalTax = 0;
	var totalPriceLowerTax = 0;
	var totalSlevy = 0;
	var totalTax = 0;

	var productsTableHead = [];
	productsTableHead[0] = [];
	productsTableHead[0].push({ text: 'Označení dodávky', style: 'tableHeader' });
	productsTableHead[0].push({ text: 'Počet MJ', style: 'tableHeader', alignment: 'center'});
	productsTableHead[0].push({ text: 'MJ', style: 'tableHeader', alignment: 'center' });
	productsTableHead[0].push({ text: 'Cena/MJ', style: 'tableHeader', alignment: 'center' });
	productsTableHead[0].push({ text: 'Sazba', style: 'tableHeader', alignment: 'center' });
	//productsTableHead[0].push({ text: 'DPH/MJ', style: 'tableHeader', alignment: 'center' });aaaa
	//productsTableHead[0].push({ text: 'DPH', style: 'tableHeader', alignment: 'center' });aaaa
	productsTableHead[0].push({ text: 'Celkem', style: 'tableHeader', alignment: 'right' }); // s DPH
	var mappedProducts = [];
	for(var i = 0; i < products.length; i++) {
		mappedProducts[i] = [];
		mappedProducts[i].push({text: products[i].productName, style:'tableProductName'});
		mappedProducts[i].push({text: products[i].count.toString(), style:'tableContent'});
		mappedProducts[i].push({text: 'ks', style:'tableContent'});
		mappedProducts[i].push({text: appendDecimalPointAndZerosBehindAmount(products[i].pricePerOne), style:'tableContent'});
		if (products[i].productName == 'Sleva' || products[i].productName == 'Other') {
			mappedProducts[i].push({text: '-', style:'tableContent'});
			//mappedProducts[i].push({text: '-', style:'tableContent'});aaaa
			//mappedProducts[i].push({text: '-', style:'tableContent'});aaaa
			if (products[i].productName == 'Sleva') {
				totalSlevy += products[i].totalPricePerProduct;
			}
		} else {
			var tax = allProductsData[products[i].productName].tax ? allProductsData[products[i].productName].tax + '%' : '15%'
			var taxPerItem;
			var taxPerProduct;

			if (15 == allProductsData[products[i].productName].tax) {
				taxPerItem = calculateLowerTax(products[i].pricePerOne);
				taxPerProduct = calculateLowerTax(products[i].totalPricePerProduct);
			} else {
				taxPerItem = calculateNormalTax(products[i].pricePerOne);
				taxPerProduct = calculateNormalTax(products[i].totalPricePerProduct);
			}
			totalTax += parseFloat(taxPerProduct);

			mappedProducts[i].push({text: tax, style:'tableContent'});
			//mappedProducts[i].push({text: taxPerItem + '', style:'tableContent'});aaaa
			//mappedProducts[i].push({text: taxPerProduct + '', style:'tableContent'});aaaa

			if (tax == '15%') {
				totalPriceLowerTax += products[i].totalPricePerProduct;
			} else if (tax == '21%') {
				totalPriceNormalTax += products[i].totalPricePerProduct;
			}
		}

		mappedProducts[i].push({text: appendCurrencyBehindAmount(appendDecimalPointAndZerosBehindAmount(products[i].totalPricePerProduct)), style:'tableContentTotal'});
	}

	var postovneTab = [];
	postovneTab[0] = [];
	postovneTab[0].push({text: 'Poštovné', style:'tableProductName'});
	postovneTab[0].push({text: '1', style:'tableContent'});
	postovneTab[0].push({text: '', style:'tableContent'});
	postovneTab[0].push({text: '', style:'tableContent'});
	postovneTab[0].push({text: '-', style:'tableContent'});
	//postovneTab[0].push({text: '-', style:'tableContent'});aaaa
	//postovneTab[0].push({text: '-', style:'tableContent'});aaaa
	postovneTab[0].push({text: appendCurrencyBehindAmount(appendDecimalPointAndZerosBehindAmount(postovneCena)), style:'tableContentTotal'});

	var allProductsTable = [];
	allProductsTable.push(productsTableHead[0]);
	for(var i = 0; i < mappedProducts.length; i++) {
		allProductsTable.push(mappedProducts[i]);
	}
	allProductsTable.push(postovneTab[0]);

	var image = 'data:image/jpeg;base64,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';

	var signature = 'data:image/jpeg;base64,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';

	var heart = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAeAB4AAD/2wBDAAIBAQIBAQICAgICAgICAwUDAwMDAwYEBAMFBwYHBwcGBwcICQsJCAgKCAcHCg0KCgsMDAwMBwkODw0MDgsMDAz/2wBDAQICAgMDAwYDAwYMCAcIDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAz/wAARCAAQABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9BbnwH+0Z8T/21vit4k0H4q3Wiy/DLU7RdE8A3UBXR/Eelyx+bH5rh9kfn7Zo/P8ALkdXR/mXYNrvBng34/fCr9un4ca74w+LGoatF8QtQv4NZ8GLbldD0ezSz84fZn8wq6wzSW1uJjFFI8roMuHbd9Dftoah4p+HPhRfFHwx8Jf8JJ8UtURfDWl42rGkUrGYyXBYqpji8t3UuwVWc8gOwPCfsofsi/EC6+IOm/ED416pa6hr2jWSwaVpFvevepBctl5r65lYKrTF3cRQxKLe3QjYN3zDzaPC8HS+tVK7T5+ZLnk27O/w37e5r7tru19H+o4jxeqXeBpYGk4PD+xf7iknG9Pk/ict7Kd6/N/F5moc9tV//9k=';

    var dd = {
		header: {
	    columns: [
	      {
			image: image,
			width: 125,
			margin: [0, 10, 0, 0]
	      },
		  {text: 'FAKTURA - daňový doklad č. ' + invoiceNumber, alignment: 'right', style: 'header'}
	    ]
	  },
	    footer: {
	    columns: [
	      { text: 'Společnost TranMedGroup s.r.o. potvrzuje, že na zboží, které dovává svým odběratelům, bylo vydáno prohlášení o\n'
				    + 'shodě v souladu se zákonem č. 110/1997 Sb. § odst. 1.2, v rozsahu stanoveném vyhláškou.', alignment: 'center', style: 'comment' }
	    ]
	  },
		content: [
			{
				table: {
						widths: [245, 245],
						body: [
								[
									{ text: [
										{ text: '\nDodavatel:\n\n',  style: 'smallHeader'},
										{ text: 'TranMedGroup s.r.o\nB. Četyny 932/6\n70030 Ostrava\nIČ: 05495172 DIČ: CZ05495172\nTel.: +420773115262',
											style: 'dodavatelOdberatel'
										} ]
									},
									{ text: [
										{ text: '\nOdběratel:\n\n',  style: 'smallHeader' },
										{ text: firstName + ' ' + lastName +  '\n' + street + ' ' + streetNumber + '\n' + psc  + ' ' + city
										+ '\nIČ:                      DIČ:\n\n ', style: 'dodavatelOdberatel'
										} ]
									}
								],
								['',{ text: [
										{ text: '\nKonečný příjemce:\n\n',  style: 'konecnyPrijemce'},
										{ text: firstName + ' ' + lastName +  '\n' + street + ' ' + streetNumber + '\n' + psc  + ' ' + city,
										style: 'dodavatelOdberatel'
										}
										]
									}
								],
								[
									{
										style: 'bankovniInfo',
										colSpan: 2,
										text: [
										'Účet:                           FIO BANKA 2401089228 / 2010          Faktura číslo:                                                         ' + invoiceNumber
										+'\nSWIFT:                                                     FIOBCZPPXXX           Objednávka:                                                           '
										+ invoiceNumber + '\n' +
										'IBAN:                            CZ4720100000002401089228          Konstantní symbol:\n' +
										'Způsob platby:                           Bankovním převodem          Variabilní symbol:                                                  '
										+ vs + '\n' +
										'Datum vystavení:                                         ' + dateFormat(dnesniDatum, dateformat) + '           Specifický symbol:\n' +
										'Datum usk. zdaň. plnění:                            ' + dateFormat(dnesniDatum, dateformat) + '           Poznámka:\n' +
										'Datum splatnosti:                                        ',
										{ text: dateFormat(datumSplatnosti, dateformat), style: 'datumSplatnosti' },
										]
									}
								]
						]
				},
			},
			{
				table: {
						widths: [138, 60, 30, 65, 45, 91],
						//widths: [138, 43, 8, 42, 23, 39, 35, 70],aaaa
						headerRows: 1,
						style: 'tableContent',
						body: allProductsTable
				},
				layout: 'lightHorizontalLines'
			},
			{
							text: '______________________________________________________________________________________________\n\n',
			},
			{
			    columns: [
					{
						style: 'tableExample',
						table: {
								headerRows: 1,
								widths: [130, 90],
								body: [
										[{ text: 'Částka (bez DPH)', style: 'tableHeader', alignment: 'left'},
										{ text: appendCurrencyBehindAmount(calculatePriceWithoutDPH(totalTax, postovneCena, totalSlevy, totalPrice).toFixed(2).replace('.', ',')),
											style: 'tableHeader',alignment: 'right' }],

										[{ text: 'Poštovné (refakturace)', style: 'tableHeader', alignment: 'left'}, { text: appendCurrencyBehindAmount(appendDecimalPointAndZerosBehindAmount(postovneCena)).toString().replace('.', ','), style: 'tableHeader',alignment: 'right' }],

										[
											{
												text: 'Celková částka (bez DPH)', style: 'tableHeader', alignment: 'left'
											},
											{
												text: appendCurrencyBehindAmount(calculatePriceWithShippingWithoutDPH(totalTax, totalSlevy, totalPrice)).replace('.', ','),
												style: 'tableHeader',
												alignment: 'right'
											}
										],

										[{ text: 'DPH (1. snížená)', style: 'tableHeader', alignment: 'left'}, { text: appendCurrencyBehindAmount(totalTax.toFixed(2).replace('.', ',')),
											style: 'tableHeader',alignment: 'right' }],

										[{ text: 'Celková částka (vč. DPH)', style: 'tableHeader', alignment: 'left'}, { text:
											appendCurrencyBehindAmount(calculateTotalPriceWithoutDiscount(totalPrice, totalSlevy).replace('.', ',')), style: 'tableHeader',alignment: 'right' }],

										[{ text: (totalSlevy < 0 ? 'Sleva' : ''), style: 'tableHeader', alignment: 'left'},
										{ text: (totalSlevy < 0 ? appendCurrencyBehindAmount(totalSlevy) : ''), style: 'tableHeader',alignment: 'right' }],

										[ { text: 'Zbývá uhradit', style: 'tableHeader', style: 'tableHeaderBig', alignment: 'left'}, { text: appendCurrencyBehindAmount(totalPriceStr), style: 'tableHeaderBig',alignment: 'right' }],
								]
						},
						layout: 'noBorders'
					}
				]
			},
			// {
			// 	image: signature,
			// 	width: 125,
			// 	margin: [134, 0, 0, 0]
			// },
			{
				text: '\b                                                                                                                    .........................................................................................................', 
				style: 'comment'
			},
			{
				text: '\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b                                                                                                               Razítko a podpis dodavatele', 
				style: 'comment'
			},
			{
				text: '\n\n\n\n\n\nCảm ơn bạn đã tin tưởng vào Medpharma VN và chúng tôi hy vọng gặp lại bạn sớm.',
				style: 'comment'
			// },
			// {
			// 	image: heart,
			// 	margin: [140, -13, 0, 0],
			// 	width: 16,
			// 	height: 16
			}
		],
		styles: {
			header: {
				fontSize: 14,
				bold: true,
				margin: [ 0, 10, 45, 20 ]
			},
			comment: {
			    fontSize: 9,
			    italics: true
			},
			smallHeader: {
			    fontSize: 12,
			    bold: true
			},
			dodavatelOdberatel: {
			    fontSize: 11,
			    bold: false
			},
			konecnyPrijemce: {
			    fontSize: 12,
			    bold: false
			},
			bankovniInfo: {
			    fontSize: 10,
			    bold: false
			},
			datumSplatnosti: {
			    fontSize: 10,
			    bold: true
			},
			tableHeader: {
			    fontSize: 10,
			    bold: true
			},
			tableContent: {
			    fontSize: 10,
			    bold: false,
			    alignment: 'center'
			},
			tableContent: {
				fontSize: 10,
				bold: false,
				alignment: 'center'
			},
			tableContentTotal: {
				fontSize: 10,
				bold: false,
				alignment: 'right'
			},
			tableProductName: {
			    fontSize: 10,
			    bold: false,
			    alignment: 'left'
			},
			tableHeaderBig: {
			    fontSize: 12,
			    bold: true
			}
		}
	}
    var pdfDefinition = dd;

	var pdfDoc = printer.createPdfKitDocument(pdfDefinition);
	var filenameWithoutExtension = invoiceNumber;
	if (index) {
		filenameWithoutExtension += '-' + index;
	}
	var filename = filenameWithoutExtension + '.pdf';
	pdfDoc.end();

	deferred.resolve(pdfDefinition);

	// dbx.filesUpload({path: '/medpharma/faktury/' + filename, contents: pdfDoc, mode: 'overwrite'})
	// .then(function(response) {
	// 	console.log('upload to dropbox successful');
	// 	deferred.resolve(pdfDefinition);
	// })
	// .catch(function(error) {
	// 	console.log('error while uploading document to dropbox: ' + error);
	// 	deferred.reject(error);
	// });

    return deferred.promise;
}

function calculateLowerTax(amount) {
	return (amount * 0.1304).toFixed(2);
}

function calculateNormalTax(amount) {
	return (amount * 0.1736).toFixed(2);
}

function calculatePriceWithoutDPH(totalTax, postovneCena, totalSlevy, totalPrice) {
	return totalPrice - totalTax - postovneCena - totalSlevy;
}

function calculatePriceWithShippingWithoutDPH(totalTax, discounts, totalPrice) {
	return (totalPrice - totalTax - discounts).toFixed(2);
}

function calculateTotalPriceWithoutDiscount(totalPrice, totalSlevy) {
	return (totalPrice - totalSlevy).toFixed(2);
}

function appendDecimalPointAndZerosBehindAmount(amount) {
	return amount + ',00';
}

function appendCurrencyBehindAmount(amount) {
	return amount + ' Kč';
}

exports.Handler = Handler;