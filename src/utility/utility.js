/**
 * Return a integer between 0 and max
 * @param max
 * @returns {number}
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**
 * Resolve a promise after x ms
 * @param ms
 * @returns {Promise<unknown>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate aleatory cardModel based on getRandomInt()
 * @param cardNumber
 * @returns {{duration: number, image: string, type: string, title: string, cardinality: string}[]}
 */
function generateXCardModel(cardNumber) {
    const cardType = ['video', 'elearning', 'learning_plan', 'playlist'];
    const randomTitle = ['Smooth Son', 'The Servants\'s School', 'Thoughts in the Hunter', 'The Tears of the Dragon',
        'The Dreamer\'s Princess', 'The Luck of the Abyss', 'The Whispering Serpent', 'Witches in the Emperor', 'The Door of the Female', 'Sword in the Thorns',
        'The Stones of the Cloud', 'The Husband of the Bridges', 'The Winter of the Moons', 'The Twins of the Swords']

    // getRandomInt is useful for giving some aleatory to the model structure
    return Array.from({length: cardNumber}, (value, index) => ({
        image: `https://picsum.photos/300/150?_=${getRandomInt(100)}`, //the random query pram let to avoid the backend cache! different image for concurrent http call!
        type: cardType[getRandomInt(cardType.length)],
        duration: getRandomInt(5000), // seconds
        title: randomTitle[getRandomInt(randomTitle.length)],
        cardinality: getRandomInt(100) % 2 ? 'single' : 'collection'
    }))
}

/**
 * Utility for convert seconds to hours.
 * If the time is less then 1h different format is applied
 * @param sec
 * @returns {string|null}
 */
function fromSecToH(sec) {
    if (!!sec && typeof sec === 'number') {
        const hours = Math.trunc(sec / 3600);
        const min = (sec / 3600 - hours) * 60;
        const minTruncated = Math.abs(Math.trunc((sec / 3600 - hours) * 60));
        const formSec = Math.abs(Math.trunc((minTruncated - min) * 60));
        if (hours > 0) {
            return `${hours}h ${minTruncated}min`
        } else {
            return `${timeFormatter(minTruncated)}:${timeFormatter(formSec)}`
        }
    }
    return null;
}

// not exported function, used only from fromSecToH()
function timeFormatter(number) {
    let absNumber = Math.abs(number);
    return absNumber < 10 ? `0${absNumber}` : absNumber;
}


/**
 * This function use the template (html item) for get the html Element from html string! more powerful then using innerHTML
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
 * @param html
 * @returns {ChildNode}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

export {getRandomInt, delay, generateXCardModel, fromSecToH, htmlToElement};
