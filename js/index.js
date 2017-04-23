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
		var mainList = $("<ul>");
		
		for (var j = 0; j < selectedClasses.length + 1; j++){
			processedClass =  j < selectedClasses.length ? selectedClasses[j] : "NEUTRAL";
			var results = findDecks();
			if(results.length > 0)
			{
				mainList.append($("<h4>").text(processedClass));
			}

			for(var idx = 0; idx < results.length && idx < 30; idx++)
			{
				var result = results[idx];
				var deck = "[";
				for(var i = 0; i < result.length; i++)
				{
					deck += '<b class="'+result[i].rarity.toLowerCase()+'">' + result[i].name[0] + "</b>" + result[i].name.substring(1,result[i].name.length) + (i == result.length - 1 ? "]" : ", ");
				}
				mainList.append($("<li>").html(deck));
			}
		}
		
		$("#results").html(mainList);
	}
}

function findDecks()
{
	var validCards = allCards.filter(filterProcessedClass).sort(sortByOrderInDeck);
	
	return findAllCombinations(acronym, validCards);
}

function findAllCombinations(string, useableCards)
{
	var result = [];
	console.log("start " + string + " " + useableCards.length);
	if(string.length > 0)
	{
		var letter = string[0];
		var localUseable = useableCards.slice(0);
		var previousSubCombinations
		var tested = false;
		for(var i = 0; i < localUseable.length; i++)
		{
			var card = localUseable[0];
			localUseable.splice(0,1);
			if(card.name[0] == letter)
			{		
				if(string.length > 1)
				{
					if(!tested)
					{
						previousSubCombinations = findAllCombinations(string.substring(1, string.length), localUseable);
						tested = true;
					}
					var subCombinations = previousSubCombinations.splice(0);
					for(var combination in subCombinations)
					{
						subCombinations[combination].unshift(card);
						result.push(subCombinations[combination]);
					}
				}
				else
				{
					result.push([card]);
				}
			}
			else
			{
				for(var idx in previousSubCombinations)
				{
					if(previousSubCombinations[idx].indexOf(card) != -1)
					{
						previousSubCombinations.splice(idx,1);
					}
				}
			}
			i--;
		}
	}
	console.log("end " + string + " " + result.length);
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


