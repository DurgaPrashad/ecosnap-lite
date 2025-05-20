// Global variables
let currentEntryId = null

// Initialize comparison slider
function initComparisonSlider(container) {
  if (!container) return

  const slider = container.querySelector(".comparison-slider")
  const overlay = container.querySelector(".comparison-overlay")

  if (!slider || !overlay) return

  function moveSlider(e) {
    let position

    // Handle both mouse and touch events
    if (e.type === "touchmove") {
      const touch = e.touches[0]
      position = (touch.clientX - container.getBoundingClientRect().left) / container.offsetWidth
    } else {
      position = (e.clientX - container.getBoundingClientRect().left) / container.offsetWidth
    }

    // Constrain position between 0 and 1
    position = Math.max(0, Math.min(1, position))

    // Update overlay width and slider position
    overlay.style.width = position * 100 + "%"
    slider.style.left = position * 100 + "%"
  }

  function startDrag(e) {
    e.preventDefault()

    // Add event listeners for mouse/touch move
    document.addEventListener("mousemove", moveSlider)
    document.addEventListener("touchmove", handleTouch)
  }

  function stopDrag() {
    // Remove event listeners when drag ends
    document.removeEventListener("mousemove", moveSlider)
    document.removeEventListener("touchmove", handleTouch)
  }

  function handleTouch(e) {
    moveSlider(e)
  }

  // Set initial position
  overlay.style.width = "50%"
  slider.style.left = "50%"

  // Add event listeners
  slider.addEventListener("mousedown", startDrag)
  slider.addEventListener("touchstart", startDrag)
  container.addEventListener("click", moveSlider)
  document.addEventListener("mouseup", stopDrag)
  document.addEventListener("touchend", stopDrag)
}

// Set up image upload and preview
function setupImageUpload(previewId, inputId, imagePreviewId) {
  const previewElement = document.getElementById(previewId)
  const inputElement = document.getElementById(inputId)
  const imagePreview = document.getElementById(imagePreviewId)

  if (!previewElement || !inputElement || !imagePreview) return

  previewElement.addEventListener("click", () => {
    inputElement.click()
  })

  inputElement.addEventListener("change", function () {
    if (this.files && this.files[0]) {
      const reader = new FileReader()

      reader.onload = (e) => {
        imagePreview.src = e.target.result
        imagePreview.classList.remove("hidden")
        previewElement.querySelector(".upload-placeholder").classList.add("hidden")
      }

      reader.readAsDataURL(this.files[0])
    }
  })
}

// Save entry to localStorage
function saveEntry() {
  const location = document.getElementById("location").value
  const dateBefore = document.getElementById("date-before").value
  const dateAfter = document.getElementById("date-after").value
  const notes = document.getElementById("notes").value
  const beforeImage = document.getElementById("before-image-preview").src
  const afterImage = document.getElementById("after-image-preview").src

  if (!location || !dateBefore || !dateAfter || !beforeImage || !afterImage) {
    alert("Please fill in all required fields and upload both images.")
    return
  }

  // Create entry object
  const entry = {
    id: Date.now().toString(),
    location,
    dateBefore,
    dateAfter,
    notes,
    beforeImage,
    afterImage,
    createdAt: new Date().toISOString(),
  }

  // Get existing entries or initialize empty array
  const entries = JSON.parse(localStorage.getItem("ecosnapEntries")) || []

  // Add new entry
  entries.push(entry)

  // Save to localStorage
  localStorage.setItem("ecosnapEntries", JSON.stringify(entries))

  // Show success message
  document.getElementById("upload-form").classList.add("hidden")
  document.getElementById("success-message").classList.remove("hidden")
}

// Load gallery entries
function loadGallery() {
  const galleryGrid = document.getElementById("gallery-grid")
  const emptyGallery = document.getElementById("empty-gallery")

  if (!galleryGrid || !emptyGallery) return

  // Get entries from localStorage
  const entries = JSON.parse(localStorage.getItem("ecosnapEntries")) || []

  // Show/hide empty state
  if (entries.length === 0) {
    emptyGallery.classList.remove("hidden")
    galleryGrid.classList.add("hidden")
    return
  } else {
    emptyGallery.classList.add("hidden")
    galleryGrid.classList.remove("hidden")
  }

  // Clear existing gallery
  galleryGrid.innerHTML = ""

  // Sort entries by creation date (newest first)
  entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Create gallery cards
  entries.forEach((entry) => {
    const card = document.createElement("div")
    card.className = "gallery-card"

    // Format dates
    const beforeDate = new Date(entry.dateBefore).toLocaleDateString()
    const afterDate = new Date(entry.dateAfter).toLocaleDateString()

    card.innerHTML = `
            <div class="gallery-thumbnail">
                <img src="${entry.beforeImage}" alt="${entry.location} before">
            </div>
            <div class="gallery-info">
                <h3 class="gallery-location">${entry.location}</h3>
                <div class="gallery-dates">${beforeDate} to ${afterDate}</div>
                <button class="gallery-view-btn" data-id="${entry.id}">View Comparison</button>
            </div>
        `

    galleryGrid.appendChild(card)

    // Add event listener to view button
    card.querySelector(".gallery-view-btn").addEventListener("click", () => {
      openComparisonModal(entry.id)
    })

    // Add event listener to thumbnail
    card.querySelector(".gallery-thumbnail").addEventListener("click", () => {
      openComparisonModal(entry.id)
    })
  })
}

