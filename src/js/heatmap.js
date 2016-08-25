const HEATMAP_SIZE = {width: 1200, height: 600};
const MULTIPLES_SIZE = {width: 260, height: 125};
const LEGEND_SIZE = {width: 600, height: 150};

const HEATMAP_INSET = {left: 80, right: 2, top: 30, bottom: 10};

const EMPLOYEE_COUNT = 114;

var sortedMap = false;

var currentDay = 0;

var employeeMap = new Map(); // map that translates a given proxid to an index (there are 114 ids)

var heatmapsvg = d3.select("#chart").append("svg")
	.attr("id", "heatmapsvg")
	.attr("width", HEATMAP_SIZE.width)
	.attr("height", HEATMAP_SIZE.height)
	.append("g")
	.attr("transform", "translate(" + HEATMAP_INSET.left + "," + HEATMAP_INSET.top + ")");


var heatmapsvgobj = document.getElementById("heatmapsvg");
var heatmaprect = heatmapsvgobj.getBoundingClientRect();

var heatmapY = d3.time.scale()
	.domain([0, 86400]) // seconds in a day
	.range([0, HEATMAP_SIZE.height - HEATMAP_INSET.top - HEATMAP_INSET.bottom]);

var heatmapYAxis = d3.svg.axis()
	.scale(heatmapY)
	.orient("left")
	.tickFormat("");

var blockWidth = (HEATMAP_SIZE.width - HEATMAP_INSET.left - HEATMAP_INSET.right) / EMPLOYEE_COUNT;

var timeLabels = heatmapsvg.append("g")
	.call(heatmapYAxis);

var colors = ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"];
var dimcolors = ["#0e523d", "#8c3d01", "#434066", "#9c1c5d", "#375910", "#997201", "#593f10", "#1a1a1a"]

var times = ["0:00:00", "1:00:00", "2:00:00", "3:00:00", "4:00:00", "5:00:00", "6:00:00", "7:00:00", "8:00:00", "9:00:00", "10:00:00", "11:00:00", "12:00:00", "13:00:00", "14:00:00", "15:00:00", "16:00:00", "17:00:00", "18:00:00", "19:00:00", "20:00:00", "21:00:00", "22:00:00", "23:00:00", "24:00:00"];

var datasets = ["../../data/json/proxOut-Durations-5-31.json", "../../data/json/proxOut-Durations-6-1.json", 
"../../data/json/proxOut-Durations-6-2.json", "../../data/json/proxOut-Durations-6-3.json", 
"../../data/json/proxOut-Durations-6-4.json", "../../data/json/proxOut-Durations-6-5.json", 
"../../data/json/proxOut-Durations-6-6.json", "../../data/json/proxOut-Durations-6-7.json", 
"../../data/json/proxOut-Durations-6-8.json", "../../data/json/proxOut-Durations-6-9.json", 
"../../data/json/proxOut-Durations-6-10.json", "../../data/json/proxOut-Durations-6-11.json", 
"../../data/json/proxOut-Durations-6-12.json", "../../data/json/proxOut-Durations-6-13.json"];

var heatmapShots = ["../../img/heatmapShots/may31.png", "../../img/heatmapShots/june1.png", "../../img/heatmapShots/june2.png", "../../img/heatmapShots/june3.png",
, "../../img/heatmapShots/june5.png", "../../img/heatmapShots/june6.png", "../../img/heatmapShots/june7.png", "../../img/heatmapShots/june8.png",
"../../img/heatmapShots/june9.png", "../../img/heatmapShots/june10.png", "../../img/heatmapShots/june11.png", "../../img/heatmapShots/june12.png",
"../../img/heatmapShots/june13.png"];

var dateDisplay = ["May 31", "June 1", "June 2", "June 3", "June 5", "June 6", "June 7", "June 8", "June 9", "June 10", "June 11", "June 12", "June 13"];

var dates = ["2016-05-31", "2016-06-01", "2016-06-02", "2016-06-03", "2016-06-04", "2016-06-05", "2016-06-06", "2016-06-07", "2016-06-08", "2016-06-09", "2016-06-10", "2016-06-11", "2016-06-12", "2016-06-13"]

