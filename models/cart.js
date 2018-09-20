module.exports = function Cart(oldCart){

  this.items = oldCart.items || {};
  this.totalQty = oldCart.totalQty || 0;
  this.totalPrice = oldCart.totalPrice || 0;

  this.add = function(item, id){
    var storedItem = this.items[id];
    if (!storedItem) {
			storedItem = this.items[id] = {item: item, qty:0,price:0};
		}
		storedItem.qty++;
		storedItem.price = ((storedItem.item.price*100) * storedItem.qty)/100;
		this.totalQty++;
		this.totalPrice = (storedItem.item.price*100+this.totalPrice*100)/100;

  };

  this.reduceByOne = function(id){

		if (this.items[id].qty <= 0) {
			delete this.items[id];
		}
		if (this.items[id].qty > 0)
		{
		this.items[id].qty--;
		this.items[id].price=((this.items[id].item.price*100) * this.items[id].qty)/100;
		this.totalQty--;
		this.totalPrice =(this.totalPrice*10 - this.items[id].item.price*10)/10;
			if (this.items[id].qty <= 0) {
				delete this.items[id];
			}
		}
	};

	this.removeItem = function(id){

		if(this.items[id].qty > 0){
		 this.totalQty -= this.items[id].qty;
		 this.totalPrice = (this.totalPrice*10 - this.items[id].price*10)/10;
		 delete this.items[id];
	 }
   else
	 {
		 
     return error;
	 }
	};

  this.generateArray = function(){
    var arr = [];
    for(var id in this.items){
      arr.push(this.items[id]);
    }
    return arr;
  };

};
