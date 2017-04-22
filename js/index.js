var classes = ['WARRIOR', 'SHAMAN', 'ROGUE', 'PALADIN', 'HUNTER', 'DRUID', 'WARLOCK', 'MAGE', 'PRIEST'];
var selectedClasses = new Set(classes);

function changeStatus(hero)
{
	var className = hero.toUpperCase();
	if(selectedClasses.has(className))
	{
		selectedClasses.delete(className);
		$("."+hero).css("opacity", 0.5);
	}
	else
	{
		selectedClasses.add(className);
		$("."+hero).css("opacity", 1.);
	}
}
