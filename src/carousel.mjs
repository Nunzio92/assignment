import {fromSecToH, htmlToElement} from "./utility/utility.mjs";

// linear interpolation law between two known inputs (value1, value2) for a parameter (t) in the closed unit interval [0, 1]
const lerp = (value1, value2, t) => (1 - t) * value1 + t * value2;
// return a value between an upper and lower bound or the bound
const clamp = (val, min, max) => Math.max(min, Math.min(val, max));
// get card width or min-width (is possible to used css var for better sync between css and js)
const cardWidth = () => document.documentElement.clientWidth * 0.19 < 220 ? 220 : document.documentElement.clientWidth;
// CONSTANT chunk size
const chunkSize = 6;

export class Carousel {
    /**
     * @param obj configuration object =
     * {
     *   container: string,
     *   draggable: boolean,
     *   title: string,
     *   subtitle: string,
     *   fetchCards: async function,
     *   hoverEffect: boolean
     * }
     */
    constructor(obj) {
        this.$container = document.querySelector(obj.container);
        this.chunkSize = chunkSize;
        this.chunkSizeArray = Array.from({length: this.chunkSize});
        this.draggable = obj.draggable ?? true;         // drag can be deactivated through carousel config
        this.title = obj.title;
        this.subtitle = obj.subtitle;
        this.fetchCards = obj.fetchCards;
        this.hoverEffect = obj.hoverEffect ?? false;    // hoverEffect can be deactivated through carousel config

        this.init().then(_ => {
            // console.log(`${this.$container.id} init complete`)
        });
    }

    async init() {
        // init progress variable
        this.progress = 0;
        this.speed = 0;
        this.oldX = 0;
        this.x = 0;
        this.playrate = 0;
        this.fetching = false;
        // init methods
        this.bindings();
        this.renderCarousel();
        this.initCarouselElements();
        this.addEventsListener();
        await this.fetchNewChunk(true);
    }

    bindings() {
        [
            'toggleLoadingState',
            'fetchNewChunk',
            'renderPlaceholderChunk',
            'renderCardChunk',
            'initCarouselElements',
            'cardHtml',
            'placeholderHtml',
            'renderCarousel',
            'updateElementsAndWidths',
            'addEventsListener',
            'calculateWidths',
            'toggleNavigation',
            'handleTouchStart',
            'handleTouchMove',
            'handleTouchEnd',
            'handleNext',
            'handlePrev',
            'animationFrame'
        ].forEach(i => {
            // binding this to all method
            this[i] = this[i].bind(this);
        })
    }

    /**
     * Method for render the carousel base structure (slide wrapper and info row)
     */
    renderCarousel() {
        // <my-carousel> is unknown html tag, it isn't a webcomponents (then is ignored by browser) but is useful for
        // identifying the component location inside the dom (angular style!)
        this.$container.appendChild(htmlToElement(`
            <my-carousel> 
                <div class="row carousel__info">
                    <div class="col carousel__info_icon"><span class="material-icons">lightbulb</span></div>
                    <div class="col">
                        <h1 class="carousel__info_title">${this.title}</h1> 
                        <h2 class="carousel__info_subtitle">${this.subtitle}</h2>
                    </div>
                </div>
                <div class="carousel">
                    <div class="carousel__wrap">
                    <!--slides chunk going here-->
                    </div>
                    <div class="carousel__progress">
                        <div class="carousel__progress_bar"></div>
                        <div class="img-spinning-circle"></div>
                    </div>
                    <div class="carousel__navigation_prev"></div>
                    <div class="carousel__navigation_next"></div>
                </div>
            </my-carousel>
        `));
    }

    initCarouselElements() {
        this.$el = this.$container.querySelector('.carousel');
        this.$wrap = this.$el.querySelector('.carousel__wrap');
        this.$items = this.$el.querySelectorAll('.carousel__item');
        this.$bar = this.$el.querySelector('.carousel__progress_bar') || null;
        this.$prev = this.$el.querySelector('.carousel__navigation_prev') || null;
        this.$spinner = this.$el.querySelector('.img-spinning-circle');
        this.$next = this.$el.querySelector('.carousel__navigation_next') || null;
    }

    toggleLoadingState() {
        this.fetching = !this.fetching;
        this.$spinner.classList.toggle('active', this.fetching)
    }

    /**
     * Async method for render cards placeholder and fetch new cards chunk
     * @param startAnimationFrame default false, if true start animationFrame
     */
    async fetchNewChunk(startAnimationFrame = false) {
        this.toggleLoadingState();
        this.renderPlaceholderChunk();
        if (startAnimationFrame) {
            this.animationFrame();
        }
        let result = await this.fetchCards(this.chunkSize);
        this.renderCardChunk(result);
        this.toggleLoadingState();
    }

    renderPlaceholderChunk() {
        this.chunkSizeArray.forEach(_ => {
            let htmlElement = htmlToElement(this.placeholderHtml());
            this.$wrap.appendChild(htmlElement);
        });
        this.updateElementsAndWidths();
    }

    /**
     * Replace cards placeholder with real cards elements
     * @param cards input model from fetchCards
     */
    renderCardChunk(cards) {
        cards.forEach((card, index) => {
            let oldChild = this.$items[this.$items.length - (index + 1)];
            let newChild = htmlToElement(this.cardHtml(card));
            oldChild.parentNode.replaceChild(newChild, oldChild);
        })
        this.updateElementsAndWidths();
    }

