module.exports = function(app) {

    var Handler = require('../handlers/bank.js').Handler;
    var handler = new Handler(app);

    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var tools = require('../tools/tools.js');

    app.get('/rest/bank/transactions', function(req, res) {
        var token = tools.extractToken(req);
        var from = req.query.from;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllTransactions(from);
            })
            .then(function(transactions) {
                res.json(transactions);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.post('/rest/bank/domestic_transaction', function(req, res) {
        var token = tools.extractToken(req);
        var transaction = req.body;

        var amount = transaction.amount;
        var accountTo = transaction.accountTo;
        var bankCode = transaction.bankCode;
        var comment = transaction.comment
        var vs = transaction.vs;

        if (!amount) {
            res.status(400).send({ message: 'You must provide parameter amount!' });
        }

        if (!accountTo) {
            res.status(400).send({ message: 'You must provide parameter accountTo!' });
        }

        if (!bankCode) {
            res.status(400).send({ message: 'You must provide parameter bankCode!' });
        }

        if (!comment) {
            res.status(400).send({ message: 'You must provide parameter comment!' });
        }

        if (!vs) {
            res.status(400).send({ message: 'You must provide parameter vs!' });
        }

        handler.createDomesticTransaction(amount, accountTo, bankCode, comment, vs)
        .then(function(response) {
            res.json(response);
            res.end();
        })
        .fail(function(err) {
            tools.replyError(err, res);
        })
        .done();
    });
}