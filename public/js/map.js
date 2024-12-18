import { locations } from "./locations.js";
import { showLocationDetail } from "./sectionManager.js";

let map = null;
let markers = {};
let currentCardIndex = 0;
let lastActiveLocationId = null;
let carouselCards = {};

/**
 * Initializes the map with specified configuration and markers.
 * Removes the existing map instance if it exists.
 */
export function initMap() {
  const mapContainer = document.getElementById("map-container");
  if (!mapContainer) {
    console.error("Map-Container nicht gefunden.");
    return;
  }

  if (map) {
    map.remove();
  }

  map = L.map(mapContainer).setView([51.71895, 8.7547], 14);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      keepBuffer: 8,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }
  ).addTo(map);

  locations.forEach((location) => {
    const isDisabled = location.id >= 5;
    const marker = L.marker([location.lat, location.lng], {
      icon: getMarkerIcon(location.category, location.visited, isDisabled),
    }).addTo(map);

    if (marker._icon) {
      if (isDisabled) {
        marker._icon.style.filter = "none";
        marker.options.clickable = false;
        marker._icon.style.cursor = "default";
      } else {
        marker._icon.style.filter = "none";
        marker.on("click", () => showLocationDetail(location.id));
        marker.on("mouseover", () => highlightMarker(location.id));
        marker.on("mouseout", () => unhighlightMarker(location.id));
      }
    }

    markers[location.id] = marker;
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 100);

  map.on("moveend", updateVisibleMarkers.bind(this));
  updateVisibleMarkers();
}

/**
 * Returns a marker icon with a specific appearance based on category, visited status, and disabled state.
 * @param {string} category - The category of the location.
 * @param {boolean} visited - Indicates if the location has been visited.
 * @param {boolean} [isDisabled=false] - Indicates if the location is disabled.
 * @returns {L.DivIcon} - The customized marker icon.
 */