// Open comparison modal
function openComparisonModal(entryId) {
  const entries = JSON.parse(localStorage.getItem("ecosnapEntries")) || []
  const entry = entries.find((e) => e.id === entryId)

  if (!entry) return

  // Set current entry ID
  currentEntryId = entryId

  // Format dates
  const beforeDate = new Date(entry.dateBefore).toLocaleDateString()
  const afterDate = new Date(entry.dateAfter).toLocaleDateString()

  // Set modal content
  document.getElementById("modal-location").textContent = entry.location
  document.getElementById("modal-date-before").textContent = beforeDate
  document.getElementById("modal-date-after").textContent = afterDate
  document.getElementById("modal-before").src = entry.beforeImage
  document.getElementById("modal-after").src = entry.afterImage

  // Set notes
  const notesElement = document.getElementById("modal-notes")
  if (entry.notes) {
    notesElement.textContent = entry.notes
    notesElement.classList.remove("hidden")
  } else {
    notesElement.classList.add("hidden")
  }

  // Show modal
  document.getElementById("comparison-modal").style.display = "block"

  // Initialize comparison slider
  setTimeout(() => {
    initComparisonSlider(document.querySelector(".modal-comparison"))
  }, 100)
}

// Close modal
function closeModal() {
  document.getElementById("comparison-modal").style.display = "none"
  currentEntryId = null
}

// Delete current entry
function deleteCurrentEntry() {
  if (!currentEntryId) return

  if (confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
    // Get entries from localStorage
    let entries = JSON.parse(localStorage.getItem("ecosnapEntries")) || []

    // Filter out the current entry
    entries = entries.filter((entry) => entry.id !== currentEntryId)

    // Save to localStorage
    localStorage.setItem("ecosnapEntries", JSON.stringify(entries))

    // Close modal
    closeModal()

    // Reload gallery
    loadGallery()
  }
}

// Export all data
function exportAllData() {
  const entries = JSON.parse(localStorage.getItem("ecosnapEntries")) || []

  if (entries.length === 0) {
    alert("No entries to export.")
    return
  }

  // Create a JSON blob
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)

  // Create download link
  const a = document.createElement("a")
  a.href = url
  a.download = "ecosnap-data-" + new Date().toISOString().split("T")[0] + ".json"
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

// Clear all data
function clearAllData() {
  if (confirm("Are you sure you want to delete ALL entries? This action cannot be undone.")) {
    localStorage.removeItem("ecosnapEntries")
    loadGallery()
  }
}

// Download comparison image
function downloadComparison() {
  if (!currentEntryId) return

  const entries = JSON.parse(localStorage.getItem("ecosnapEntries")) || []
  const entry = entries.find((e) => e.id === currentEntryId)

  if (!entry) return

  // Create a canvas element
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  // Set canvas dimensions
  canvas.width = 1200
  canvas.height = 600

  // Create before and after images
  const beforeImg = new Image()
  const afterImg = new Image()

  beforeImg.crossOrigin = "anonymous"
  afterImg.crossOrigin = "anonymous"

  beforeImg.src = entry.beforeImage
  afterImg.src = entry.afterImage

  // Wait for images to load
  beforeImg.onload = () => {
    afterImg.onload = () => {
      // Draw background
      ctx.fillStyle = "#f9f9f9"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw title
      ctx.fillStyle = "#333"
      ctx.font = "bold 30px Poppins, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(entry.location, canvas.width / 2, 50)

      // Draw dates
      const beforeDate = new Date(entry.dateBefore).toLocaleDateString()
      const afterDate = new Date(entry.dateAfter).toLocaleDateString()
      ctx.font = "20px Poppins, sans-serif"
      ctx.fillText(`${beforeDate} to ${afterDate}`, canvas.width / 2, 80)

      // Draw before image
      ctx.drawImage(beforeImg, 50, 120, 500, 400)

      // Draw after image
      ctx.drawImage(afterImg, 650, 120, 500, 400)

      // Draw labels
      ctx.font = "bold 24px Poppins, sans-serif"
      ctx.fillText("BEFORE", 300, 550)
      ctx.fillText("AFTER", 900, 550)

      // Draw divider
      ctx.beginPath()
      ctx.moveTo(600, 120)
      ctx.lineTo(600, 520)
      ctx.strokeStyle = "#ddd"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw watermark
      ctx.font = "16px Poppins, sans-serif"
      ctx.fillStyle = "#999"
      ctx.textAlign = "right"
      ctx.fillText("Created with EcoSnap Lite", canvas.width - 50, canvas.height - 20)

      // Convert to image and download
      const dataUrl = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `ecosnap-${entry.location.replace(/\s+/g, "-").toLowerCase()}.png`
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
      }, 100)
    }
  }
}
