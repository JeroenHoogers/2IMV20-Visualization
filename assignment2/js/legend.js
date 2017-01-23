var Legend = function (width, height) 
{
	this.width = width;
	this.height = height;
	this.radius = Math.min(width, height) / 2;
	this.Initialize();
};

Legend.prototype = Object.create(Object.prototype);

//Private methods
Legend.prototype.Initialize = function () 
{
	//TODO : Create Legend svg
	//PopulatePieChart();
	this.Populate("ab");
};

Legend.prototype.Populate = function(datates) 
{
	var indicators = ["Total_Land_Sqkm", "Forest_Land_Sqkm", "Agriculture_Land_Sqkm", "Urban_Land_Sqkm", "Rural_Land_Sqkm"];

	//this

	// var world = datates.get("World");

	// var that = this;

 // 	this.graph.append("g")
	// 	    .selectAll("g")
	// 	    .data(d3.stack().keys(keys)())
	// 	    .enter().append("g")
	// 	      .attr("fill", function(d) { return that.z(d.key); })
	// 	    .selectAll("rect")
	// 	    .data(function(d) { return d[""]; })
	// 	    .enter().append("rect")
	// 	      .attr("x", function(d) { return that.x(d.data.State); })
	// 	      .attr("y", function(d) { return that.y(d[1]); })
	// 	      .attr("height", function(d) { return y(d[0]) - y(d[1]); })
	// 	      .attr("width", x.bandwidth());

	// datates.get("World").forEach(function(d)
	// {

	// });
	//Pie Chart : 
	var color = d3.scale.category20();

	var pie = d3.layout.pie()
	    .value(function(d) { return d['1990']; })
	    .sort(null);

	var arc = d3.svg.arc()
	    .innerRadius(this.radius - 100)
	    .outerRadius(this.radius - 20);

	var svg = d3.select("#summary").append("svg")
	    .attr("width", this.width)
	    .attr("height", this.height)
	  .append("g")
	    .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")");

	d3.csv("data/landdist/API_AG.LND.TOTL.K2_DS2_en_csv_v2.csv", type, function(error, data) {
	  if (error) throw error;

	  var path = svg.datum(data).selectAll("path")
	      .data(pie)
	    .enter().append("path")
	      .attr("fill", function(d, i) { return color(i); })
	      .attr("d", arc)
	      .each(function(d) { this._current = d; }); // store the initial angles

	  d3.selectAll("input")
	      .on("change", change);

	  var timeout = setTimeout(function() {
	    d3.select("input[value=\"2010\"]").property("checked", true).each(change);
	  }, 2000);

	  function change() {
	    var value = this.value;
	    clearTimeout(timeout);
	    pie.value(function(d) { return d[value]; }); // change the value function
	    path = path.data(pie); // compute the new angles
	    path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
	  }
	});

	function type(d) {
	  d['1990'] = +d['1990'] || 0;
	  d['2010'] = +d['2010'] || 0;
	  return d;
	}

	// Store the displayed angles in _current.
	// Then, interpolate from _current to the new angles.
	// During the transition, _current is updated in-place by d3.interpolate.
	function arcTween(a) {
	  var i = d3.interpolate(this._current, a);
	  this._current = i(0);
	  return function(t) {
	    return arc(i(t));
	  };
	}

};

