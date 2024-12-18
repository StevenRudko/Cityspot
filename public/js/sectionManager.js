import { initMap, initCarousel } from "./map.js";
import { locations } from "./locations.js";
import { initDoorStory } from "./storyNavigation.js";
import {
  rightDoorStoryStates,
  leftDoorStoryStates,
  bauerHandwerkerStoryStates,
} from "./storyData.js";

let currentSection = "home";
let isDetailView = false;
let currentLocationIndex = 0;

/**
 * Displays a specified section by hiding others and initializing its content.
 * @param {string} sectionId - The ID of the section to show.
 */
export function showSection(sectionId) {
  window.scrollTo(0, 0);

  document.querySelectorAll(".content-section").forEach((s) => {
    s.classList.remove("active");
    s.style.display = "none";
    s.style.opacity = "0";

    s.scrollTop = 0;
  });

  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = "block";
    section.style.opacity = "1";

    section.scrollTop = 0;

    setTimeout(() => {
      section.classList.add("active");
    }, 50);

    currentSection = sectionId;

    if (sectionId === "map") {
      initMap();
      initCarousel();
    }
    if (sectionId === "location-detail") {
      isDetailView = true;
    } else {
      isDetailView = false;
    }
  }
}

/**
 * Displays the details of a specific location.
 * @param {number} locationId - The ID of the location to display details for.
 */
export function showLocationDetail(locationId) {
  const location = locations.find((l) => l.id === locationId);
  if (!location) return;

  const locationDetail = document.getElementById("location-detail");
  if (locationDetail) {
    let touchStartX = 0;
    let touchStartY = 0;

    locationDetail.addEventListener(
      "touchstart",
      function (event) {
        touchStartX = event.changedTouches[0].clientX;
        touchStartY = event.changedTouches[0].clientY;
      },
      { passive: true }
    );

    locationDetail.addEventListener("touchend", (event) => {
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < -50) {
          if (locationDetail.getAttribute("data-transitioning") === "true")
            return;
          locationDetail.setAttribute("data-transitioning", "true");

          const locationTitle =
            document.getElementById("location-title").textContent;
          let storyStates;

          switch (locationTitle) {
            case "Linke Rathaustür":
              storyStates = leftDoorStoryStates;
              break;
            case "Rechte Rathaustür":
              storyStates = rightDoorStoryStates;
              break;
            case "Bauer und Handwerker":
              storyStates = bauerHandwerkerStoryStates;
              break;
            default:
              storyStates = [];
          }

          const storyContainer = initDoorStory(storyStates);
          if (!storyContainer) {
            locationDetail.removeAttribute("data-transitioning");
            return;
          }

          storyContainer.style.transition = "none";
          locationDetail.style.transition = "none";

          document.body.appendChild(storyContainer);
          storyContainer.style.transform = "translateX(100%)";
          storyContainer.style.opacity = "1";

          storyContainer.offsetHeight;

          storyContainer.style.transition = "all 0.3s ease-out";
          locationDetail.style.transition = "all 0.3s ease-out";

          storyContainer.style.transform = "translateX(0)";
          locationDetail.style.transform = "translateX(-100%)";

          setTimeout(() => {
            locationDetail.style.display = "none";
            locationDetail.style.transform = "";
            locationDetail.removeAttribute("data-transitioning");

            const prevBtn = document.querySelector(".prev-btn");
            if (prevBtn) {
              prevBtn.disabled = false;
              prevBtn.style.opacity = "1";
              prevBtn.querySelector("path").style.fill = "#000000";
            }
          }, 300);
        }
      }
    });
  }

  currentLocationIndex = locations.indexOf(location);
  updateDetailView();
  showSection("location-detail");

  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  if (prevBtn) {
    prevBtn.disabled = true;
    prevBtn.style.opacity = "0.5";
    const pathElement = prevBtn.querySelector("path");
    if (pathElement) {
      pathElement.style.fill = "#cccccc";
    }

    prevBtn.onclick = () => {
      const locationDetail = document.getElementById("location-detail");
      if (locationDetail) {
        locationDetail.style.display = "block";
        locationDetail.style.opacity = "1";
        locationDetail.style.transform = "translateX(0)";

        if (activeStoryContainer) {
          activeStoryContainer.remove();
          activeStoryContainer = null;
        }
      }
    };
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const locationDetail = document.getElementById("location-detail");
      if (locationDetail) {
        const locationTitle =
          document.getElementById("location-title").textContent;
        let storyStates;

        switch (locationTitle) {
          case "Linke Rathaustür":
            storyStates = leftDoorStoryStates;
            break;
          case "Rechte Rathaustür":
            storyStates = rightDoorStoryStates;
            break;
          case "Bauer und Handwerker":
            storyStates = bauerHandwerkerStoryStates;
            break;
          default:
            storyStates = [];
        }

        locationDetail.style.transition = "all 0.3s ease-out";
        locationDetail.style.opacity = "0";
        locationDetail.style.transform = "translateX(-100%)";

        const storyContainer = initDoorStory(storyStates);
        document.body.appendChild(storyContainer);

        storyContainer.style.transform = "translateX(100%)";
        storyContainer.style.opacity = "0";

        requestAnimationFrame(() => {
          storyContainer.style.transition = "all 0.3s ease-out";
          storyContainer.style.transform = "translateX(0)";
          storyContainer.style.opacity = "1";
        });

        setTimeout(() => {
          locationDetail.style.display = "none";
          locationDetail.style.transform = "";
        }, 300);
      }
    });
  }
}

