import { locations } from "./js/locations.js";
import { showSection, showLocationDetail } from "./js/sectionManager.js";
import { initDoorStory } from "./js/storyNavigation.js";

import {
  getMarkerIcon,
  updateVisibleMarkers,
  navigateCarousel,
} from "./js/map.js";

document.addEventListener("DOMContentLoaded", () => {
  const app = {
    map: null,
    currentLocationIndex: 0,
    currentInfoIndex: 0,
    progress: 0,
    isFlying: false,

    /**
     * Initializes the application, binds events, and sets the initial view.
     * @function
     */
    init() {
      this.bindEvents();
      showSection("home");
      this.initLazyLoading();
    },

    /**
     * Calculates the translation values needed to position the highlighted area.
     * @function
     * @param {HTMLElement} highlightArea - The HTML element representing the highlighted area.
     * @param {HTMLElement} container - The container element that holds the image.
     * @returns {Object} The translation values for the X and Y axes.
     */
    highlightImageArea() {
      const detailImage = document.querySelector(".detail-image");
      const highlightArea = document.querySelector(".highlight-area");
      highlightArea.innerHTML = "";

      const currentLocation = locations[this.currentLocationIndex];

      if (
        !currentLocation.highlightAreas ||
        currentLocation.highlightAreas.length === 0
      ) {
        console.warn(
          "Keine highlightAreas für die aktuelle Location definiert."
        );
        return;
      }

      const highlightIndex =
        this.currentInfoIndex % currentLocation.highlightAreas.length;
      const currentHighlightArea =
        currentLocation.highlightAreas[highlightIndex];

      detailImage.style.filter = "grayscale(100%)";

      const scaleFactor = 2.5;
      detailImage.style.transform = `scale(${scaleFactor}) translate(${
        this.calculateTranslate(currentHighlightArea).translateX
      }%, ${this.calculateTranslate(currentHighlightArea).translateY}%)`;
      detailImage.style.transformOrigin = "center center";

      const highlight = document.createElement("div");
      highlight.className = "highlight-area-focus";
      Object.assign(highlight.style, {
        top: currentHighlightArea.top,
        left: currentHighlightArea.left,
        width: currentHighlightArea.width,
        height: currentHighlightArea.height,
        position: "absolute",
        backgroundColor: "transparent",
        border: "2px solid var(--primary-color)",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
        transition: "all 0.5s ease-in-out",
        opacity: "0",
      });

      const colorArea = document.createElement("div");
      colorArea.className = "color-area";
      Object.assign(colorArea.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
        mixBlendMode: "normal",
        clipPath: `inset(0 0 0 0)`,
        transition: "all 1s ease-in-out",
      });

      highlightArea.appendChild(highlight);
      highlight.appendChild(colorArea);

      requestAnimationFrame(() => {
        highlight.style.opacity = "1";

        const clipTop = currentHighlightArea.top;
        const clipRight =
          100 -
          parseFloat(currentHighlightArea.left) -
          parseFloat(currentHighlightArea.width);
        const clipBottom =
          100 -
          parseFloat(currentHighlightArea.height) -
          parseFloat(currentHighlightArea.top);
        const clipLeft = parseFloat(currentHighlightArea.left);
        colorArea.style.clipPath = `inset(${clipTop} ${clipRight}% ${clipBottom}% ${clipLeft}%)`;
      });
    },

    calculateTranslate(highlightArea, container) {
      const highlightRect = highlightArea.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const centerX = highlightRect.left + highlightRect.width / 2;
      const centerY = highlightRect.top + highlightRect.height / 2;

      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height / 2;

      const translateX =
        (containerCenterX - centerX) /
        (containerRect.width / highlightRect.width);
      const translateY =
        (containerCenterY - centerY) /
        (containerRect.height / highlightRect.height);

      return { translateX, translateY };
    },

    /**
     * Resets the image and highlight area to their original state.
     * @function
     */
    resetDetailImage() {
      const detailImage = document.querySelector(".detail-image");
      const highlightArea = document.querySelector(".highlight-area");

      detailImage.style.filter = "none";
      detailImage.style.transform = "scale(1) translate(0%, 0%)";
      detailImage.style.transition = "none";

      highlightArea.innerHTML = "";
    },

    /**
     * Binds all event listeners for user interactions, including clicks, keyboard events, and others.
     * @function
     */
    bindEvents() {
      document.querySelectorAll(".start-tour").forEach((button) => {
        button.addEventListener("click", () => {
          showSection("map");
        });
      });

      const continueBtn = document.getElementById("continue-btn");
      if (continueBtn) {
        continueBtn.style.display = "none";
        continueBtn.style.pointerEvents = "none";
      }

      document.addEventListener("DOMContentLoaded", () => {
        const googleMapsLink = document.getElementById("google-maps-link");
        if (googleMapsLink) {
          googleMapsLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.currentTarget.href) {
              window.open(e.currentTarget.href, "_blank");
            }
          });
        }
      });

      document.querySelector(".home-btn").addEventListener("click", () => {
        if (this.map) {
          this.map.remove();
          this.map = null;
        }

        this.markers = {};

        const header = document.querySelector(".app-header");
        if (header) {
          header.style.display = "block";
        }

        showSection("home");
      });

      document.querySelectorAll(".start-tour").forEach((button) => {
        button.addEventListener("click", () => showSection("map"));
      });
      document.addEventListener("click", (e) => {
        if (e.target.closest("#home-btn")) {
          if (this.currentSection === "location-detail") {
            if (this.activeStoryContainer) {
              this.activeStoryContainer.remove();
              this.activeStoryContainer = null;
            }

            const locationDetail = document.getElementById("location-detail");
            if (locationDetail) {
              locationDetail.style.opacity = "0";
            }

            showSection("map");

            this.currentLocationIndex = 0;
            this.currentInfoIndex = 0;
            this.progress = 0;

            if (this.map) {
              this.map.invalidateSize();
              updateVisibleMarkers();
            }
          }
        }
      });

      document.getElementById("continue-btn").addEventListener("click", () => {
        const locationTitle =
          document.getElementById("location-title").textContent;
        const storyStates = locationTitle.includes("Rechte")
          ? this.rightDoorStoryStates
          : this.leftDoorStoryStates;

        const locationDetail = document.getElementById("location-detail");
        locationDetail.style.opacity = "0";

        setTimeout(() => {
          locationDetail.style.display = "none";
          const storyContainer = initDoorStory(storyStates);
          document.body.appendChild(storyContainer);

          requestAnimationFrame(() => {
            storyContainer.style.opacity = "1";
          });
        }, 500);
      });

      document
        .getElementById("back-to-map")
        .addEventListener("click", () => showSection("map"));

      const leftDoor = document.querySelector(".left-door");
      const rightDoor = document.querySelector(".right-door");

      if (leftDoor && rightDoor) {
        leftDoor.addEventListener("click", () => showLocationDetail(1));
        rightDoor.addEventListener("click", () => showLocationDetail(2));
      }

      document.querySelectorAll(".storyline-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          const storyline = e.currentTarget.dataset.storyline;
          this.selectStoryline(storyline);
        });
      });

      document.getElementById("prev-btn").addEventListener("click", () => {
        if (this.activeStoryContainer) {
          this.navigateLocation(-1);
        }
      });

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) {
        document
          .querySelectorAll(
            ".animate-fade-in, .animate-slide-in-right, .animate-slide-in-left, .animate-zoom-in"
          )
          .forEach((element) => {
            element.style.animation = "none";
          });
      }

      const detailImageContainer = document.querySelector(
        ".detail-image-container"
      );
      if (detailImageContainer) {
        detailImageContainer.addEventListener(
          "wheel",
          (e) => this.handleDetailScroll(e),
          { passive: true }
        );
      }

      document.addEventListener("keydown", (e) => {
        switch (e.key) {
          case "ArrowLeft":
            if (this.isDetailView) {
              this.showPreviousInfo();
            } else {
              navigateCarousel(-1);
            }
            break;
          case "ArrowRight":
            if (this.isDetailView) {
              this.showNextInfo();
            } else {
              navigateCarousel(1);
            }
            break;
          case "Escape":
            if (this.isDetailView) {
              showSection("map");
            }
            break;
        }
      });
    },

    /**
     * Highlights the current location card in the carousel.
     * @function
     */
    highlightCurrentCard() {
      const allCards = document.querySelectorAll(".location-card");
      allCards.forEach((card) => card.classList.remove("highlighted"));

      const currentCard = carouselCards[locations[this.currentCardIndex].id];
      if (currentCard) {
        currentCard.classList.add("highlighted");
      }
    },

    /**
     * Navigates through the content (e.g., storylines, location details) based on the direction.
     * @function
     * @param {number} direction - The direction to navigate (-1 for previous, 1 for next).
     */
    navigateContent(direction) {
      const storyContainer = document.querySelector(".door-story-container");

      if (storyContainer) {
        const storyStates = locations[this.currentLocationIndex].name.includes(
          "Rechte"
        )
          ? this.rightDoorStoryStates
          : this.leftDoorStoryStates;

        this.currentStoryIndex = (this.currentStoryIndex || 0) + direction;
        if (
          this.currentStoryIndex >= 0 &&
          this.currentStoryIndex < storyStates.length
        ) {
          this.updateStoryView(storyStates[this.currentStoryIndex]);
        }
      } else {
        if (direction > 0) {
          const locationDetail = document.getElementById("location-detail");
          locationDetail.style.opacity = "0";

          setTimeout(() => {
            locationDetail.style.display = "none";
            const storyStates = locations[
              this.currentLocationIndex
            ].name.includes("Rechte")
              ? this.rightDoorStoryStates
              : this.leftDoorStoryStates;
            const storyContainer = initDoorStory(storyStates);
            document.body.appendChild(storyContainer);
            requestAnimationFrame(() => {
              storyContainer.style.opacity = "1";
            });
          }, 500);
        }
      }
    },

    /**
     * Navigates to the next or previous location in the tour.
     * @function
     * @param {number} direction - The direction to navigate (-1 for previous, 1 for next).
     */
    navigateLocation(direction) {
      this.currentLocationIndex += direction;
      if (this.currentLocationIndex < 0)
        this.currentLocationIndex = locations.length - 1;
      if (this.currentLocationIndex >= locations.length)
        this.currentLocationIndex = 0;

      this.currentStoryIndex = 0;
      showLocationDetail(locations[this.currentLocationIndex].id);
    },

    /**
     * Updates the information text on the location detail page.
     * @function
     */
    updateInfoText() {
      const location = locations[this.currentLocationIndex];
      if (!location || !location.info) return;

      const infoContainer = document.getElementById("info-container");
      if (!infoContainer) return;

      infoContainer.innerHTML = "";
      this.typewriterEffect(
        location.info[this.currentInfoIndex],
        infoContainer
      );
    },

    /**
     * Displays the next information block for the current location.
     * @function
     */
    showNextInfo() {
      const location = locations[this.currentLocationIndex];
      if (!location || !location.info) return;

      if (this.currentInfoIndex < location.info.length - 1) {
        this.currentInfoIndex++;
        this.progress += 100 / location.info.length;
        this.updateProgressBar();
        this.updateInfoText();
        this.highlightImageArea();
      } else {
        this.completeLocation();
      }
    },

    /**
     * Displays the previous information block for the current location.
     * @function
     */
    showPreviousInfo() {
      const location = locations[this.currentLocationIndex];
      if (!location || !location.info) return;

      if (this.currentInfoIndex > 0) {
        this.currentInfoIndex--;
        this.progress -= 100 / location.info.length;
        this.updateProgressBar();
        this.updateInfoText();
        this.highlightImageArea();
      }
    },

    /**
     * Marks the current location as completed and shows a congratulations message.
     * @function
     */
    completeLocation() {
      const location = locations[this.currentLocationIndex];
      if (!location) return;

      location.visited = true;

      if (location.card) {
        location.card.classList.add("visited");
      }
      if (location.marker) {
        location.marker.setIcon(
          getMarkerIcon(location.category, location.visited)
        );
      }

      const infoContainer = document.getElementById("info-container");
      if (infoContainer) {
        const congratsMessage = document.createElement("div");
        congratsMessage.className = "congratulations animate-fade-in";
        congratsMessage.textContent =
          "Glückwunsch! Sie haben alle Informationen zu diesem Ort entdeckt.";
        infoContainer.appendChild(congratsMessage);
      }

      const continueBtn = document.getElementById("continue-btn");
      if (continueBtn) {
        continueBtn.style.display = "none";
      }

      const backToMapBtn = document.getElementById("back-to-map");
      if (backToMapBtn) {
        backToMapBtn.style.display = "block";
      }
    },

    /**
     * Updates the progress bar to reflect the current progress.
     * @function
     */
    updateProgressBar() {
      const progressBarFill = document.querySelector(".progress-bar-fill");
      if (progressBarFill) {
        progressBarFill.style.width = `${this.progress}%`;
      }
    },

    navigateLocation(direction) {
      const currentLocation = locations[this.currentLocationIndex];
      const storyStates = currentLocation.name.includes("Rechte")
        ? this.rightDoorStoryStates
        : this.leftDoorStoryStates;

      if (this.activeStoryContainer) {
        this.activeStoryContainer.remove();
      }

      this.currentLocationIndex += direction;
      if (this.currentLocationIndex < 0)
        this.currentLocationIndex = locations.length - 1;
      if (this.currentLocationIndex >= locations.length)
        this.currentLocationIndex = 0;

      showLocationDetail(locations[this.currentLocationIndex].id);
    },

    /**
     * Shows the next detail area for the current location.
     * @function
     */
    showNextDetailArea() {
      const location = locations[this.currentLocationIndex];
      if (location.info && this.currentInfoIndex < location.info.length - 1) {
        this.currentInfoIndex++;
        this.progress += 100 / location.info.length;
        this.updateProgressBar();
        this.updateInfoText();
        this.highlightImageArea();
      }
    },

    /**
     * Shows the previous detail area for the current location.
     * @function
     */
    showPreviousDetailArea() {
      const location = locations[this.currentLocationIndex];
      if (location.info && this.currentInfoIndex > 0) {
        this.currentInfoIndex--;
        this.progress -= 100 / location.info.length;
        this.updateProgressBar();
        this.updateInfoText();
        this.highlightImageArea();
      }
    },

    /**
     * Initializes lazy loading for images on the page.
     * @function
     */
    initLazyLoading() {
      const images = document.querySelectorAll("img[data-src]");
      const options = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      };

      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
            imageObserver.unobserve(img);
          }
        });
      }, options);

      images.forEach((img) => imageObserver.observe(img));
    },
  };

  app.init();
});

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".app-header");
  const mapElement = document.getElementById("map");

  if (mapElement) {
    const observer = new MutationObserver(() => {
      if (mapElement.classList.contains("active")) {
        if (header) {
          header.style.display = "none";
        }
      } else {
        if (header) {
          header.style.display = "block";
        }
      }
    });

    observer.observe(mapElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const locationDetail = document.getElementById("location-detail");
  const header = document.querySelector("header");

  /**
   * Toggles the visibility of the app header based on the map view.
   * @function
   */
  const toggleHeaderVisibility = () => {
    if (locationDetail.classList.contains("active")) {
      header.style.display = "none";
    } else {
      header.style.display = "";
    }
  };

  const observer = new MutationObserver(toggleHeaderVisibility);
  observer.observe(locationDetail, {
    attributes: true,
    attributeFilter: ["class"],
  });

  toggleHeaderVisibility();
});

document.addEventListener("DOMContentLoaded", () => {
  /**
   * Disables location cards that should not be accessible based on the user's progress.
   * @function
   */
  const disableCards = () => {
    document.querySelectorAll(".location-card").forEach((card) => {
      const locationId = parseInt(card.getAttribute("data-location-id"), 10);
      if (locationId >= 5 && !card.classList.contains("disabled")) {
        card.classList.add("disabled");
      }
    });
  };

  const startTourButtons = document.querySelectorAll(".start-tour");
  startTourButtons.forEach((button) => {
    button.addEventListener("click", () => {
      disableCards();
    });
  });
});
