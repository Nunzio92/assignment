export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateXCardModel(cardNumber){
    const cardType = ['video', 'elearning', 'learning_plan', 'playlist'];
    const randomTitle = ['Smooth Son', 'The Servants\'s School', 'Thoughts in the Hunter', 'The Tears of the Dragon',
        'The Dreamer\'s Princess', 'The Luck of the Abyss', 'The Whispering Serpent', 'Witches in the Emperor', 'The Door of the Female', 'Sword in the Thorns',
    'The Stones of the Cloud', 'The Husband of the Bridges', 'The Winter of the Moons', 'The Twins of the Swords']

    return Array.from({length: cardNumber}, (value, index) => ({
        image: `https://picsum.photos/300/150?_=${getRandomInt(100)}`,
        type: cardType[getRandomInt(cardType.length)],
        duration: getRandomInt(5000), // seconds
        title: randomTitle[getRandomInt(randomTitle.length)],
        cardinality: index % 2 ? 'single' : 'collection'
    }))
}

export function fromSecToH(sec){
    if (!!sec && typeof sec === 'number' ){
        const hours = Math.trunc(sec/3600);
        const min = (sec/3600 - hours)*60;
        const minTruncated = Math.abs(Math.trunc((sec/3600 - hours)*60));
        const formSec = Math.abs(Math.trunc((minTruncated - min)*60));
        if (hours > 0){
            return `${hours}h ${minTruncated}min`
        } else{
            return `${timeFormatter(minTruncated)}:${timeFormatter(formSec)}`
        }
    }
  return null;
}


function timeFormatter(number){
    let absNumber = Math.abs(number);
    return absNumber < 10 ? `0${absNumber}` : absNumber;
}


/**
 * This function use the template (html item) for get the html Element from html string! more powerful then using innerHTML
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template
 * @param html
 * @returns {ChildNode}
 */
export function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