    /**
     * Generate HTML card from cardModel
     * @param cardModel input card model
     * @returns {string} HTML string template
     */
    cardHtml(cardModel) {
        let {image, type, duration, title, cardinality} = cardModel;
        return `<div class="carousel__item">
                    <div class="card ${cardinality} ${this.hoverEffect ? 'enableHover' : ''}" >
                        <div class="wrapper__img">
                             <img class="card__img" src="${image}" alt="" width="${cardWidth()}" height="${cardWidth() * 1.5 / 3}">
                             <p class="card__text left">${type} </p>
                             <p class="card__text right">${fromSecToH(duration)}</p>
                        </div>
                         <div class="wrapper__title">
                               <h2 class="card__title">${title}</h2>
                         </div>
                    </div>
               </div>`;
    }

    /**
     * Generate card's placeholder HTML
     * @returns {string} HTML string template
     */
    placeholderHtml() {
        return `<div class="carousel__item">
                    <div class="card loading" id="placeHolder">
                        <div class="wrapper__img">
                            <svg class="card__img" width="${cardWidth()}" height="${cardWidth() * 1.5 / 3}">
                              <rect width="${cardWidth()}" height="${cardWidth() * 1.5 / 3}" />
                            </svg>
                             <p class="card__text left"></p>
                             <p class="card__text right"></p>
                        </div>
                         <div class="wrapper__title">
                               <h2 class="card__title"></h2>
                         </div>
                    </div>
                </div>`;
    }

    updateElementsAndWidths() {
        this.$wrap = this.$el.querySelector('.carousel__wrap');
        this.$items = this.$el.querySelectorAll('.carousel__item');
        this.calculateWidths();
    }

    /**
     * Calculate wrapper width and maxScroll depth, when window.resize or new fetched elements.
     */
    calculateWidths() {
        this.wrapWidth = this.$items[0].clientWidth * this.$items.length;
        this.$wrap.style.width = `${this.wrapWidth}px`;
        this.maxScroll = this.wrapWidth - this.$el.clientWidth;
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.dragging = true;
        this.startX = e.clientX || e.touches[0].clientX;
        this.$el.classList.add('dragging');
    }

    handleTouchMove(e) {
        if (!this.dragging) return false;
        const x = e.clientX || e.touches[0].clientX;
        this.progress += (this.startX - x) * 2.5;
        this.startX = x;
        this.progress = clamp(this.progress, 0, this.maxScroll);
    }

    handleTouchEnd() {
        this.dragging = false;
        this.$el.classList.remove('dragging');
    }

    handleNext() {
        if (this.progress < this.maxScroll) {
            const itemWidth = this.$items[0].clientWidth
            this.progress = this.progress + itemWidth <= this.maxScroll ? this.progress + itemWidth : this.maxScroll;
        }
    }

    handlePrev() {
        if (this.progress > 0) {
            const itemWidth = this.$items[0].clientWidth
            this.progress = this.progress - itemWidth >= 0 ? this.progress - itemWidth : 0;
        }
    }

    /**
     * Toggle navigation button, when near to the carousel end call fetchNewChunk()
     */
    toggleNavigation() {
        this.$prev.classList.toggle('disabled', this.progress < this.$items[0].clientWidth)
        this.$next.classList.toggle('disabled', this.progress >= this.maxScroll - 20)
        if (this.progress >= this.maxScroll - 20 && !this.fetching) {
            this.fetchNewChunk();
        }
    }

    addEventsListener() {
        window.addEventListener('resize', this.calculateWidths);
        if (this.draggable) {
            this.$wrap.addEventListener('touchstart', this.handleTouchStart);
            window.addEventListener('touchmove', this.handleTouchMove);
            window.addEventListener('touchend', this.handleTouchEnd);

            this.$wrap.addEventListener('mousedown', this.handleTouchStart);
            window.addEventListener('mousemove', this.handleTouchMove);
            window.addEventListener('mouseup', this.handleTouchEnd);
            document.body.addEventListener('mouseleave', this.handleTouchEnd);
        }
        this.$next.addEventListener('click', this.handleNext, {passive: true});
        this.$prev.addEventListener('click', this.handlePrev, {passive: true});
    }

    /**
     * Animation scale cards based on scroll speed.
     * Call toggleNavigation() every time
     */
    animationFrame() {
        requestAnimationFrame(this.animationFrame)
        this.x = lerp(this.x, this.progress, 0.1);
        this.playrate = this.x / this.maxScroll;

        this.$wrap.style.transform = `translateX(${-this.x}px)`;
        if (!!this.$bar) {
            this.$bar.style.transform = `scaleX(${.18 + this.playrate * .82})`;
        }

        this.speed = Math.min(100, this.oldX - this.x);
        this.oldX = this.x;

        this.scale = lerp(this.scale, this.speed, 0.1);
        this.$items.forEach(i => {
            i.style.transform = `scale(${1 - Math.abs(this.speed) * 0.002})`;
            // Placeholder have a rectangle svg element instead of img
            (i.querySelector('img') || i.querySelector('svg')).style.transform = `scaleX(${1 + Math.abs(this.speed) * 0.004})`;
        });
        this.toggleNavigation();
    }
}
