const classes = ['DRUID', 'HUNTER', 'MAGE', 'PALADIN', 'PRIEST', 'ROGUE', 'SHAMAN', 'WARLOCK', 'WARRIOR'];
var proccessedClass;
var allCards = [];
var selectedClasses = classes;
var acronym = "";
var loadedLanguage = "EN";
var lastResults = new Map();
const nbDisplayedDecks = 30;
var nbNeutralDecks = 0;

function changeStatus(hero)
{
	var className = hero.toUpperCase();
	var idx = selectedClasses.indexOf(className);
	if(idx != -1)
	{
		selectedClasses.splice(idx,1);
		$("."+hero).css("opacity", 0.5);
	}
	else
	{
		selectedClasses.push(className);
		$("."+hero).css("opacity", 1.);
	}
}

$(window).load(function ()
{
	$.ajax({
		dataType: "json",
		url: "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json",
		data: "",
		success: function(json) {
			allCards = json.filter(filterHeroes);
			allCards.forEach(lightCard);
		}
	});
});

function loadCards(language)
{
	$.ajax({
		dataType: "json",
		url: "https://api.hearthstonejson.com/v1/latest/"+language+"/cards.collectible.json",
		data: "",
		success: function(json) {
			allCards = json.filter(filterHeroes);
			allCards.forEach(lightCard);
			launch();
		}
	});
}

function lightCard(card)
{
	card.description = undefined;
	card.artist = undefined;
	card.flavor = undefined;
	card.text = undefined;
	card.mechanics = undefined;
	card.id = undefined;
}

$(document).ready(function() {

   $('#acronym').keypress(function(e){
			if(e.which === 13)
        launch();
   });

});

function filterHeroes(card)
{
	return card.type != "HERO";
}

function launch()
{
	var wantedLanguage = $("#languageSelect").val();
	if(wantedLanguage != loadedLanguage)
	{
		loadedLanguage = wantedLanguage;
		loadCards(languageCorrespondance(wantedLanguage));
	}
	else
	{
		acronym = $("#acronym").val().toUpperCase().replace(/[^A-Z]+/g, '');
		if(acronym.length > 0)
		{
			var outerDiv = $("<div>");
			var start = new Date().getTime();
			var totalNbResults = 0;
			for (var j = 0; j < selectedClasses.length + 1; j++){
				processedClass =  j == 0 ? "NEUTRAL" : selectedClasses[j-1];
				var results = findDecks();
				var nbResults = getNbDecks(results);
				(j == 0 ? nbNeutralDecks = nbResults : nbResults -= nbNeutralDecks);
				
				if(nbResults > 0)
				{
					totalNbResults += nbResults;
					display(results, outerDiv, nbResults);
					lastResults.set(processedClass, results);
				}
			}
			var end = new Date().getTime();
			var time = end - start;
			outerDiv.prepend($("<p>").text(totalNbResults + " decks generated in " + time + "ms").addClass("timer"));
			$("#results").html(outerDiv);
		}
	}
}

function display(results, outerDiv, nbDecksFound)
{
	var title = $("<p>").html(processedClass + " " + "(" + nbDecksFound + " deck" + (nbDecksFound > 1 ? "s"	: "") + ")   ");
	title.append($("<button>").addClass("btn btn-default btn-sm dust").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'asc');").html("<img src='img/dustIcon.png' class='smallDust'/>"));
	title.append($("<button>").addClass("btn btn-default btn-sm dust").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'desc');").html("<img src='img/dustIcon.png' class='largeDust'/>"));
	title.append($("<button>").addClass("btn btn-default btn-sm dust").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'mana');").html("<img src='img/manaIcon.png' class='largeDust'/>"));

	if(nbDecksFound > nbDisplayedDecks) title.append($("<button>").addClass("btn btn-default btn-sm repeat").attr("type", "button").attr("onClick", "reroll('"+processedClass+"');").html("<span class='glyphicon glyphicon-repeat'></span>"));
	outerDiv.append($("<h4>").html(title));
	var nbDecks = getNbDecks(results);
	var chosenResults = chooseRandomDecksToDisplay(results, nbDecks);

	var container = $("<div>").addClass("container").attr("id", "results"+processedClass);
	container.append($("<ul>"));
	for(var idx = 0; idx < chosenResults.length; idx++)
	{
		var result = chosenResults[idx];
		var deck = "[";
		for(var i = 0; i < result.length; i++)
		{
			deck += '<b class="'+result[i].rarity.toLowerCase()+'">' + result[i].name[0] + "</b>" + result[i].name.substring(1,result[i].name.length) + (i == result.length - 1 ? "]" : ", ");
		}
		container.append($("<li>").html(deck));
	}
	
	outerDiv.append(container);
	outerDiv.append($("<br>"));
}

