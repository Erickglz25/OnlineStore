var express = require('express');
var router = express.Router();
var csrf = require('csurf');

//Controllers
var mainctrl = require('../controllers/maincontrollers.js');

var csrfProtection = csrf();
router.use(csrfProtection);

/* GET home page. */
router.get('/',mainctrl._render_root);

router.get('/add-to-cart/:id',mainctrl._addproduct);

router.get('/reduce/:id',mainctrl._reduceproduct);

router.get('/remove/:id',mainctrl._deleteproduct);

router.get('/store', mainctrl._render_store);

router.get('/shopping-cart',mainctrl._render_scart);


router.get('/checkout', mainctrl.isLoggedIn, mainctrl._render_checkout);

router.post('/checkout', mainctrl.isLoggedIn,mainctrl._checkoutprocess);

/*

router.get('/new',function(req,res){
		res.render('shop/new',{
			title: 'New Product',
      csrfToken: req.csrfToken()
		})
	});

router.post('/new', function(req, res) {

		var product = new Product({
			name: req.body.name,
			imagePath: req.body.imagePath,
			dimensions: req.body.dimensions,
			tag: req.body.tag,
			price: req.body.price,
			stoke: req.body.stoke,
			code: req.body.code,
			author: req.body.author,
			weight: req.body.weight,
			year: req.body.year,
			lifestyle: req.body.lifestyle,
			rel1: req.body.rel1,
			rel2: req.body.rel2,
			rel3: req.body.rel3,
			description: req.body.description
		});

		product.save(function(error, product) {
			if(error) {
				res.send(500, error.message);
			}
    });



		var cadena = req.body.lifestyle;// un espacio en blanco
	    arregloDeSubCadenas = cadena.split(" ");
		console.log(arregloDeSubCadenas);

		arregloDeSubCadenas.forEach(function(elemento) {
		if (elemento === 'comedor' || elemento === 'salas' || elemento === 'oficina' || elemento === 'exteriores')
		{	var lifestyle = new Lifestyle({
				  	name: elemento,
				  	Product: product
			  });

		    lifestyle.save(function(error, product) {
				if(error) {
					res.send(500, error.message);
				}

			});
		}

		});

		res.redirect('/');


	});
*/
module.exports = router;
