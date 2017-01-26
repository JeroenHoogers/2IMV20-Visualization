var Summary = function (width, height, indicators) 
{
	this.width = width;
	this.height = height;
	this.indicators = indicators;
	this.Initialize();

};

Summary.prototype = Object.create(Object.prototype);

//Private methods
Summary.prototype.Initialize = function () 
{
	this.svg = d3.select("#summary").append("svg")
		.attr("width", this.width)
		.attr("height", this.height);

	this.z = d3.scale.category10();

	// Create legend
	this.legend = this.svg.append("g")
		.selectAll("g")
		.data(this.indicators)		// TODO: dynamic range
		.enter()
			.append("g")
		  	.attr("class","legend")
		  	.attr("transform", function(d,i) {
		  		var x = (i % 3) * 80;
		  		var y = Math.floor(i / 3) * 40 + 5;
		  		return "translate(" + x + "," + y + ")";}
	  		);

	this.legend.append("rect")
		.attr("width", 15)
		.attr("height", 15)
		.style("fill", this.z)
		.style("stroke", this.z);

	this.legend.append("text")
		.attr("x", 20)
		.attr("y", 10)
		.text(function(d){ return d});
};
