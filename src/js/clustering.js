const DISTANCE_MAX_THRESHOLD = 31000;
const EMPLOYEE_OUT_DISTANCE = 90; // distance value between an employee no longer at work to any employee in the building

var employeeList = [];
var employeeLocsFile = "../data/json/clustering/EmployeeLocs-Day0.json";
var employeeLocs;

var zoneDistances;

var correlations;
var adjacencyMatrix;
var links;

// EXECUTION START

init();

// EXECUTION END

function init()
{
	loadEmployeeLocs(loadZoneDistances);
}

function loadEmployeeLocs(callback)
{
	d3.json(employeeLocsFile, function(error, data)
	{	
		if(error)
			throw error;

		employeeList = Object.keys(data);
		correlations = new Array(employeeList.length);
		for(var i = 0; i < correlations.length; i++)
		{
			correlations[i] = new Array(employeeList.length);
		}
		employeeLocs = data;

		callback();
		//callback(calculateCorrelations);
	});
}

function loadZoneDistances(callback)
{
	d3.json("../data/json/clustering/zoneDistances.json", function(error, data)
	{
		if(error)
			throw error;

		zoneDistances = data;

		if(callback)
			callback();
	});
}

function calculateCorrelations()
{
	for(var employeeA = 0; employeeA < employeeList.length; employeeA++)
	{
		var employeeAName = employeeList[employeeA];

		for(var employeeB = 0; employeeB < employeeList.length; employeeB++)
		{
			var employeeBName = employeeList[employeeB];
			var inverseCorr = 0; // Our correlation value for these two employees. Lower values indicate higher correlation.

			for(var i = 0; i < employeeLocs[employeeAName].length - 1; i++)
			{
				var locA = employeeLocs[employeeAName][i];
				var locB = employeeLocs[employeeBName][i];

				var timeDifference = employeeLocs[employeeAName][i+1].offset - employeeLocs[employeeAName][i].offset;

				var distance = getDistance(getZoneIndex(locA.floor, locA.zone), getZoneIndex(locB.floor, locB.zone)) * timeDifference;

				inverseCorr += distance;
			}

			//console.log(employeeA + ", " + employeeB);
			correlations[employeeA][employeeB] = inverseCorr;
		}
	}

	downloadJSON(correlations);
}

function getZoneIndex(floor, zone)
{
	if(zone == "Server Room")
	{
		return 21;
	}
	else
	if(floor == -1 && zone == -1)
	{
		return -1;
	}
	else
	{		
		if(floor == 1)
		{
			return zone;
		}

		if(floor == 2)
		{
			7 + zone;
		}

		return 14 + zone;
	}
}

function getDistance(zoneIndexA, zoneIndexB)
{
	if(zoneIndexA == -1 || zoneIndexB == -1)
	{
		if(zoneIndexA == -1 && zoneIndexB == -1)
			return 0;
		else
			return EMPLOYEE_OUT_DISTANCE;
	}
	return zoneDistances[zoneIndexA][zoneIndexB];
}

function loadLinks()
{
	if(correlations == undefined)
	{
		return [];
	}

	links = [];
	adjacencyMatrix = new Array(employeeList.length);

	for(var i = 0; i < correlations.length; i++)
	{	
		adjacencyMatrix[i] = new Array(employeeList.length);
		adjacencyMatrix[i].fill(false);

		for(var j = 0; j < correlations.length; j++)
		{
			if(+correlations[i][j] <= DISTANCE_MAX_THRESHOLD)
			{
				links.push({"numSource": i, "numTarget": j, "source": employeeList[i], "target": employeeList[j], "value": +correlations[i][j]});
				adjacencyMatrix[i][j] = true;
			}
		}
	}
}

function getNodes()
{
	var nodes = [];

	for(var i = 0; i < employeeList.length; i++)
	{
		nodes.push({"id": employeeList[i], "index": i, "group": 0});
	}

	return nodes;
}

function getAdjacencyList()
{
	var adjacencyList = new Array(employeeList.length);

	for(var i = 0; i < employeeList.length; i++)
	{
		adjacencyList[i] = [];

		for(var j = 0; j < links.length; j++)
		{
			if(+links[j].numSource != i)
				continue;

			adjacencyList[i].push(links[j]);
		}		

		// sort entries in row of adjacency list by correlation, descending
		adjacencyList[i].sort(function(a, b)
		{
			if(a.value == b.value)
				return 0;

			if(a.value < b.value)
				return -1;

			return 1;
		})
	}

	return adjacencyList;
}

function downloadJSON(object) 
{
	var json = JSON.stringify(object);

	var csvWin = window.open("","","");
	csvWin.document.write('<meta name="content-type" content="text/csv">');
	csvWin.document.write('<meta name="content-disposition" content="attachment;  filename=test.csv">  ');
	csvWin.document.write(json);
}

function groupNodes(nodes, adjacencyList)
{
	console.log("groupnodes");
	var groupIndex = 0;

	var stack = [];

	var groups = [];
	var visited = new Array(employeeList.length);
	visited.fill(false);

	stack.push(0);
	visited[0] = true;
	groups[0] = [];

	while(!(stack.length == 0))
	{
		var currentEmployeeIndex = stack.pop();

		// DEBUG
		if(nodes[currentEmployeeIndex].id != employeeList[currentEmployeeIndex])
		{
			console.log("id: " + nodes[currentEmployeeIndex].id + ", indexname: " + employeeList[currentEmployeeIndex]);
		}

		nodes[currentEmployeeIndex].group = groupIndex;
		console.log(employeeList[currentEmployeeIndex] + ": " + groupIndex);
		groups[groupIndex].push(currentEmployeeIndex);

		for(var otherEmployeeIndex = 0; otherEmployeeIndex < employeeList.length; otherEmployeeIndex++)
		{
			if(visited[otherEmployeeIndex])
			{
				continue;
			}

			if(adjacencyMatrix[currentEmployeeIndex][otherEmployeeIndex] == true)
			{
				stack.push(otherEmployeeIndex);
				visited[otherEmployeeIndex] = true;
			}
		}

		if(stack.length == 0)
		{
			for(var i = 0; i < visited.length; i++)
			{
				if(!visited[i])
				{
					groupIndex++;
					groups[groupIndex] = [];
					stack.push(i);
					visited[i] = true;
					break;
				}
			}
		}
	}

	var groupsWithNames = new Array(groups.length);
	groupsWithNames.fill([]);

	for(var i = 0; i < groups.length; i++)
	{
		for(var j = 0; j < groups[i].length; j++)
		{
			groupsWithNames[i][j] = employeeList[groups[i][j]];
		}
	}

	downloadJSON(employeeList);
}