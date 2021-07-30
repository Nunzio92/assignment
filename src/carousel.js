import {fromSecToH, htmlToElement} from "./utility/utility.js";

const lerp = (f0, f1, t) => (1 - t) * f0 + t * f1
const clamp = (val, min, max) => Math.max(min, Math.min(val, max))
const cardWidth = () => document.documentElement.clientWidth * 0.19 < 220 ? 220 : document.documentElement.clientWidth;


export class Carousel {
    constructor(obj) {
        this.$container = document.querySelector(obj.container);
        this.chunkSize = 6;
        this.chunkSizeArray = Array.from({length: this.chunkSize});
        this.draggable = obj.draggable ?? true;         // drag can be deactivated through carousel config
        this.title = obj.title;
        this.subtitle = obj.subtitle;
        this.fetchCards = obj.fetchCards;
        this.hoverEffect = obj.hoverEffect ?? false;

        this.init();
    }

    init() {
        // init progress variable
        this.progress = 0;
        this.speed = 0;
        this.oldX = 0;
        this.x = 0;
        this.playrate = 0;
        this.fetching = false;
        // init method
        this.bindings()
        this.renderCarousel();
        this.initCarouselElements();
        this.fetchNewChunk();

        this.events();
        this.animationFrame();
    }

    bindings() {
        [
            'changeLoadingState',
            'fetchNewChunk',
            'renderPlaceholderChunk',
            'renderCardChunk',
            'initCarouselElements',
            'cardHtml',
            'placeholderHtml',
            'renderCarousel',
            'update',
            'events',
            'calculate',
            'move',
            'handleFetchAndNav',
            'handleTouchStart',
            'handleTouchMove',
            'handleTouchEnd',
            'handleNext',
            'handlePrev',
            'animationFrame'
        ].forEach(i => {
            this[i] = this[i].bind(this);
        })
    }

    renderCarousel() {
        this.$container.appendChild(htmlToElement(`
            <my-carousel>
                <div class="row carousel__info">
                    <div class="col carousel__info_icon"><span class="material-icons">lightbulb</span></div>
                    <div class="col">
                        <h1 class="carousel__info_title">${this.title}</h1> 
                        <h3 class="carousel__info_subtitle">${this.subtitle}</h3>
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

    changeLoadingState(){
        this.fetching = !this.fetching;
        if (this.fetching){
            this.$spinner.classList.add('active');
        } else {
            this.$spinner.classList.remove('active');
        }
    }

    fetchNewChunk() {
        this.changeLoadingState();
        this.renderPlaceholderChunk();
        this.fetchCards(this.chunkSize).then(result => {
            this.renderCardChunk(result);
            this.update();
            this.changeLoadingState();
        })
    }

    renderPlaceholderChunk(){
        this.chunkSizeArray.forEach(_ => {
            let htmlElement = htmlToElement(this.placeholderHtml());
            this.$wrap.appendChild(htmlElement);
            this.update();
        });
    }

    renderCardChunk(cards) {
        cards.forEach((card, index) => {
            let oldChild = this.$items[this.$items.length - (index + 1)];
            let newChild = htmlToElement(this.cardHtml(card))
            oldChild.parentNode.replaceChild(newChild, oldChild)
        })
    }

    cardHtml(card) {
        let {image, type, duration, title, cardinality} = card;
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

    update() {
        this.$wrap = this.$el.querySelector('.carousel__wrap');
        this.$items = this.$el.querySelectorAll('.carousel__item');
        this.calculate(this.progress);
    }

    calculate() {
        this.progress = this.progress || 0;
        this.wrapWidth = this.$items[0].clientWidth * this.$items.length;
        this.$wrap.style.width = `${this.wrapWidth}px`;
        this.maxScroll = this.wrapWidth - this.$el.clientWidth;
        this.handleFetchAndNav();
    }

    handleTouchStart(e) {
        e.preventDefault()
        this.dragging = true;
        this.startX = e.clientX || e.touches[0].clientX;
        this.$el.classList.add('dragging');
    }

    handleTouchMove(e) {
        if (!this.dragging) return false;
        const x = e.clientX || e.touches[0].clientX;
        this.progress += (this.startX - x) * 2.5;
        this.startX = x;
        this.move();
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

    move() {
        this.progress = clamp(this.progress, 0, this.maxScroll);
    }

    handleFetchAndNav() {
        if (this.progress < this.$items[0].clientWidth) {
            this.$prev.classList.add('disabled');
        } else {
            this.$prev.classList.remove('disabled');
        }
        if (this.progress >= this.maxScroll - 20) {
            this.$next.classList.add('disabled');
            if (!this.fetching){
                this.fetchNewChunk();
            }
        } else {
            this.$next.classList.remove('disabled');
        }
    }

    events() {
        window.addEventListener('resize', this.calculate);

        if (this.draggable) {
            this.$wrap.addEventListener('touchstart', this.handleTouchStart);
            window.addEventListener('touchmove', this.handleTouchMove);
            window.addEventListener('touchend', this.handleTouchEnd);

            this.$wrap.addEventListener('mousedown', this.handleTouchStart);
            window.addEventListener('mousemove', this.handleTouchMove);
            window.addEventListener('mouseup', this.handleTouchEnd);
            document.body.addEventListener('mouseleave', this.handleTouchEnd);
        }
        this.$next.addEventListener('click', this.handleNext);
        this.$prev.addEventListener('click', this.handlePrev);
    }

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
            (i.querySelector('img') || i.querySelector('svg')).style.transform = `scaleX(${1 + Math.abs(this.speed) * 0.004})`;
        });
        this.handleFetchAndNav();
    }


}