/**
 * Updates the detail view with the current location's information.
 */
function updateDetailView() {
  const location = locations[currentLocationIndex];
  if (!location) {
    console.error("Aktuelle Location nicht gefunden.");
    return;
  }

  const detailImage = document.querySelector(".detail-image");
  if (detailImage) {
    detailImage.style.backgroundImage = `url('images/${location.image}')`;
  }

  const locationTitle = document.getElementById("location-title");
  const locationSubtitle = document.getElementById("location-subtitle");
  if (locationTitle) {
    locationTitle.textContent = location.name;
  }
  if (locationSubtitle) {
    locationSubtitle.textContent = location.description;
  }

  const googleMapsLink = document.getElementById("google-maps-link");
  if (googleMapsLink && location.distance) {
    const hrefMatch = location.distance.match(/href="([^"]+)"/);
    if (hrefMatch && hrefMatch[1]) {
      googleMapsLink.href = hrefMatch[1];

      googleMapsLink.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(hrefMatch[1], "_blank");
      };

      googleMapsLink.parentElement.style.display = "block";
    } else {
      googleMapsLink.parentElement.style.display = "none";
    }
  } else if (googleMapsLink) {
    googleMapsLink.parentElement.style.display = "none";
  }

  const infoContainer = document.getElementById("info-container");
  if (!infoContainer) return;
  infoContainer.innerHTML = "";

  if (location.isOverview) {
    infoContainer.innerHTML =
      "Klicken Sie auf eine der Türen, um weitere Informationen zu erhalten.";
    document.getElementById("continue-btn").style.display = "none";
  } else {
    updateInfoText();
    const continueBtn = document.getElementById("continue-btn");
    if (continueBtn) {
      continueBtn.style.display = "block";
    }
  }

  const backToMapBtn = document.getElementById("back-to-map");
  if (backToMapBtn) {
    backToMapBtn.style.display = "none";
  }

  updateProgressBar();

  if (!location.isOverview) {
    highlightImageArea();
  }
}

/**
 * Handles the "Map" button click to navigate to the map section.
 */
export function handleMapButtonClick() {
  showSection("map");
}

document
  .getElementById("map-btn")
  .addEventListener("click", handleMapButtonClick);
