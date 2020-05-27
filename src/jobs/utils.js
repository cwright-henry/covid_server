const colors = [
    "#2196F3",
    "#FFF59D",
    "#3f51b5",
    "#E64A19",
    "#ffc107",
    "#009688",
    "#8bc34a",
    "#cddc39",
    "#4caf50",
    "#00bcd4",
    "#2196f3",
    "#673ab7",
    "#e91e63",
    "#ffeb3b",
    "#ff5722",
    "#607d8b",
    "#000000",
    "#ff0000"
];

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 * 
 * @param {*} object 
 */
const deepFreeze = (object) => {

    // Retrieve the property names defined on object
    var propNames = Object.getOwnPropertyNames(object);

    // Freeze properties before freezing self

    for (let name of propNames) {
        let value = object[name];

        if (value && typeof value === "object") {
            deepFreeze(value);
        }
    }

    return Object.freeze(object);
}

const findColor = index => {
    return colors[index % colors.length];
};

/**
 * Unique ID from element
 */
const uuid = () => {
    return parseInt(Math.random().toString().slice(2, 11))
}

module.exports = {
    uuid,
    findColor,
    deepFreeze
}
