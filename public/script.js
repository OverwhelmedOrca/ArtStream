const liveStreamsContainer = document.getElementById('live-streams-container');
const popularVideosContainer = document.getElementById('popular-videos-container');
const upcomingStreamsContainer = document.getElementById('upcoming-streams-container');
const goLiveButton = document.getElementById('go-live');
const loginButton = document.getElementById('login-btn');
const signupButton = document.getElementById('signup-btn');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const liveOptionsModal = document.getElementById('live-options-modal');
const closeBtns = document.getElementsByClassName('close');
const prevFeaturedBtn = document.getElementById('prev-featured');
const nextFeaturedBtn = document.getElementById('next-featured');
const notifications = document.getElementById('notifications');

// Get the button that opens the modal
const goLiveBtn = document.getElementById('go-live');

// Get the <span> element that closes the modal
const closeLiveOptionsBtn = liveOptionsModal.querySelector('.close');

let featuredIndex = 0;

// Sample data
const sampleLiveStreams = [
    { title: "Neon Cityscape Digital Painting", artist: "CyberArtist42" },
    { title: "Sculpting Alien Lifeforms", artist: "GalacticSculptor" },
    { title: "Holographic Portrait Session", artist: "FuturePortraits" },
    { title: "AI-Assisted Abstract Art", artist: "NeuralBrush" },
    { title: "Quantum Brushstrokes", artist: "QuantumPainter" },
];

const samplePopularVideos = [
    { title: "Quantum Canvas Masterclass", artist: "QuantumArtist" },
    { title: "3D Printed Sculpture Timelapse", artist: "PrintMaster3000" },
    { title: "Virtual Reality Mural Creation", artist: "VRMuralPro" },
    { title: "Bioluminescent Body Painting", artist: "GlowingArtistry" },
    { title: "Nano-Art: Painting with Atoms", artist: "AtomicArtisan" },
];

const sampleUpcomingStreams = [
    { title: "Digital Painting Techniques", artist: "PixelPainter", time: "3:00 PM" },
    { title: "3D Modeling for Beginners", artist: "ModelMaster", time: "5:00 PM" },
    { title: "Advanced Animation Tips", artist: "AnimPro", time: "7:00 PM" },
];

const sampleFeaturedArtists = [
    { name: "NeonDreamer", description: "Cyberpunk-inspired digital art", image: "/images/artist.jpg" },
    { name: "GalacticSculptor", description: "Extraterrestrial-themed sculptures", image: "/images/artist2.jpeg" },
    { name: "FuturePortraits", description: "Holographic portraits", image: "/images/artist3.jpg" },
];

// Function to create a stream element
function createStreamElement(stream) {
    const streamElement = document.createElement('div');
    streamElement.className = 'stream-container';
    streamElement.innerHTML = `
        <div class="stream-preview">
            <p>Stream Preview</p>
        </div>
        <div class="stream-info">
            <div class="stream-title">${stream.title}</div>
            <div class="artist-name">${stream.artist}</div>
        </div>
    `;
    return streamElement;
}

// Function to create an upcoming stream element
function createUpcomingStreamElement(stream) {
    const streamElement = document.createElement('div');
    streamElement.className = 'stream-container';
    streamElement.innerHTML = `
        <div class="stream-info">
            <div class="stream-title">${stream.title}</div>
            <div class="artist-name">${stream.artist}</div>
            <div class="stream-time">${stream.time}</div>
        </div>
    `;
    return streamElement;
}

// Add sample streams to the page
sampleLiveStreams.forEach(stream => {
    liveStreamsContainer.appendChild(createStreamElement(stream));
});

samplePopularVideos.forEach(video => {
    popularVideosContainer.appendChild(createStreamElement(video));
});

sampleUpcomingStreams.forEach(stream => {
    upcomingStreamsContainer.appendChild(createUpcomingStreamElement(stream));
});

// Handle go live button click
goLiveButton.addEventListener('click', () => {
    liveOptionsModal.style.display = "block";
});