var groups = ["../../data/json/clustering/Groups-Day0.json"];

var legendsvg = d3.select("#legend").append("svg")
	.attr("id", "legendsvg")
	.attr("height", LEGEND_SIZE.height)
	.attr("width", LEGEND_SIZE.width)
	.append("g")
	.attr("transform", "translate(" + HEATMAP_INSET.left + ",0)");

var tooltip = d3.select("#chart")
	.append("div")
	.attr("class", "hidden tooltip");

var timeLabels = heatmapsvg.selectAll(".timeLabel")
	.data(times)
	.enter().append("text")
	.text(function (d) { return d; })
	.attr("x", -8)
	.attr("y", function (d, i) { return (4 + heatmapY.range()[1]/24 * i); }) // height of heatmap / 24 * index
	.style("font-size", "12px")
	.style("text-anchor", "end")
	.attr("class", ".timeLabel");

var smallMultiples;

heatmapsvg.selectAll(".timeline")
	.data(times)
	.enter()
	.append("line")
	.style("stroke", "#E0E0E0")
	.style("stroke-width", "1px")
	.attr("x1", 0)
	.attr("x2", HEATMAP_SIZE.width - HEATMAP_INSET.left)
	.attr("y1", function (d, i) { return (heatmapY.range()[1]/24 * i); })
	.attr("y2", function (d, i) { return (heatmapY.range()[1]/24 * i); });

