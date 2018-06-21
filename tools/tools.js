module.exports = {
	replyError: function(error, res) {
		var errCode = 400;
		if(error.type == 'token_validation') {
			errCode = 403;
		}
		res.status(errCode).send({message: error});
	},
	extractToken: function(req) {
		var token = req.body.token || req.query.token || req.headers['x-access-token'];
		return token;
	}
}