function reroll(className)
{
	processedClass = className;
	var decks = lastResults.get(className);
	decks = chooseRandomDecksToDisplay(decks, getNbDecks(decks));
	var classDiv = $("#results"+className);
	classDiv.empty();
	classDiv.append($("<ul>"));
	for(var i = 0; i < decks.length; ++i)
	{
		var deck = decks[i];
		var html = "[";
		for(var j = 0; j < deck.length; j++)
		{
			html += '<b class="'+ deck[j].rarity.toLowerCase()+'">' + deck[j].name[0] + "</b>" + deck[j].name.substring(1,deck[j].name.length) + (j == deck.length - 1 ? "]" : ", ");
		}
		classDiv.append($("<li>").html(html));		
	}
}

function chooseRandomDecksToDisplay(results, nbDecksGenerated)
{
	var generatedResults = [];
	if(processedClass == "NEUTRAL")
	{
		if(nbDecksGenerated > 5 * nbDisplayedDecks)
		{
			generatedResults = selectByRandomShoot(results, nbNeutralDecks, true);
		}
		else
		{
			generatedResults = selectByGeneration(results, nbNeutralDecks, true);
		}
	}
	else
	{
		var nbDecksClass = nbDecksGenerated - nbNeutralDecks;
		if(nbNeutralDecks == 0 || 100*nbDecksClass > nbNeutralDecks)
		{
			generatedResults = selectByRandomShoot(results, nbDecksClass, false);
		}
		else if(nbDecksClass > 0)
		{
			generatedResults = selectByGeneration(results, nbDecksClass, false);
		}
	}
	
	return generatedResults;
}

function selectByRandomShoot(results, nbClassDecks, acceptNeutral)
{
	var chosenIndexes = [];
	var generatedResults = [];
	while(generatedResults.length < nbDisplayedDecks && generatedResults.length < nbClassDecks)
	{
		var subIdx = 0;
		var indexesVector = [];
		for(var i = 0; i < results.length; i++)
		{
			var chosenIdx = Math.floor(Math.random()*(results[i].length - subIdx)) + subIdx;
			subIdx = results[i][chosenIdx].subIdx;
			indexesVector.push(chosenIdx);
		}
		
		if(chosenIndexes.indexOf(indexesVector) == -1)
		{
			chosenIndexes.push(indexesVector);
			var deck = expandResult(results, indexesVector);
			if(acceptNeutral || !isNeutral(deck))
			{
				generatedResults.push(deck);
			}
		}
	}
	
	return generatedResults;
}

function selectByGeneration(results, nbClassDecks, acceptNeutral)
{
	var generatedResults = [];
	var possibleIndexesVector = generateAllPossibleIndexesVector(results, 0, 0);
	
	while(generatedResults.length < nbDisplayedDecks && generatedResults.length < nbClassDecks && possibleIndexesVector.length > 0)
	{
		var chosenIdx = Math.floor(Math.random()*possibleIndexesVector.length);
		var deck = expandResult(results, possibleIndexesVector[chosenIdx]);
		if(acceptNeutral || !isNeutral(deck))
		{
			generatedResults.push(deck);
		}
		possibleIndexesVector.splice(chosenIdx, 1);
	}
	
	return generatedResults;
}

