
function heroUpgradeCost(level){
    const increment = Math.trunc(level/10)+1
    return level  * (50*increment);
}

function itemUpgradeCost(level){
    const increment = Math.trunc(level/10)+1
    return level * 50;
}

module.exports = [heroUpgradeCost, itemUpgradeCost]