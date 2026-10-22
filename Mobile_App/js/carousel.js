/* ==============================================================================
   5-SLIDE DYNAMIC HERO CAROUSEL ENGINE WITH 4-BOX INTERACTIVE HUB
   ============================================================================== */

class HeroCarousel {
  constructor() {
    this.currentSlide = 0;
    this.totalSlides = 5;
    this.autoPlayDuration = 5500; // 5.5s
    this.timer = null;
    this.progressInterval = null;
    this.progress = 0;
    this.isPaused = false;
    this.init();
  }

  init() {
    this.slides = document.querySelectorAll(".carousel-slide");
    this.indicators = document.querySelectorAll(".indicator-pill");
    this.progressBar = document.querySelector(".carousel-progress-bar");
    this.prevBtn = document.querySelector(".carousel-btn-prev");
    this.nextBtn = document.querySelector(".carousel-btn-next");
    this.carouselSection = document.querySelector(".hero-carousel-section");

    if (!this.slides.length) return;

    // Chevrons
    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", () => this.next());
    }

    // Indicator pills
    this.indicators.forEach((pill, idx) => {
      pill.addEventListener("click", () => this.goTo(idx));
    });

    // Pause on hover
    if (this.carouselSection) {
      this.carouselSection.addEventListener("mouseenter", () => {
        this.isPaused = true;
      });
      this.carouselSection.addEventListener("mouseleave", () => {
        this.isPaused = false;
      });
    }

    // Interactive Hub Box clicks on Slide 1
    this.setupHubBoxes();

    // Start Auto Play
    this.startAutoPlay();
  }

  setupHubBoxes() {
    const boxKalawar = document.getElementById("box-kalawar");
    const boxGym = document.getElementById("box-gym");
    const boxAcademy = document.getElementById("box-academy");
    const boxMedia = document.getElementById("box-media");

    if (boxKalawar) {
      boxKalawar.addEventListener("click", () => {
        // First box opens the actual full-fledged Kalawar website
        window.open("http://localhost:3000", "_blank");
        window.showToast("Opening Kalawar National Federation Website...", "info");
      });
    }

    if (boxGym) {
      boxGym.addEventListener("click", () => {
        window.AppState.setView("gym");
        window.scrollTo({ top: 580, behavior: "smooth" });
      });
    }

    if (boxAcademy) {
      boxAcademy.addEventListener("click", () => {
        window.AppState.setView("academy");
        window.scrollTo({ top: 580, behavior: "smooth" });
      });
    }

    if (boxMedia) {
      boxMedia.addEventListener("click", () => {
        window.AppState.setView("media");
        window.scrollTo({ top: 580, behavior: "smooth" });
      });
    }
  }

  goTo(index) {
    if (index === this.currentSlide) return;
    this.slides[this.currentSlide].classList.remove("active");
    this.indicators[this.currentSlide].classList.remove("active");

    this.currentSlide = (index + this.totalSlides) % this.totalSlides;

    this.slides[this.currentSlide].classList.add("active");
    this.indicators[this.currentSlide].classList.add("active");

    this.resetTimer();
  }

  next() {
    this.goTo(this.currentSlide + 1);
  }

  prev() {
    this.goTo(this.currentSlide - 1);
  }

  startAutoPlay() {
    this.resetTimer();
  }

  resetTimer() {
    clearInterval(this.progressInterval);
    this.progress = 0;
    if (this.progressBar) this.progressBar.style.width = "0%";

    const stepMs = 50;
    const increment = (stepMs / this.autoPlayDuration) * 100;

    this.progressInterval = setInterval(() => {
      if (!this.isPaused) {
        this.progress += increment;
        if (this.progressBar) {
          this.progressBar.style.width = `${Math.min(this.progress, 100)}%`;
        }
        if (this.progress >= 100) {
          this.next();
        }
      }
    }, stepMs);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.HeroCarouselInstance = new HeroCarousel();
});