function sort(className, order)
{
	processedClass = className;
	var decks = lastResults.get(className);
	if(order == 'asc')
	{
		decks = getFirstElements(decks, lowDustCost);
	}	
	else if(order == 'desc')
	{
		decks = getFirstElements(decks, highDustCost);
	}
	else
	{
		decks = getFirstElements(decks, maxManaCostDiff);
	}
	var classDiv = $("#results"+className);
	classDiv.empty();
	classDiv.append($("<ul>"));
	for(var i = 0; i < nbDisplayedDecks && i < decks.length; ++i)
	{
		var deck = order == 'desc' ? decks[decks.length - i - 1] : decks[i];
		var html = "[";
		for(var j = 0; j < deck.length; j++)
		{
			html += '<b class="'+ deck[j].rarity.toLowerCase()+'">' + deck[j].name[0] + "</b>" + deck[j].name.substring(1,deck[j].name.length) + (j == deck.length - 1 ? "]" : ", ");
		}
		classDiv.append($("<li>").html(html));		
	}
}

function getFirstElements(results, costFunction)
{
	var firstElements = [];
	var possibleIndexesVector = generateAllPossibleIndexesVector(results, 0, 0);
	
	for(var i in possibleIndexesVector)
	{
		if(processedClass == "NEUTRAL" || !isNeutralVector(results, possibleIndexesVector[i]))
		{
			var deckCost = costFunction(results, possibleIndexesVector[i]);
			var insertionIdx = firstElements.length-1;
			for( ; insertionIdx >= 0 && deckCost > firstElements[insertionIdx].cost; insertionIdx--);
			
			if(insertionIdx+1 < firstElements.length || firstElements.length < nbDisplayedDecks)
			{
				var newArray = firstElements.slice(0, insertionIdx+1);
				newArray.push({deck:expandResult(results, possibleIndexesVector[i]), cost:deckCost});
				firstElements = newArray.concat(firstElements.slice(insertionIdx+2, firstElements.length-1));
			}
		}
	}
	
	var decks = [];
	for(var i in firstElements)
	{
		decks[i] = firstElements[i].deck;
	}
	return decks;
}

function highDustCost(results, indexVector)
{
	var cost = 0;
	for(var i in results)
	{
		cost += getCost(results[i][indexVector[i]].card);
	}
	
	return cost;
}

function lowDustCost(results, indexVector)
{
	return -highDustCost(results, indexVector);
}

function maxManaCostDiff(results, indexVector)
{
	return -(results[results.length-1][indexVector[results.length-1]].cost - results[0][indexVector[0]]);
}

function getCost(card)
{
	switch(card.rarity)
	{
		case "COMMON": return 40;
		case "RARE": return 100;
		case "EPIC": return 400;
		case "LEGENDARY": return 1600;
		default: return 0;
	}
}

function findDecks()
{
	var validCards = allCards.filter(filterProcessedClass).sort(sortByOrderInDeck);
	
	var result = findAllCombinations(acronym, validCards);

	return result;
}

function findAllCombinations(string, localUseable)
{
	//console.log("enter " + string + " " + localUseable.length);
	var result = [];
	if(string.length > 0)
	{
		var letter = string[0];
		var previousSubCombinations = [];
		var tested = false;
		var substring = string.substring(1, string.length);
		var idxFirstSub = 0;
		var rowToAdd = [];
		while(localUseable.length > 0 && (!tested || idxFirstSub < previousSubCombinations[0].length))
		{
			var card = localUseable[0];
			localUseable.shift();
			//console.log("studying " + card.name);
			
			if(previousSubCombinations.length > 0 && previousSubCombinations[0][idxFirstSub].card == card)
			{
				idxFirstSub++;
			}

			if(card.name[0] == letter)
			{		
				if(string.length > 1)
				{
					if(!tested)
					{
						var subUseable = (substring.indexOf(letter) == -1) ? localUseable.filter(function(card){ return card.name[0] != letter;} ) : localUseable.slice();						
						previousSubCombinations = findAllCombinations(substring, subUseable);
						tested = true;
					}
					//console.log("firstIndex " + idxFirstSub);
					if(idxFirstSub < previousSubCombinations[0].length)
					{
						var nbSubDecks = 0;
						for(var i = idxFirstSub; i < previousSubCombinations[0].length; ++i)
						{
							nbSubDecks += previousSubCombinations[0][i].nbSubDecks;
						}
					
						rowToAdd.push({card:card, subIdx:idxFirstSub, nbSubDecks:nbSubDecks});
					}
				}
				else
				{
					//console.log("feuille " + card.name);
					rowToAdd.push({card: card, subIdx: 0, nbSubDecks: 1});
				}
			}
		}
		
		result.push(rowToAdd);
		result = result.concat(previousSubCombinations);
		//console.log("result");
		//console.log(result);
	}
	//console.log("exit " + string);
	return result;
}

