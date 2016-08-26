const CORRELATION_THRESHOLD = .98; //.98;

var employeesData = {};
var employeeCount;
var entryCount;

function loadEmployeeData(file, callback)
{
	employeesData = {};

	d3.json(file, function(error, data)
	{
		if(error) throw error;

		employeeCount = data.length;

		for(var employee = 0; employee < data.length; employee++)
		{
			var employeeProxID = data[employee][0].proxID.trim();
			employeesData[employeeProxID] = new Array(25).fill(0);

			for(var entry = 0; entry < data[employee].length; entry++)
			{
				var floor = +data[employee][entry].floor;
				var zone = +data[employee][entry].zone;			

				if(zone == "Server Room")
				{
					zone = 9;
				}

				var index = getIndex(floor, zone);

				var temp = employeesData[employeeProxID];
				temp[index] += (+data[employee][entry].durationInSeconds);

				employeesData[employeeProxID] = temp;
			}
		}

		if(typeof callback === "function")
			callback();
	});
}

function getIndex(floor, zone)
{
	return 8 * (floor - 1) + (zone - 1);
}

function getCorrelation(setA, setB)
{
	var numerator = 0;
	var denominator = 0;

	var avgA = 0;
	var avgB = 0;

	var denomA = 0;
	var denomB = 0;

	// get mean for each set
	for(var i = 0; i < setA.length; i++)
	{
		avgA += setA[i];
		avgB += setB[i];
	}

	avgA /= setA.length;
	avgB /= setA.length;

	for(var i = 0; i < setA.length; i++)
	{
		numerator += (setA[i] - avgA) * (setB[i] - avgB);

		denomA += Math.pow((setA[i] - avgA), 2);

		denomB += Math.pow((setB[i] - avgB), 2);
	}

	denomA = Math.sqrt(denomA);
	denomB = Math.sqrt(denomB);

	denominator = denomA * denomB;

	return numerator/denominator;
}

function getCorrelations(map)
{

	var correlations = new Array(employeeCount);
	var employeeNames = Object.keys(map);

	for(var a = 0; a < employeeCount; a++)
	{
		correlations[a] = new Array(employeeCount);

		for(var b = 0; b < employeeCount; b++)
		{
			correlations[a][b] = getCorrelation(map[employeeNames[a]], map[employeeNames[b]]);
		}
	}

	return correlations;
}

function getLinks(correlations)
{
	if(correlations == undefined)
	{
		return [];
	}

	var links = [];

	for(var i = 0; i < correlations.length; i++)
	{
		for(var j = 0; j < i; j++)
		{
			if(+correlations[i][j] > CORRELATION_THRESHOLD)
			{
				links.push({"numSource": j, "numTarget": i, "source": Object.keys(employeesData)[j], "target": Object.keys(employeesData)[i], "value": +correlations[i][j]});
			}
		}
	}

	return links;
}

function getNodes(map)
{
	var nodes = [];

	for(var i = 0; i < Object.keys(map).length; i++)
	{
		nodes.push({"id": Object.keys(map)[i], "index": i, "group": 0});
	}

	return nodes;
}

function getAdjacencyList(links)
{
	var adjacencyList = new Array(employeeCount);

	for(var i = 0; i < employeeCount; i++)
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

			if(a.value > b.value)
				return -1;

			return 1;
		})
	}

	return adjacencyList;
}

function createOrder(nodes, adjacencyList)
{
	/*
		// - create tracker i for the current array position to add the node to
		- create list of all nodes with attached bool to indicate whether or not
			they have been processed
		- create stack of nodes to process
		- add first node in adjacency list to stack
		- while the stack is not empty, add all not-yet-processed
			nodes adjacent to the top node to the end of the stack
		- take node at the top of stack and put in first available index of array
		- pop top node
		- if the stack becomes empty, see if there are remaining unprocessed nodes
		- if there are, pick the first and add it to the stack
		- if not, we are done
	*/

	var ordered = [];
	var stack = [];
	var visited = new Array(employeeCount);
	visited.fill(false);

	visited[0] = true;
	stack.push(nodes[0]);

	while(!(stack.length == 0))
	{
		var current = stack.pop();
		var nodeIndex = +current.index;
		
		visited[nodeIndex] = true;
		ordered.push(current.id);

		for(var i = adjacencyList[nodeIndex].length - 1; i >= 0; i--)
		{
			if(!visited[+adjacencyList[nodeIndex][i].numTarget])
			{
				visited[+adjacencyList[nodeIndex][i].numTarget] = true;
				stack.push(nodes[+adjacencyList[nodeIndex][i].numTarget]);
			}
		}

		if(stack.length == 0)
		{
			for(var i = 0; i < visited.length; i++)
			{
				if(!visited[i])
				{
					visited[i] = true;
					stack.push(nodes[i]);
					break;
				}
			}
		}
	}

	return ordered;
}

function getGroupedNodes(nodes, adjacencyList)
{
	var groupNumber = 0;

	var newNodes = [];
	var stack = [];
	var visited = new Array(employeeCount);
	visited.fill(false);

	stack.push(nodes[0]);

	while(!(stack.length == 0))
	{
		var current = stack.pop();
		var nodeIndex = +current.index;
		
		visited[nodeIndex] = true;
		current.group = groupNumber;
		newNodes.push(current);

		for(var i = adjacencyList[nodeIndex].length - 1; i >= 0; i--)
		{
			if(!visited[+adjacencyList[nodeIndex][i].numTarget])
			{
				visited[+adjacencyList[nodeIndex][i].numTarget] = true;
				stack.push(nodes[+adjacencyList[nodeIndex][i].numTarget]);
			}
		}

		if(stack.length == 0)
		{
			for(var i = 0; i < visited.length; i++)
			{
				if(!visited[i])
				{
					groupNumber++;
					//visited[i] = true;
					stack.push(nodes[i]);
					break;
				}
			}
		}
	}

	return newNodes;
}