// define patterns
heatmapsvg.append('defs')
	.append('pattern')
	.attr("id", "diagonalHatch")
	.attr("patternUnits", "userSpaceOnUse")
	.attr("width", 4)
	.attr("height", 4)
	.append("path")
	.attr("d", 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
	.attr("stroke", "#000000")
	.attr("stroke-width", 1);

heatmapsvg.append('defs')
	.append('pattern')
	.attr("id", "dots")
	.attr("patternUnits", "userSpaceOnUse")
	.attr("width", 4)
	.attr("height", 4)
	.append("path")
	.attr("d", 'M1,1 l1,1')
	.attr("stroke", "#000000")
	.attr("stroke-width", 1);

// EXECUTION STARTS HERE

start();

// EXECUTION ENDS HERE

function start()
{	
	loadNames(function(names)
	{
		heatmapChart(datasets[0])

		// showOrderedData(datasets[0]);
	});	

	drawLegend();
	startMultiples();
}

function startMultiples()
{
	smallMultiples = d3.select("#dataset-picker")
		.selectAll(".smallMultiples")
		.data(datasets)
		.enter()
		.append("svg")
		.attr("class", "smallMultiples")
		.attr("width", MULTIPLES_SIZE.width)
		.attr("height", MULTIPLES_SIZE.height)
		.style("background-color", function(d)
		{
			return d == (datasets[currentDay]) ? "#AAAAAA" : null;
		})
		.on("click", function(d, i)
	    {		
			selectDate(i);
			drawHeatmap();
		});

	smallMultiples
		.append("image")
		.attr("xlink:href", function(d, i)
		{
			return heatmapShots[i];
		})
		.attr("width", MULTIPLES_SIZE.width)
		.attr("height", MULTIPLES_SIZE.height)	
		.style("pointer-events", "none");

	d3.selectAll(".smallMultiples")
		.append("rect")
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", MULTIPLES_SIZE.width)
		.attr("height", MULTIPLES_SIZE.height)
		.style("fill", "none")
		.style("stroke", "#666")
		.style("stroke-width", "1.5px");	    
}

function loadNames(callback)
{
	d3.json("../../data/json/names.json", function(error, names)
	{
		if(error) throw(error);
	
		for(var i = 0; i < names.length; i++)
		{
			employeeMap.set(names[i], i);
		}

		if(typeof callback === "function")
			callback(names);
	});
}

function drawLegend()
{
	//Width and height
    var w = 1200;
    var barPadding = 1;
    
    var dataset = [ "F1-Z1", "F1-Z2", "F1-Z3", "F1-Z4", "F1-Z5", "F1-Z6", "F1-Z7", "F1-Z8", 
    "F2-Z1", "F2-Z2", "F2-Z3", "F2-Z4", "F2-Z5", "F2-Z6", "F2-Z7", "F2-Z8", "F3-Z1", "F3-Z2", "F3-Z3", "F3-Z4", "F3-Z5", "F3-Z6", "F3-Z7", "F3-Z8"];
     
    /* append the rectangles for the legend*/  
    var x = 0;
    legendsvg.selectAll("circle")
		.data(dataset)
		.enter()
		.append("rect")
		.attr("x", function(d, i) 
		{
			return ((i%8 + 1) * (w / dataset.length));            
		})
		.attr("y", function(d, i)
        {
        	if(d.substr(0, 2) == "F2")
        	{
            	return 40;
          	}
          	
          	if (d.substr(0, 2) == "F3")
          	{
            	return 70;
          	}

            return 100;
        })
        .attr("class", ".legend")
        .attr("width", w / dataset.length - barPadding)
        .attr("height", 15)
        .attr("fill", function(d, i)
        {	
        	return colors[i%8];
        });

    /* append the overlay of pattern for rects*/   
    legendsvg.selectAll(".legend")
      	.data(dataset)
      	.enter()
      	.append("rect")
      	.attr("x", function(d, i) 
      	{
            return ((i%8 + 1) * (w / dataset.length));	      
        })
        .attr("y", function(d, i)
        {
        	if(d.substr(0, 2) == "F2")
        	{
        		return 70;
        	}
        	
        	if (d.substr(0, 2) == "F3")
        	{
         		return 100;
        	}

        	return 40;
        })
        .attr("width", w / dataset.length - barPadding)
        .attr("height", 15)
        .style("fill", function(d, i)
        {
        	if (d.substr(0, 2) == "F2")
        	{
             	return "url(#dots)";
         	}

        	if (d.substr(0, 2) == "F3")
        	{
        		return "url(#diagonalHatch)";
         	}

        	return colors[i];
      	});

    var floors = ["Floor 1", "Floor 2", "Floor 3"];
    var zones = ["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8"];

	/*append text to the rectangles Floors*/       
    legendsvg.selectAll("circle")
       	.data(floors)
       	.enter()
       	.append("text")
       		.text(function(d)
       		{
       			return d;
       		})
       		.attr("x", 0)
       		.attr("y", function(d, i)
       		{
       			if(i == 0)
       			{
       			  return 50;
       			}
       			
       			if( i == 1)
       			{
       			  return 80;
       			}

       			return 110;
       		})
       	.attr("font-family", "sans-serif")
       	.attr("font-size", "11px")
       	.attr("fill", "black");

    /*append text to the rectangles Zones*/       
    legendsvg.selectAll("circle")
    	.data(zones)
    	.enter()
    	.append("text")
    		.text(function(d)
    		{
    			return d;
    		})
    		.attr("x", function(d,i)
    		{
    			return ((i+1) * (barPadding + w / dataset.length));
    		})
    		.attr("y", 30)
    		.attr("font-family", "sans-serif")
    		.attr("font-size", "11px")
    		.attr("fill", "black");
}

function getColor(zone)
{
	return colors[+zone - 1];
}//end of function getColor()

function heatmapChart(jsonFile) 
{
	var heatmaprect = heatmapsvgobj.getBoundingClientRect();

	d3.json(jsonFile, function(error, data) 
	{

		if(error) throw(error);	

		// show date being displayed
		//document.getElementById("HeatmapDate").innerHTML = data[0][0].date;

		// show employee id labels
		d3.selectAll(".employeeLabel")
			.classed("hidden", false);

		// draw time blocks on heatmap
		var timeBlocks = new Array(data.length);
		var blockOverlays = new Array(data.length);

		for(var i = 0; i < data.length; i++)
		{
			// draw timeblocks
			timeBlocks[i] = heatmapsvg.selectAll(".hour")
				.data(data[i])
				.enter()
				.append("rect")
					.attr("x", function(d)
					{
						return (employeeMap.get(d.proxID.trim()) * blockWidth);
					})
					.attr("y", function(d)
					{
						return heatmapY(+d.startTimeSeconds); //((d.startTimeSeconds / 3600) * blockWidth);
					})
					.attr("width", blockWidth)//blockWidth/2)
					.attr("height", function(d)
					{
						return heatmapY(+d.durationInSeconds); //((d.durationInSeconds / 3600) * blockWidth);
					})
					.attr("class", ".hour")
					.style("fill", function(d)
					{ 
						return getColor(d.zone); 
					})
					.on("mouseenter", function(d)
					{
						var mouse = [+d3.select(this).attr("x"), +d3.select(this).attr("y")];
						tooltip.attr("style", "left:" + (heatmaprect.left + mouse[0] + HEATMAP_INSET.left + blockWidth/2) + "px; top:" + (heatmaprect.top + mouse[1] + HEATMAP_INSET.top + 5) + "px");
						tooltip.classed("hidden", false)
							.html("Name: " + d.proxID + "<br>Date: " + d.date + "<br>Floor: " + d.floor + "<br>Zone: " + d.zone + "<br>Start: " + d.timeEntered + "<br>Duration: " + d.durationInLocation);	
						d3.select(this).style("fill", dimcolors[+d.zone - 1]);
					})
					.on("mouseout", function(d)
					{
						d3.select(this).style("fill", getColor(d.zone));
	
						tooltip.classed("hidden", true);
					})
					.on("click", onBlockClick);

			// draw pattern overlays on appropriate timeblocks
			blockOverlays[i] = heatmapsvg.selectAll(".hour")
				.data(data[i])
				.enter()
				.append("rect")
					.attr("x", function(d)
					{
						return (employeeMap.get(d.proxID.trim()) * blockWidth);
					})
					.attr("y", function(d)
					{
						return heatmapY(+d.startTimeSeconds); //((d.startTimeSeconds / 3600) * blockWidth);
					})
					.attr("width", blockWidth)
					.attr("height", function(d)
					{
						return heatmapY(+d.durationInSeconds); //((d.durationInSeconds / 3600) * blockWidth);
					})
					.style("fill", function(d)
					{
						if(d.floor == 1)
						{
							return "none"; //getColor(d.zone);
						}
						else if(d.floor == 2)
						{
							return "url(#dots)";
						}
						else if(d.floor == 3)
						{
							return "url(#diagonalHatch)";
						}
					})
					.style("pointer-events", "none");
		}		
	});	
}

function startSingle(id)
{	
	plotSingleEmployee(id, 0, []);	
	//drawLegend();
}

function plotSingleEmployee(id, day, employeeData)
{
	if(day >= datasets.length)
	{
		plotData(employeeData, true);
		return;
	}

	d3.json(datasets[day], function(error, data)
	{
		if(error)
			throw error;

		for(var employee = 0; employee < data.length; employee++)
		{
			if(data[employee][0].proxID == id)
			{
				employeeData[day] = data[employee];
				break;
			}
			else
			{
				if(employee == data.length - 1)
				{
					employeeData[day] = [];
				}
			}
		}

		plotSingleEmployee(id, day + 1, employeeData);
	});
}

function showOrderedData(filename)
{
	console.log("ordredData");

	orderedNames = [];
	orderedData = new Array(employeeCount);

	d3.json(groups[0], function(error, data)
	{
		if(error)
			throw error;

		d3.json("../../data/json/clustering/EmployeeList.json", function(error2, data2)
		{
			if(error2)
				throw(error2);

			for(var i = 0; i < data.length; i++)
			{
				for(var j = 0; j < data[i].length; j++)
				{
					orderedNames.push(data2[data[i][j]]);
				}
			}

			d3.json(filename, function(error, data)
			{
				if(error)
					throw(error);

				for(var j = 0; j < data.length; j++)
				{
					var ind = orderedNames.indexOf(data[j][0].proxID.trim());

					if(ind == -1)
					{
						continue;
					}

					orderedData[ind] = data[j];
				}

				plotData(orderedData, false);
			});
		});
	});
}

function plotData(data, individual) 
{
	var heatmaprect = heatmapsvgobj.getBoundingClientRect();

	if(data == undefined || data.length == 0)
	{
		return;
	}

	// clear space
	heatmapsvg.selectAll("rect").remove();

	// hide employee id labels
	heatmapsvg.selectAll(".employeeLabel")
		.classed("hidden", true);

	// draw time blocks on heatmap

	for(var i = 0; i < data.length; i++)
	{
		if(data[i] == undefined)
		{
			continue;
		}

		heatmapsvg.selectAll(".hour")
			.data(data[i])
			.enter()
			.append("rect")
			.attr("x", function(d)
			{
				return (i * blockWidth);
			})
			.attr("y", function(d)
			{
				return heatmapY(+d.startTimeSeconds); 
			})
			.attr("width", blockWidth)
			.attr("height", function(d)
			{
				return heatmapY(+d.durationInSeconds); 
			})
			.attr("class", ".hour")
			.style("fill", function(d)
			{ 
				return getColor(d.zone); 
			})
			.on("mouseenter", function(d)
			{
				var mouse = [+d3.select(this).attr("x"), +d3.select(this).attr("y")];
				tooltip.attr("style", "left:" + (heatmaprect.left + mouse[0] + HEATMAP_INSET.left + blockWidth/2) + "px; top:" + (heatmaprect.top + mouse[1] + HEATMAP_INSET.top + 5) + "px");
				tooltip.classed("hidden", false)
					.html("Name: " + d.proxID + "<br>Date: " + d.date + "<br>Floor: " + d.floor + "<br>Zone: " + d.zone + "<br>Start: " + d.timeEntered + "<br>Duration: " + d.durationInLocation);
				d3.select(this).style("fill", dimcolors[+d.zone - 1]);
			})
			.on("mouseout", function(d)
			{
				d3.select(this).style("fill", getColor(d.zone));
				tooltip.classed("hidden", true);
			})
			.on("click", individual ? onEmployeeBlockClick : onBlockClick);

		// draw pattern overlays on appropriate timeblocks
		heatmapsvg.selectAll(".hour")
			.data(data[i])
			.enter()
			.append("rect")
				.attr("x", function(d)
				{
					return (i * blockWidth);
				})
				.attr("y", function(d)
				{
					return heatmapY(+d.startTimeSeconds); 
				})
				.attr("width", blockWidth)
				.attr("height", function(d)
				{
					return heatmapY(+d.durationInSeconds); 
				})
				.style("fill", function(d)
				{
					if(d.floor == 1)
					{
						return "none"; //getColor(d.zone);
					}
					else if(d.floor == 2)
					{
						return "url(#dots)";
					}
					else if(d.floor == 3)
					{
						return "url(#diagonalHatch)";
					}
				})
				.style("pointer-events", "none");
		
	}//end of i loop
	
}

function onBlockClick()
{
	tooltip.classed("hidden", true);

	startSingle(d3.select(this).data()[0].proxID);

	var blockData = d3.select(this).data();
	var id = blockData[0].proxID.trim();

	var date = blockData[0].date.trim();

	//currentDay = -1;

	d3.selectAll(".smallMultiples")
		.style("background-color", function(d)
		{
			return d == (datasets[currentDay]) ? "#AAAAAA" : null;
		});

	showPath(id, date);	
}

function onEmployeeBlockClick()
{
	startSingle(d3.select(this).data()[0].proxID);

	var blockData = d3.select(this).data();
	var id = blockData[0].proxID.trim();

	var date = blockData[0].date.trim();

	var index = dates.indexOf(date);

	selectDate(index);

	showPath(id, date);
	markCurrentPosition(+blockData[0].floor, +blockData[0].zone);
}

function drawHeatmap()
{
	sortedMap = document.getElementById("groupingCheckbox").checked;

	heatmapsvg.selectAll("rect").remove();

	if(sortedMap)
	{
		showOrderedData(datasets[currentDay]);
	}
	else
	{
		heatmapChart(datasets[currentDay]);
	}
}

function selectDate(index)
{
	currentDay = index;

	smallMultiples
		.style("background-color", function(d, i)
		{
			return i == (currentDay) ? "#AAAAAA" : null;
		});	

	document.getElementById("HeatmapDate").innerHTML = dates[index];
	changeTimestep();
}