function filterProcessedClass(obj)
{
	var result = false;
	if('cardClass' in obj)
	{
		result = obj.cardClass == processedClass && !('multiClassGroup' in obj);
		
		if(!result && obj.cardClass == "NEUTRAL")
		{
			result = 
				!('multiClassGroup' in obj)
				|| ('classes' in obj && obj.classes.indexOf(processedClass)!= -1);
		}
	}
	return result && acronym.indexOf(obj.name[0]) != -1;
}

function isNeutral(deck)
{
	var result = true;
	for(var idx = 0; idx < deck.length && result; idx++)
	{
		result = (deck[idx].cardClass == "NEUTRAL") && !('multiClassGroup' in deck[idx]);
	}
	
	return result;
}

function isNeutralVector(results, indexesVector)
{
	var result = true;
	for(var i = 0; i < results.length && result; i++)
	{
		result = (results[i][indexesVector[i]].cardClass == "NEUTRAL") && !('multiClassGroup' in results[i][indexesVector[i]]);
	}
	
	return result;
}

function sortByOrderInDeck(card1, card2)
{
	if(card1.cost < card2.cost)
		return -1;
	else if (card2.cost < card1.cost)
		return 1;
	else
	{
		if(card1.name.toUpperCase() < card2.name.toUpperCase()) return -1;
		else if(card1.name.toUpperCase() > card2.name.toUpperCase()) return 1;
		else return 0;
	}
}

function languageCorrespondance(shortLanguage)
{
	switch(shortLanguage)
	{
		case "EN": return "enUS";
		case "DE": return "deDE";
		case "FR": return "frFR";
		case "ES": return "esES";
		case "MX": return "esMX";
		case "IT": return "itIT";
		case "PL": return "plPL";
		case "BR": return "ptBR";
		default: return "";
	}
}

function getNbDecks(results)
{
	var result = 0;
	
	for(var idx in results[0])
	{
		result += results[0][idx].nbSubDecks;
	}
	
	return result;
}

function expandAllResults(results, letterIdx, subIdx, currentNbResults)
{
	var expandedResults = [];
	for(var idx = subIdx; idx < results[letterIdx].length; ++idx)
	{
		if(letterIdx == results.length-1)
		{
			expandedResults.push([results[letterIdx][idx].card]);
		}
		else
		{
			var subResults = expandAllResults(results, letterIdx+1, results[letterIdx][idx].subIdx);
			for(var subIdx2 in subResults)
			{
				var local = subResults[subIdx2].slice();
				local.push(results[letterIdx][idx].card);
				expandedResults.push(local);
			}
		}
	}
		
	return expandedResults;
}

function expandResult(results, indexesVector)
{
	var result = [];
	for(var i in results)
	{
		result.push(results[i][indexesVector[i]].card);
	}
		
	return result;
}

function generateAllPossibleIndexesVector(results, letterIdx, subIdx)
{
	var expandedResults = [];
	for(var idx = subIdx; idx < results[letterIdx].length; ++idx)
	{
		if(letterIdx == results.length-1)
		{
			expandedResults.push([idx]);
		}
		else
		{
			var subResults = generateAllPossibleIndexesVector(results, letterIdx+1, results[letterIdx][idx].subIdx);
			for(var subIdx2 in subResults)
			{
				var local = subResults[subIdx2].slice();
				local.unshift(idx);
				expandedResults.push(local);
			}
		}
	}
	
	return expandedResults
}