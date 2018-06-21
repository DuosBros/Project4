// playground requires you to assign document definition to a variable called dd

var dd = {
    footer: {
    columns: [
      { text: 'Společnost TranMedGroup s.r.o. potvrzuje, že na zboží, které dovává svým odběratelům, bylo vydáno prohlášení o\n'
			    + 'shodě v souladu se zákonem č. 110/1997 Sb. § odst. 1.2, v rozsahu stanoveném vyhláškou.', alignment: 'center', style: 'comment' }
    ]
  },
	content: [
		{ 
			text: 'FAKTURA - daňový doklad č. ' + a + vs, 
			style: 'header', 
			alignment: 'center' 
		},
		{
				table: {
				        widths: [235, 235],
						body: [
								[
								    { text: [
														{ text: '\n\t\t\t\t\t\tDodavatel:\n\n',  style: 'smallHeader'},
														{ text: '\t\t\t\t\t\tTranMedGroup s.r.o\n\b\b\b\b\bZámostní  1155/27\n\b\b\b\b\b71000 Slezská Ostrava\n\b\b\b\b\bIČ: 05495172 DIČ: CZ05495172\n\b\b\b\b\bTel.: +420773115262', style: 'dodavatelOdberatel' } ]
								    },
								    { text: [
														{ text: '\n\t\t\t\t\t\tOdběratel:\n\n',  style: 'smallHeader'},
														{ text: '\t\t\t\t\t\tMartin Lukas\n\b\b\b\b\bZámostní  1155/27\n\b\b\b\b\b71000 Slezská Ostrava\n\b\b\b\b\bIČ:                      DIČ:\n\n ', style: 'dodavatelOdberatel' } ]
								    },
								],
								['',{ text: [
														{ text: '\n\t\t\t\t\t\tKonečný příjemce:\n\n',  style: 'konecnyPrijemce'},
														{ text: '\b\b\b\b\bMartin Lukas\n\b\b\b\b\bZámostní  1155/27\n\b\b\b\b\b71000 Slezská Ostrava\n\n', style: 'dodavatelOdberatel' } ]
								    },
								],
								[
								    {   
								        style: 'bankovniInfo',
								        colSpan: 2,
								        text: [
								        '\t\t\t\t\t\tÚčet:        FIO BANKA      2401089228 / 2010                    Faktura číslo:\n\b\b\b\b\bSWIFT:    FIOBCZPPXXX                                                        Objednávka:\n' + 
								        '\b\b\b\b\bIBAN:       CZ4720100000002401089228                           Konstantní symbol:\n' + 
								        '\b\b\b\b\bZpůsob platby:                     Bankovním převodem            Variabilní symbol:\n' + 
								        '\b\b\b\b\bDatum vystavení:                 21.11.2016                               Specifický symbol:\n' +
								        '\b\b\b\b\bDatum usk. zdaň. plnění:    21.11.2016                               Poznámka:\n' +
								        '\b\b\b\b\bDatum splatnosti:                 ',
								        { text: '05.12.2016', style: 'datumSplatnosti' },
								        ]
								    }
								]
						]
				},
		},
		{
			table: {
			        widths: [145, 45, 13, 45, 30, 40, 76],
					headerRows: 1,
					style: 'tableContent',
					body: [
							[{ text: 'Označení dodávky', style: 'tableHeader' }, { text: 'Počet MJ', style: 'tableHeader'}, { text: 'MJ', style: 'tableHeader' }, { text: 'Cena/MJ', style: 'tableHeader' }, { text: 'Sazba', style: 'tableHeader' }, { text: 'Základ', style: 'tableHeader' }, { text: 'Celkem s DPH', style: 'tableHeader' }],
							[ {text: 'Žraločí chrupavka', style:'tableProductName'}, {text: '10', style:'tableContent'}, {text: 'ks', style:'tableContent'}, {text: '155,60', style:'tableContent'}, {text: '15%', style:'tableContent'}, {text: '1556,50', style:'tableContent'}, {text:'1790,00 kč', style:'tableContent'} ],
					]
			},
			layout: 'lightHorizontalLines'
		},
		{
						text: '___________________________________________________________________________________________\n\n',
		},
		{
		    columns: [
				{
				style: 'tableExample',
				table: {
						headerRows: 1,
						body: [
								[{ text: 'Sazba DPH', style: 'tableHeader', alignment:'right' }, { text: 'Základ', style: 'tableHeader', alignment:'right' }, { text: 'Výše DPH', style: 'tableHeader', alignment:'right'  }, { text: 'Celkem', style: 'tableHeader', alignment:'right'  }],
								[ {text: 'nulová 0%\nsnížená 15%\nzákladní 21%', alignment:'right', fontSize: 9}, {text:'0,00\n1556,00\n0,00', alignment:'right', fontSize: 9}, {text:'0,00\n233,50\n0,00', alignment:'right', fontSize: 9},{text:'0,00\n1790,00\n0,00', alignment:'right', fontSize: 9}],
								[ {text:'CELKEM', style: 'tableHeader', alignment:'right' }, {text:'1556,50', style: 'tableHeader', alignment:'right' }, {text:'233,50', style: 'tableHeader', alignment:'right' },{text:'1790,00', style: 'tableHeader', alignment:'right' } ],
						]
				},
				layout: {
												hLineWidth: function(i, node) {
														return (i === 0 || i === node.table.body.length) ? 1 : 1;
												},
												vLineWidth: function(i, node) {
														return (i === 0 || i === node.table.widths.length) ? 1 : 0;
												},
												hLineColor: function(i, node) {
														return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
												},
												vLineColor: function(i, node) {
														return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
												},
												// paddingLeft: function(i, node) { return 4; },
												// paddingRight: function(i, node) { return 4; },
												// paddingTop: function(i, node) { return 2; },
												// paddingBottom: function(i, node) { return 2; }
				}
		    },
				{
						style: 'tableExample',
						table: {
								headerRows: 1,
								widths: [100, 120],
								body: [
										[{ text: 'Sleva v %', style: 'tableHeader', alignment: 'left'}, { text: '0,00 Kč', style: 'tableHeader', alignment: 'right' }],
										[{ text: 'Celková částka', style: 'tableHeader', alignment: 'left'}, { text: '1790,00 Kč', style: 'tableHeader',alignment: 'right' }],
										[ { text: 'Uhrazano zálohou', style: 'tableHeader', alignment: 'left'}, { text: '0,00 Kč', style: 'tableHeader',alignment: 'right' }],
										[ { text: 'Zbývá uhradit', style: 'tableHeader', style: 'tableHeaderBig', alignment: 'left'}, { text: '1790,00 Kč', style: 'tableHeaderBig',alignment: 'right' }],
								]
						},
						layout: 'noBorders'
				},
			]
		},
		
		{ 
			text: '\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b           Rozpis\b DPH uveden v měně Kč', 
			style: 'comment'
		},
		{ 
			text: '\n\n\n\n\n\n\n\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b.........................................................................................................', 
			style: 'comment'
		},
		{ 
			text: '\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b\b                                                                                                           Razítko a podpis dodavatele', 
			style: 'comment'
		},
	],
	styles: {
		header: {
			fontSize: 18,
			bold: true,
			alignment: 'justify',
			margin: [ 0, 0, 0, 20 ] 
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