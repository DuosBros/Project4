module.exports = function (app) {

    var tools = require('../tools/tools.js');
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);
    var Excel = require('exceljs');

    app.post('/rest/export/:fileName/:sheetName', function (req, res) {
        var token = tools.extractToken(req);

        var data = req.body;
        var fileName = req.params.fileName;
        var sheetName = req.params.sheetName;

        // if the params are not provided -> fallback to defaults
        if (!fileName) {
            fileName = new Date().toUTCString()
        }

        if (!sheetName) {
            sheetName = "Report"
        }

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    var workbook = new Excel.Workbook();

                    var worksheet = workbook.addWorksheet(sheetName);

                    if (!data) res.status(400).send({ message: 'Invalid data!' });
                    if (!data[0]) res.status(400).send({ message: 'Invalid data!' });
                    if (data.length >= 1048576) res.status(400).send({ message: 'Too many data (1048576)!' });

                    var keys = Object.keys(data[0])
                    if (keys.length >= 16384) res.status(400).send({ message: 'Too many properties (16384)!' });

                    worksheet.columns = keys.map(x => {
                        return {
                            header: x,
                            key: x
                        }
                    });

                    worksheet.addRows(data)
                    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    res.setHeader('Content-Disposition', 'attachment; filename=' + fileName + '.xlsx');
                    workbook.xlsx.write(res)
                        .then(function () {
                            res.end();
                        })
                        .fail(function (err) {
                            tools.replyError(err, res);
                        })
                        .done();
                })
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });
}