// Modal functionality
loginButton.onclick = () => loginModal.style.display = "block";
signupButton.onclick = () => signupModal.style.display = "block";

for (let closeBtn of closeBtns) {
    closeBtn.onclick = function() {
        loginModal.style.display = "none";
        signupModal.style.display = "none";
        liveOptionsModal.style.display = "none";
    }
}

window.onclick = function(event) {
    if (event.target == loginModal) {
        loginModal.style.display = "none";
    }
    if (event.target == signupModal) {
        signupModal.style.display = "none";
    }
    if (event.target == liveOptionsModal) {
        liveOptionsModal.style.display = "none";
    }
}

// Handle form submissions
document.getElementById('login-form').onsubmit = async function(e) {
    e.preventDefault();
    const username = e.target[0].value;
    const password = e.target[1].value;
    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token); // Store the token in local storage
            console.log('Token stored:', data.token); // Debugging: Log the stored token
            document.querySelector('.auth-buttons').innerHTML = `Welcome ${data.username}!`;
            loginModal.style.display = "none";
            e.target.reset();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error('Login error:', err);
    }
}

document.getElementById('signup-form').onsubmit = async function(e) {
    e.preventDefault();
    const username = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;
    try {
        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            document.querySelector('.auth-buttons').innerHTML = `Welcome ${data.username}!`;
            signupModal.style.display = "none";
            e.target.reset();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error('Sign up error:', err);
    }
}

// Handle category clicks
document.querySelectorAll('.category').forEach(category => {
    category.addEventListener('click', (e) => {
        alert(`Filtering by ${e.target.textContent}... (This feature would be implemented in a full version)`);
    });
});

// Handle search
document.getElementById('search-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        alert(`Searching for "${this.value}"... (This feature would be implemented in a full version)`);
    }
});

// Handle featured artist carousel
function updateFeaturedArtist(index) {
    const featuredArtist = sampleFeaturedArtists[index];
    const img = document.querySelector('#featured-artist img');
    const name = document.querySelector('#featured-artist h3');
    const description = document.querySelector('#featured-artist p');
    img.src = featuredArtist.image;
    name.textContent = featuredArtist.name;
    description.textContent = featuredArtist.description;
}

prevFeaturedBtn.addEventListener('click', () => {
    featuredIndex = (featuredIndex - 1 + sampleFeaturedArtists.length) % sampleFeaturedArtists.length;
    updateFeaturedArtist(featuredIndex);
});

nextFeaturedBtn.addEventListener('click', () => {
    featuredIndex = (featuredIndex + 1) % sampleFeaturedArtists.length;
    updateFeaturedArtist(featuredIndex);
});

// When the user clicks on the button, open the modal
goLiveBtn.onclick = function() {
    liveOptionsModal.style.display = "block";
  }
  
  // When the user clicks on <span> (x), close the modal
  closeLiveOptionsBtn.onclick = function() {
    liveOptionsModal.style.display = "none";
  }
  
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
    if (event.target == liveOptionsModal) {
      liveOptionsModal.style.display = "none";
    }
  }
  
  // Get the Start Server and Join Server buttons
  const startServerBtn = document.getElementById('start-server-btn');
  const joinServerBtn = document.getElementById('join-server-btn');
  
  // When the user clicks on Start Server, redirect to setup.html
  startServerBtn.onclick = function() {
    const token = localStorage.getItem('token');
    console.log('Token before navigating to setup:', token); // Debugging: Log the token before navigation
    window.location.href = 'setup.html';
  }

  
  // When the user clicks on Join Server, redirect to join.html
  joinServerBtn.onclick = function() {
    window.location.href = 'join.html';
  }

// Initialize the featured artist carousel
updateFeaturedArtist(featuredIndex);

// Handle notifications
notifications.addEventListener('click', () => {
    alert('Notifications for live streams enabled! (This feature would be implemented in a full version)');
});
