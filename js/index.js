const classes = ['DRUID', 'HUNTER', 'MAGE', 'PALADIN', 'PRIEST', 'ROGUE', 'SHAMAN', 'WARLOCK', 'WARRIOR'];
var proccessedClass;
var allCards = [];
var selectedClasses = classes;
var acronym = "";
var loadedLanguage = "EN";
var lastResults = new Map();
const nbDisplayedDecks = 50;

// Callback function on click on class icon
function changeStatus(hero)
{
	const className = hero.toUpperCase();
	const idx = selectedClasses.indexOf(className);
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

// Initial loading of cards (EN)
$(window).load(function ()
{
	$.ajax({
		dataType: "json",
		url: "https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json",
		data: "",
		success: function(json) {
			allCards = json.filter(filterHeroes);
		}
	});
});

// Load cards of given language (ex : 'enUS')
function loadCards(language)
{
	$.ajax({
		dataType: "json",
		url: "https://api.hearthstonejson.com/v1/latest/"+language+"/cards.collectible.json",
		data: "",
		success: function(json) {
			allCards = json.filter(filterHeroes);
			launch();
		}
	});
}

// Enter press to trigger generation
$(document).ready(function() {

   $('#acronym').keypress(function(e){
			if(e.which === 13)
        launch();
   });

});

// Filters out heroes
function filterHeroes(card)
{
	return card.type != "HERO";
}

// main()
function launch()
{
	const wantedLanguage = $("#languageSelect").val();
	if(wantedLanguage != loadedLanguage)
	{
		// Cards for this lanuage not loaded
		loadedLanguage = wantedLanguage;
		loadCards(languageCorrespondance(wantedLanguage));
	}
	else
	{
		acronym = $("#acronym").val().toUpperCase().replace(/[^A-Z]+/g, '');
		if(acronym.length > 0)
		{
			var outerDiv = $("<div>");
			for (var j = 0; j < selectedClasses.length + 1; j++){
				processedClass =  j < selectedClasses.length ? selectedClasses[j] : "NEUTRAL";
				var results = findDecks();
				if(results.length > 0)
				{
					display(results, outerDiv);
					lastResults.set(processedClass, results);
				}
			}
			
			$("#results").html(outerDiv);
		}
	}
}

// Displays the results of findDecks()
function display(results, outerDiv)
{
	const nbDecksFound = results.length;
	var title = $("<p>").html(processedClass + " " + "(" + nbDecksFound + " deck" + (nbDecksFound > 1 ? "s"	: "") + ")   ");
	if(nbDecksFound > nbDisplayedDecks) title.append($("<button>").addClass("btn btn-default btn-sm repeat").attr("type", "button").attr("onClick", "reroll('"+processedClass+"');").html("<span class='glyphicon glyphicon-repeat'></span>"));
	outerDiv.append($("<h4>").html(title));
	var chosenResults = chooseDecksToDisplay(results);

	var container = $("<div>").addClass("container").attr("id", "results"+processedClass);
	container.append($("<ul>"));
	for(var idx = 0; idx < chosenResults.length; idx++)
	{
		const result = chosenResults[idx];
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

// Callback function for click on reroll button
function reroll(className)
{
	var decks = lastResults.get(className);
	decks = chooseDecksToDisplay(decks);

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

// Selects 30 random decks from given input
function chooseDecksToDisplay(results)
{
	var result = [];
	if(results.length < nbDisplayedDecks) return results;
	
	if(results.length > 5 * nbDisplayedDecks)
	{
		var chosenIndexes = [];
		while(result.length < nbDisplayedDecks)
		{
			var chosenIdx = Math.floor(Math.random()*results.length);
			if(chosenIndexes.indexOf(chosenIdx) == -1)
			{
				chosenIndexes.push(chosenIdx);
				result.push(results[chosenIdx])
			}
		}
	}
	else
	{
		var possibleIndexes = new Array(results.length);
		for(var i = 0; i < results.length; i++) possibleIndexes[i] = i;
		
		while(result.length < nbDisplayedDecks)
		{
			var chosenIdx = Math.floor(Math.random()*possibleIndexes.length);
			result.push(results[possibleIndexes[chosenIdx]]);
			possibleIndexes.splice(chosenIdx, 1);
		}
	}
	return result;
}

// Find combinations and processes them
function findDecks()
{
	var validCards = allCards.filter(filterProcessedClass).sort(sortByOrderInDeck);
	
	var result = findAllCombinations(acronym, validCards);
	for(var idx in result)
	{
		result[idx].reverse();
	}
	if(processedClass != "NEUTRAL") result = result.filter(filterNeutralDecks);
	
	return result;
}

// Recursive function to compute every possible combination
function findAllCombinations(string, useableCards)
{
	var result = [];
	if(string.length > 0)
	{
		var letter = string[0];
		var localUseable = useableCards.slice();
		var previousSubCombinations = [];
		var tested = false;
		while(localUseable.length > 0)
		{
			var card = localUseable[0];
			localUseable.shift();
			
			// Delete useless stored subCombinations
			for(var idx in previousSubCombinations)
			{			
				if(previousSubCombinations[idx].indexOf(card) != -1)
				{
					previousSubCombinations.splice(idx,1);
				}
			}

			if(card.name[0] == letter)
			{		
				if(string.length > 1)
				{
					if(!tested)
					{
						previousSubCombinations = findAllCombinations(string.substring(1, string.length), localUseable);
						tested = true;
					}
					
					for(var idx in previousSubCombinations)
					{
						var local = previousSubCombinations[idx].slice();
						local.push(card);
						result.push(local);
					}
				}
				else
				{
					result.push([card]);
				}
			}
		}
	}

	return result;
}

// Filters out the cards that cannot be put in a deck of class processedClass
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
				|| ((obj.multiClassGroup == "JADE_LOTUS" && (processedClass == "DRUID" || processedClass == "ROGUE" || processedClass == "SHAMAN"))
					|| (obj.multiClassGroup == "KABAL" && (processedClass == "MAGE" || processedClass == "PRIEST" || processedClass == "WARLOCK"))
					|| (obj.multiClassGroup == "GRIMY_GOONS" && (processedClass == "WARRIOR" || processedClass == "HUNTER" || processedClass == "PALADIN")));
		}
	}
	return result && acronym.indexOf(obj.name[0]) != -1;
}

// Filters out decks with only neutral cards
function filterNeutralDecks(deck)
{
	result = true;
	for(var idx = 0; idx < deck.length && result; idx++)
	{
		result = (deck[idx].cardClass == "NEUTRAL") && !('multiClassGroup' in deck[idx]);
	}
	
	return !result;
}

// Sorts cards by the order in which they appear in a deck
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

// Makes the correspondance between 2 letters shortname and database name
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