export function getMarkerIcon(category, visited, isDisabled = false) {
  const className = `location-marker${visited ? " visited" : ""}${
    isDisabled ? " disabled" : ""
  }`;

  return L.divIcon({
    className: className,
    iconSize: [50, 50],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

/**
 * Updates the visibility of markers based on the current map bounds.
 * Adds or removes markers as needed.
 */
export function updateVisibleMarkers() {
  if (!map) return;

  const bounds = map.getBounds();
  const currentLocationId = parseInt(
    document
      .querySelector(".location-card.highlighted")
      ?.getAttribute("data-location-id")
  );

  locations.forEach((location) => {
    if (bounds.contains([location.lat, location.lng])) {
      if (!markers[location.id]) {
        addMarkerToMap(location).then(() => {
          if (location.id === currentLocationId && location.id < 5) {
            const marker = markers[location.id];
            if (marker) {
              marker.setIcon(
                getHighlightedMarkerIcon(
                  location.category,
                  location.visited,
                  location.id >= 5
                )
              );
            }
          } else {
            const marker = markers[location.id];
            if (marker) {
              marker.setIcon(
                getMarkerIcon(
                  location.category,
                  location.visited,
                  location.id >= 5
                )
              );
            }
          }
        });
      }
    } else {
      if (markers[location.id]) {
        map.removeLayer(markers[location.id]);
        delete markers[location.id];
      }
    }
  });
}

/**
 * Updates the view of the carousel to reflect the current card index.
 * Highlights the current location and updates map focus.
 */
export function updateCarouselView() {
  const cardsContainer = document.querySelector(".carousel-cards");
  const carouselContainer = document.querySelector(".carousel-cards-container");
  if (!cardsContainer || !carouselContainer) return;

  requestAnimationFrame(() => {
    const cards = cardsContainer.querySelectorAll(".location-card");
    if (!cards.length) return;

    const cardWidth = 236;
    const containerWidth = carouselContainer.offsetWidth;
    const scrollPosition =
      currentCardIndex * cardWidth - (containerWidth - cardWidth) / 1.75;
    cardsContainer.style.transform = `translate3d(${-scrollPosition}px, 0, 0)`;

    locations.forEach((location) => {
      const marker = markers[location.id];
      if (marker && location.id < 5) {
        marker.setIcon(getMarkerIcon(location.category, location.visited));
        marker._icon.style.filter = "none";
      }
    });

    const currentCard = cards[currentCardIndex];
    if (currentCard) {
      const currentLocationId = parseInt(
        currentCard.getAttribute("data-location-id"),
        10
      );
      const currentLocation = locations.find((l) => l.id === currentLocationId);

      if (currentLocationId < 5) {
        const marker = markers[currentLocationId];
        if (marker) {
          setTimeout(() => {
            marker.setIcon(
              getHighlightedMarkerIcon(
                currentLocation.category,
                currentLocation.visited
              )
            );
            map.flyTo([currentLocation.lat, currentLocation.lng], 17, {
              duration: 1,
              easeLinearity: 0.5,
              offset: [0, -150],
            });
          }, 50);
        }
      }

      cards.forEach((card) => {
        const isCurrentCard = card === currentCard;
        card.classList.toggle("highlighted", isCurrentCard);
      });
    }

    updateCarouselNavButtons();
  });
}

function updateCarouselNavButtons() {
  const prevButton = document.getElementById("prev-card");
  const nextButton = document.getElementById("next-card");
  if (!prevButton || !nextButton) return;

  prevButton.disabled = currentCardIndex === 0;
  nextButton.disabled = currentCardIndex === locations.length - 1;
}

/**
 * Returns a highlighted marker icon with a specific appearance based on category, visited status, and disabled state.
 * @param {string} category - The category of the location.
 * @param {boolean} visited - Indicates if the location has been visited.
 * @param {boolean} [isDisabled=false] - Indicates if the location is disabled.
 * @returns {L.DivIcon} - The customized highlighted marker icon.
 */
export function getHighlightedMarkerIcon(
  category,
  visited,
  isDisabled = false
) {
  const className = `location-marker highlighted${visited ? " visited" : ""}${
    isDisabled ? " disabled" : ""
  }`;

  return L.divIcon({
    className: className,
    iconSize: [50, 50],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

/**
 * Highlights a specific marker on the map by changing its appearance and focusing the map on it.
 * @param {number} locationId - The ID of the location to highlight.
 */
export function highlightMarker(locationId) {
  locations.forEach((location) => {
    const marker = markers[location.id];
    if (marker) {
      marker.setIcon(getMarkerIcon(location.category, location.visited));
      marker._icon.style.filter = "none";
    }
  });

  const marker = markers[locationId];
  const location = locations.find((l) => l.id === locationId);

  if (marker && location) {
    marker.setIcon(
      getHighlightedMarkerIcon(location.category, location.visited)
    );
    marker.bindPopup(location.name).openPopup();

    map.flyTo([location.lat, location.lng], 17, {
      duration: 1,
      easeLinearity: 0.5,
      offset: [0, -150],
    });
  }
}

/**
 * Removes the highlight from a specific marker on the map.
 * @param {number} locationId - The ID of the location to unhighlight.
 */
export function unhighlightMarker(locationId) {
  if (locationId !== lastActiveLocationId) {
    const marker = markers[locationId];
    const location = locations.find((l) => l.id === locationId);
    if (marker && location && location.id < 5) {
      marker.setIcon(getMarkerIcon(location.category, location.visited));
      marker.closePopup();
    }
  }
}

/**
 * Adds a new marker to the map for a given location.
 * @param {Object} location - The location data.
 * @returns {Promise<L.Marker>} - A promise resolving to the newly created marker.
 */
async function addMarkerToMap(location) {
  if (!map) return;

  return new Promise((resolve) => {
    const marker = L.marker([location.lat, location.lng], {
      icon: getMarkerIcon(location.category, location.visited),
    }).addTo(map);

    if (marker._icon) {
      marker._icon.style.filter = "none";

      marker.on("click", () => {
        const isCurrentlyActive =
          currentCardIndex === locations.findIndex((l) => l.id === location.id);
        if (isCurrentlyActive) {
          showLocationDetail(location.id);
        } else {
          const index = locations.findIndex((l) => l.id === location.id);
          currentCardIndex = index;
          updateCarouselView();
          highlightMarker(location.id);
        }
      });

      marker.on("mouseover", () => highlightMarker(location.id));
      marker.on("mouseout", () => unhighlightMarker(location.id));
    }

    markers[location.id] = marker;
    setTimeout(() => resolve(marker), 50);
  });
}

/**
 * Initializes the carousel and populates it with location cards.
 * Adds event listeners for interaction with the carousel and markers.
 */
export function initCarousel() {
  const carousel = document.getElementById("location-carousel");
  if (!carousel) {
    console.error("Carousel-Container nicht gefunden.");
    return;
  }
  carousel.innerHTML = "";

  carousel.innerHTML = `
        <button id="prev-card" class="carousel-nav-btn" aria-label="Vorheriger Standort">&lt;</button>
        <div class="carousel-cards-container">
            <div class="carousel-cards"></div>
        </div>
        <button id="next-card" class="carousel-nav-btn" aria-label="Nächster Standort">&gt;</button>
    `;

  const cardsContainer = carousel.querySelector(".carousel-cards");

  locations.forEach((location, index) => {
    const card = document.createElement("div");
    card.className = `location-card${location.visited ? " visited" : ""}`;

    if (location.id >= 5) {
      card.classList.add("disabled");
    }

    card.setAttribute("data-location-id", location.id);
    card.innerHTML = `
        <img src="images/${location.image}" alt="${location.name}" loading="lazy">
        <div class="location-card-content">
          <h3>${location.name}</h3>
          <p>${location.description}</p>
          <div class="distance">
            <p class="location-distance">Story öffnen</p>
          </div>
        </div>
      `;

    if (!card.classList.contains("disabled")) {
      card.addEventListener("click", () => {
        const isCurrentlyHighlighted = card.classList.contains("highlighted");
        const currentHighlighted = cardsContainer.querySelector(
          ".location-card.highlighted"
        );

        if (currentHighlighted && currentHighlighted !== card) {
          currentHighlighted.classList.remove("highlighted");
        }

        currentCardIndex = index;
        updateCarouselView();

        if (isCurrentlyHighlighted) {
          showLocationDetail(location.id);
        } else {
          card.classList.add("highlighted");
          highlightMarker(location.id);
        }
      });

      card.addEventListener("mouseenter", () => {
        if (!card.classList.contains("highlighted")) {
          highlightMarker(location.id);
        }
      });
      card.addEventListener("mouseleave", () => {
        if (!card.classList.contains("highlighted")) {
          unhighlightMarker(location.id);
        }
      });
    }

    cardsContainer.appendChild(card);
    location.card = card;
    carouselCards[location.id] = card;
  });

  currentCardIndex = 0;
  updateCarouselView();

  const prevBtn = document.getElementById("prev-card");
  const nextBtn = document.getElementById("next-card");

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => navigateCarousel(-1));
    nextBtn.addEventListener("click", () => navigateCarousel(1));
  } else {
    console.error("Carousel-Navigationsbuttons nicht gefunden.");
  }

  initHammerCarousel(cardsContainer);
}

/**
 * Sets up swipe gestures for the carousel using Hammer.js.
 * @param {HTMLElement} element - The carousel container element.
 */
function initHammerCarousel(element) {
  if (typeof Hammer === "undefined") {
    console.error(
      "Hammer.js ist nicht geladen. Bitte stelle sicher, dass Hammer.js eingebunden ist."
    );
    return;
  }
  const hammer = new Hammer(element);
  hammer.on("swipeleft swiperight", (ev) => {
    if (ev.type === "swipeleft") {
      navigateCarousel(1);
    } else if (ev.type === "swiperight") {
      navigateCarousel(-1);
    }
  });
}

/**
 * Navigates the carousel by a given direction.
 * Updates the map and carousel view to match the current card index.
 * @param {number} direction - The direction to navigate (-1 for previous, 1 for next).
 */
export function navigateCarousel(direction) {
  currentCardIndex += direction;

  if (currentCardIndex < 0) {
    currentCardIndex = locations.length - 1;
  }
  if (currentCardIndex >= locations.length) {
    currentCardIndex = 0;
  }

  updateCarouselView();

  const currentLocation = locations[currentCardIndex];
  if (currentLocation && map) {
    map.flyTo([currentLocation.lat, currentLocation.lng], 17, {
      duration: 1,
      easeLinearity: 0.5,
    });
  }
}
