const classes = ['DRUID', 'HUNTER', 'MAGE', 'PALADIN', 'PRIEST', 'ROGUE', 'SHAMAN', 'WARLOCK', 'WARRIOR'];
var proccessedClass;
var allCards = [];
var selectedClasses = classes;
var acronym = "";
var loadedLanguage = "EN";
var lastResults = new Map();
const nbDisplayedDecks = 30;

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
	console.log("status changed");
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
			var nbResults = 0;
			for (var j = 0; j < selectedClasses.length + 1; j++){
				processedClass =  j < selectedClasses.length ? selectedClasses[j] : "NEUTRAL";
				var results = findDecks();
				if(results.length > 0)
				{
					nbResults += results.length;
					display(results, outerDiv);
					lastResults.set(processedClass, results);
				}
			}
			var end = new Date().getTime();
			var time = end - start;
			outerDiv.prepend($("<p>").text(nbResults + " decks generated in " + time + "ms").addClass("timer"));
			$("#results").html(outerDiv);
		}
	}
}

function display(results, outerDiv)
{
	const nbDecksFound = results.length;
	var title = $("<p>").html(processedClass + " " + "(" + nbDecksFound + " deck" + (nbDecksFound > 1 ? "s"	: "") + ")   ");
	title.append($("<button>").addClass("btn btn-default btn-sm dust").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'asc');").html("<img src='img/dustIcon.png' class='smallDust'/>"));
	title.append($("<button>").addClass("btn btn-default btn-sm dust").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'desc');").html("<img src='img/dustIcon.png' class='largeDust'/>"));
	title.append($("<button>").addClass("btn btn-default btn-sm dust").attr("type", "button").attr("onClick", "sort('"+processedClass+"', 'mana');").html("<img src='img/manaIcon.png' class='largeDust'/>"));

	if(nbDecksFound > nbDisplayedDecks) title.append($("<button>").addClass("btn btn-default btn-sm repeat").attr("type", "button").attr("onClick", "reroll('"+processedClass+"');").html("<span class='glyphicon glyphicon-repeat'></span>"));
	outerDiv.append($("<h4>").html(title));
	var chosenResults = chooseDecksToDisplay(results);

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

function sort(className, order)
{
	var decks = lastResults.get(className);
	if(order == 'asc' || order == 'desc')
	{
		decks.sort(costLess);
	}
	else
	{
		decks.sort(maxManaCost);
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

function costLess(deck1, deck2)
{
	var costDeck1 = 0;
	var costDeck2 = 0;
	for(var i = 0; i < deck1.length; ++i)
	{
		costDeck1 += getCost(deck1[i]);
		costDeck2 += getCost(deck2[i]);
	}
	
	return costDeck1 - costDeck2;
}

function maxManaCost(deck1, deck2)
{
	return (deck1[deck1.length-1].cost - deck1[0].cost) - (deck2[deck2.length-1].cost - deck2[0].cost);
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
	for(var idx in result)
	{
		result[idx].reverse();
	}
	if(processedClass != "NEUTRAL") result = result.filter(filterNeutralDecks);
	
	return result;
}

function findAllCombinations(string, localUseable)
{
	var result = [];
	if(string.length > 0)
	{
		var letter = string[0];
		var previousSubCombinations = [];
		var tested = false;
		var substring = string.substring(1, string.length);
		while(localUseable.length > 0)
		{
			var card = localUseable[0];
			localUseable.shift();
			
			if(substring.indexOf(card.name[0]) != -1)
			{
				previousSubCombinations = previousSubCombinations.filter(function(subCombination){return subCombination.indexOf(card) == -1});
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

function filterNeutralDecks(deck)
{
	result = true;
	for(var idx = 0; idx < deck.length && result; idx++)
	{
		result = (deck[idx].cardClass == "NEUTRAL") && !('multiClassGroup' in deck[idx]);
	}
	
	return !result;
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


