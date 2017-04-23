var classes = ['DRUID', 'HUNTER', 'MAGE', 'PALADIN', 'PRIEST', 'ROGUE', 'SHAMAN', 'WARLOCK', 'WARRIOR'];
var proccessedClass;
var allCards = [];
var selectedClasses = classes;
var acronym = "";

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
		}
	});
});

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
	acronym = $("#acronym").val().toUpperCase().replace(/[^A-Z]+/g, '');
	if(acronym.length > 0)
	{
		var outerDiv = $("<div>");
		for (var j = 0; j < selectedClasses.length + 1; j++){
			processedClass =  j < selectedClasses.length ? selectedClasses[j] : "NEUTRAL";
			var results = findDecks();
			if(results.length > 0)
			{		
				outerDiv.append($("<h4>").text(processedClass + " " + "(" + results.length + " decks)"));
			}
			var container = $("<div>").addClass("container");
			container.append($("<ul>"));
			for(var idx = 0; idx < results.length && idx < 30; idx++)
			{
				var result = results[idx];
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
		
		$("#results").html(outerDiv);
	}
}

function findDecks()
{
	var validCards = allCards.filter(filterProcessedClass).sort(sortByOrderInDeck);
	
	var result = findAllCombinations(acronym, validCards);
	if(processedClass != "NEUTRAL") result = result.filter(filterNeutralDecks);
	
	return result;
}

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
						local.unshift(card);
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
				|| ((obj.multiClassGroup == "JADE_LOTUS" && (processedClass == "DRUID" || processedClass == "ROGUE" || processedClass == "SHAMAN"))
					|| (obj.multiClassGroup == "KABAL" && (processedClass == "MAGE" || processedClass == "PRIEST" || processedClass == "WARLOCK"))
					|| (obj.multiClassGroup == "GRIMY_GOONS" && (processedClass == "WARRIOR" || processedClass == "HUNTER" || processedClass == "PALADIN")));
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


