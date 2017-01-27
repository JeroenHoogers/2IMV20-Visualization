var Summary = function (width, height) 
{
	this.width = width;
	this.height = height;
	this.Initialize();

};

Summary.prototype = Object.create(Object.prototype);

//Private methods
Summary.prototype.Initialize = function () 
{
	this.svg = d3.select("#summary").append("svg")
		.attr("width", this.width)
		.attr("height", this.height);

	this.z = d3.scale.category10()
		.domain([0,1,2,3,4,5,6,7,8,9]);

	var that = this;
	console.log(indicatorMetaData);
	this.legend = this.svg.append("g");
	// Create legend
	this.legend.selectAll("g").remove();
	var legendIndicators = this.legend.selectAll("g")
		.data(filter.getAllIndicators())		// TODO: dynamic range
		.enter()
			.append("g")
		  	.attr("class","legend")
		  	.attr("transform", function(d,i) {
		  		var x = (i % 3) * 100;
		  		var y = Math.floor(i / 3) * 20 + 5;
		  		return "translate(" + x + "," + y + ")";}
	  		);

	legendIndicators.append("rect")
		.attr("width", 15)
		.attr("height", 15)
		.style("fill",  function(d) { return that.z(d.data.color);});
		// .style("stroke", function(d) { return that.z(indicatorMetaData.get(d).color);})
	legendIndicators.append("text")
		.attr("x", 20)
		.attr("y", 10)
		.text(function(d){ return d.data.name});	
};
