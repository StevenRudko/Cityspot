import { showSection } from "./sectionManager.js";

let showSectionactiveStoryContainer = 0;

/**
 * Initializes and displays the interactive story component.
 *
 * @param {Array<Object>} storyStates - An array of story state objects.
 * @param {string} storyStates[].image - The image URL for the story slide.
 * @param {string} storyStates[].title - The title of the story slide.
 * @param {string} storyStates[].description - The description for the story slide.
 * @param {Object} [storyStates[].zoom] - Optional zoom settings for the story image.
 * @param {number} [storyStates[].zoom.scale] - The scale factor for zooming the story image.
 * @param {string} [storyStates[].zoom.x] - Horizontal translation for zoomed image.
 * @param {string} [storyStates[].zoom.y] - Vertical translation for zoomed image.
 * @param {string} [storyStates[].height] - Optional custom height for the story slide.
 *
 * @returns {HTMLElement} The story container element.
 */
export function initDoorStory(storyStates) {
  if (showSectionactiveStoryContainer) {
    showSectionactiveStoryContainer.remove();
    showSectionactiveStoryContainer = null;
  }

  const storyContainer = document.createElement("div");
  storyContainer.className = "door-story-container";
  storyContainer.style.opacity = "0";

  showSectionactiveStoryContainer = storyContainer;

  const progressBar = document.createElement("div");
  progressBar.className = "story-progress-bar";
  const progressFill = document.createElement("div");
  progressFill.className = "story-progress-fill";
  progressBar.appendChild(progressFill);
  storyContainer.appendChild(progressBar);

  let currentStoryIndex = 0;
  let isTransitioning = false;
  let touchStartX = 0;
  let touchStartY = 0;

  /**
   * Updates the progress bar to reflect the current slide position.
   *
   * @private
   */
  const updateProgress = () => {
    const progress = (currentStoryIndex / (storyStates.length - 1)) * 100;
    progressFill.style.width = `${progress}%`;
  };

  storyContainer.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  storyContainer.addEventListener("touchend", (e) => {
    if (isTransitioning) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 50) {
        if (currentStoryIndex === 0) {
          isTransitioning = true;

          const locationDetail = document.getElementById("location-detail");
          if (!locationDetail) {
            isTransitioning = false;
            return;
          }

          locationDetail.style.transition = "none";
          storyContainer.style.transition = "none";

          locationDetail.style.display = "block";
          locationDetail.style.transform = "translateX(-100%)";
          locationDetail.style.opacity = "0";

          locationDetail.offsetHeight;

          locationDetail.style.transition = "all 0.3s ease-out";
          storyContainer.style.transition = "all 0.3s ease-out";

          locationDetail.style.transform = "translateX(0)";
          locationDetail.style.opacity = "1";
          storyContainer.style.transform = "translateX(100%)";

          setTimeout(() => {
            if (storyContainer && storyContainer.parentNode) {
              storyContainer.remove();
            }
            showSectionactiveStoryContainer = null;
            isTransitioning = false;
          }, 300);
        } else {
          navigateStory(-1);
        }
      } else if (deltaX < -50) {
        navigateStory(1);
      }
    }
  });

  /**
   * Creates the HTML structure for a single story slide based on the current slide's state.
   *
   * @returns {string} The HTML markup for the current story slide.
   * @private
   */
  const createStorySlide = () => {
    const story = storyStates[currentStoryIndex];
    const isLastSlide = currentStoryIndex === storyStates.length - 1;

    const imageStyles = `
            background-image: url('images/${story.image}');
            transform: scale(${story.zoom?.scale || 1}) translate(${
      story.zoom?.x || "0"
    }, ${story.zoom?.y || "0"});
            height: ${story.height || "100%"};
            background-size: cover;
            background-position: center;
            transition: all 1s ease;
          `;

    return `
            <div class="story-slide">
              <div class="story-image" style="${imageStyles}"></div>
              <div class="detail-info">
                <div class="details">
                  <h2 class="story-title">${story.title}</h2>
                  <h3 class="story-subtitle">${story.description}</h3>
                  ${
                    isLastSlide
                      ? '<button class="back-to-map-button">Zurück zur Karte</button>'
                      : ""
                  }
                </div>
                </div>
                <div class="navigation-controls">
                  <button class="nav-btn prev-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256">
                      <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
                    </svg>
                  </button>
                  <button class="nav-btn home-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#0a0a0a" viewBox="0 0 256 256">
                      <path d="M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z"></path>
                    </svg>
                  </button>
                  <button class="nav-btn next-btn" ${
                    isLastSlide ? "disabled" : ""
                  }>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256">
                      <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                    </svg>
                  </button>
                </div>
            </div>
          `;
  };

  /**
   * Updates the state of navigation buttons (prev/next) to reflect the current story position.
   *
   * @private
   */
  const updateNavigationButtons = () => {
    const prevBtn = storyContainer.querySelector(".prev-btn");
    const nextBtn = storyContainer.querySelector(".next-btn");

    if (prevBtn) {
      prevBtn.disabled = false;
      prevBtn.style.opacity = "1";
      prevBtn.querySelector("path").style.fill = "#000000";
    }

    if (nextBtn) {
      if (currentStoryIndex === storyStates.length - 1) {
        nextBtn.disabled = true;
        nextBtn.style.opacity = "0.5";
        nextBtn.querySelector("path").style.fill = "#cccccc";
      } else {
        nextBtn.disabled = false;
        nextBtn.style.opacity = "1";
        nextBtn.querySelector("path").style.fill = "#000000";
      }
    }
  };

  /**
   * Navigates to the next or previous story slide based on the given direction.
   *
   * @param {number} direction - The direction to navigate: -1 for previous, 1 for next.
   * @private
   */
  const navigateStory = (direction) => {
    if (isTransitioning) return;

    const newIndex = currentStoryIndex + direction;
    if (newIndex >= 0 && newIndex < storyStates.length) {
      isTransitioning = true;

      const currentSlide = storyContainer.querySelector(".story-slide");
      const currentImage = currentSlide.querySelector(".story-image");
      const detailInfo = currentSlide.querySelector(".detail-info");

      detailInfo.style.opacity = "0";

      setTimeout(() => {
        currentStoryIndex = newIndex;
        const nextStory = storyStates[newIndex];
        const prevStory = storyStates[currentStoryIndex - direction];

        updateNavigationButtons();

        const isSameImage = prevStory && prevStory.image === nextStory.image;

        if (isSameImage) {
          currentImage.style.transform = `scale(${
            nextStory.zoom?.scale || 1
          }) translate(${nextStory.zoom?.x || "0"}, ${
            nextStory.zoom?.y || "0"
          })`;
          if (nextStory.height) {
            currentImage.style.height = nextStory.height;
          }

          const details = detailInfo.querySelector(".details");
          if (details) {
            const isLastSlide = newIndex === storyStates.length - 1;
            details.innerHTML = `
                      <h2 class="story-title">${nextStory.title}</h2>
                      <h3 class="story-subtitle">${nextStory.description}</h3>
                      ${
                        isLastSlide
                          ? '<button class="back-to-map-button">Zurück zur Karte</button>'
                          : ""
                      }
                    `;

            if (isLastSlide) {
              const backToMapBtn = details.querySelector(".back-to-map-button");
              if (backToMapBtn) {
                backToMapBtn.addEventListener("click", () => {
                  storyContainer.remove();
                  showSectionactiveStoryContainer = null;
                  showSection("map");
                });
              }
            }
          }
          detailInfo.style.opacity = "1";
        } else {
          const preloadImage = new Image();
          preloadImage.src = `images/${nextStory.image}`;

          const details = detailInfo.querySelector(".details");
          if (details) {
            details.innerHTML = `
                    <h2 class="story-title">${nextStory.title}</h2>
                    <h3 class="story-subtitle">${nextStory.description}</h3>
                  `;
            detailInfo.style.opacity = "1";
          }

          const newSlide = document.createElement("div");
          newSlide.className = "story-slide";
          newSlide.style.position = "absolute";
          newSlide.style.top = "0";
          newSlide.style.left = "0";
          newSlide.style.width = "100%";
          newSlide.style.height = "100%";
          newSlide.style.opacity = "0";
          newSlide.style.transition = "opacity 0.8s ease";

          preloadImage.onload = () => {
            const isLastSlide = newIndex === storyStates.length - 1;
            newSlide.innerHTML = `
    <div class="story-image" style="
      background-image: url('images/${nextStory.image}');
      transform: scale(${nextStory.zoom?.scale || 1}) translate(${
              nextStory.zoom?.x || "0"
            }, ${nextStory.zoom?.y || "0"});
      height: ${nextStory.height || "100%"};
      background-size: cover;
      background-position: center;
      transition: all 1s ease;
    "></div>
    <div class="detail-info">
      <div class="details">
        <h2 class="story-title">${nextStory.title}</h2>
        <h3 class="story-subtitle">${nextStory.description}</h3>
        ${
          isLastSlide
            ? '<button class="back-to-map-button">Zurück zur Karte</button>'
            : ""
        }
      </div>
      </div>
      <div class="navigation-controls">
        <button class="nav-btn prev-btn" ${
          currentStoryIndex === 0 ? "disabled" : ""
        }>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256">
            <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path>
          </svg>
        </button>
        <button class="nav-btn home-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#0a0a0a" viewBox="0 0 256 256">
                                          <path d="M228.92,49.69a8,8,0,0,0-6.86-1.45L160.93,63.52,99.58,32.84a8,8,0,0,0-5.52-.6l-64,16A8,8,0,0,0,24,56V200a8,8,0,0,0,9.94,7.76l61.13-15.28,61.35,30.68A8.15,8.15,0,0,0,160,224a8,8,0,0,0,1.94-.24l64-16A8,8,0,0,0,232,200V56A8,8,0,0,0,228.92,49.69ZM104,52.94l48,24V203.06l-48-24ZM40,62.25l48-12v127.5l-48,12Zm176,131.5-48,12V78.25l48-12Z">
                                          </path>
                                      </svg>
        </button>
        <button class="nav-btn next-btn" ${isLastSlide ? "disabled" : ""}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256">
            <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
          </svg>
        </button>
      </div>
    `;

            storyContainer.appendChild(newSlide);

            requestAnimationFrame(() => {
              currentSlide.style.transition = "opacity 0.8s ease";
              currentSlide.style.opacity = "0";

              setTimeout(() => {
                newSlide.style.opacity = "1";
              }, 50);

              setTimeout(() => {
                currentSlide.remove();
                setupEventListeners();
              }, 800);
            });
          };

          preloadImage.onerror = () => {
            console.error("Fehler beim Laden des Bildes:", nextStory.image);
            isTransitioning = false;
          };
        }

        updateProgress();
        setTimeout(() => {
          isTransitioning = false;
        }, 800);
      }, 300);
    }
  };

  /**
   * Sets up event listeners for user interactions including button clicks and touch gestures.
   *
   * @private
   */
  const setupEventListeners = () => {
    const prevBtn = storyContainer.querySelector(".prev-btn");
    const nextBtn = storyContainer.querySelector(".next-btn");
    const homeBtn = storyContainer.querySelector(".home-btn");
    const backToMapBtn = storyContainer.querySelector(".back-to-map-button");

    /**
     * Handles forward navigation when the user progresses through the story.
     *
     * This function manages transitions when switching between slides or exiting to the map view.
     *
     * @private
     */
    const handleForwardNavigation = () => {
      if (isTransitioning) return;

      const locationDetail = document.getElementById("location-detail");
      if (locationDetail && locationDetail.style.display !== "none") {
        isTransitioning = true;

        locationDetail.style.opacity = "0";
        locationDetail.style.transform = "translateX(-100%)";

        storyContainer.style.transform = "translateX(0)";
        storyContainer.style.opacity = "1";

        setTimeout(() => {
          locationDetail.style.display = "none";
          isTransitioning = false;
        }, 300);
      } else {
        navigateStory(1);
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (currentStoryIndex === 0) {
          const locationDetail = document.getElementById("location-detail");
          if (locationDetail) {
            locationDetail.style.display = "block";
            locationDetail.style.opacity = "0";
            locationDetail.style.transform = "translateX(-100%)";

            requestAnimationFrame(() => {
              locationDetail.style.transition = "all 0.3s ease-out";
              locationDetail.style.transform = "translateX(0)";
              locationDetail.style.opacity = "1";

              if (storyContainer) {
                storyContainer.style.transition = "all 0.3s ease-out";
                storyContainer.style.transform = "translateX(100%)";
                storyContainer.style.opacity = "0";
              }
            });

            setTimeout(() => {
              if (storyContainer && storyContainer.parentNode) {
                storyContainer.remove();
              }
              showSectionactiveStoryContainer = null;
            }, 300);
          }
        } else {
          navigateStory(-1);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        handleForwardNavigation();
      });
    }

    if (homeBtn) {
      homeBtn.addEventListener("click", () => {
        storyContainer.remove();
        showSectionactiveStoryContainer = null;
        showSection("map");
      });
    }

    if (backToMapBtn) {
      backToMapBtn.addEventListener("click", () => {
        storyContainer.style.transition = "opacity 0.3s ease-out";
        storyContainer.style.opacity = "0";

        setTimeout(() => {
          if (storyContainer && storyContainer.parentNode) {
            storyContainer.remove();
          }
          showSectionactiveStoryContainer = null;

          showSection("map");
        }, 300);
      });
    }

    let touchStartX = 0;
    let touchStartY = 0;

    storyContainer.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    storyContainer.addEventListener(
      "touchend",
      (e) => {
        if (isTransitioning) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 50 && currentStoryIndex === 0) {
            prevBtn.click();
          } else if (deltaX > 50) {
            navigateStory(-1);
          } else if (deltaX < -50) {
            handleForwardNavigation();
          }
        }
      },
      false
    );

    const updateButtonStates = () => {
      if (prevBtn) {
        prevBtn.disabled = false;
        prevBtn.style.opacity = "1";
        prevBtn.querySelector("path").style.fill = "#000000";
      }

      if (nextBtn) {
        const isLastSlide = currentStoryIndex === storyStates.length - 1;
        nextBtn.disabled = isLastSlide;
        nextBtn.style.opacity = isLastSlide ? "0.5" : "1";
        nextBtn.querySelector("path").style.fill = isLastSlide
          ? "#cccccc"
          : "#000000";
      }
    };

    updateButtonStates();
  };

  storyContainer.insertAdjacentHTML("beforeend", createStorySlide());
  setupEventListeners();
  updateProgress();

  document.body.appendChild(storyContainer);
  requestAnimationFrame(() => {
    storyContainer.style.opacity = "1";
  });

  return storyContainer;
}
