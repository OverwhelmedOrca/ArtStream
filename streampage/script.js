const topVideos = document.getElementById('topVideos');
const mainVideo = document.getElementById('mainVideo');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatContainer = document.getElementById('chatContainer');
const addStreamBtn = document.getElementById('addStreamBtn');
const toggleChatBtn = document.getElementById('toggleChatBtn');

// Sample video URLs (replace with actual HLS streams for production)
const sampleVideos = [
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    'https://test-streams.mux.dev/test_001/stream.m3u8',
    'https://test-streams.mux.dev/dai-discontinuity-deltatre/manifest.m3u8'
];

let streamUrls = [];
let mainVideoIndex = 0;

function addStream(url) {
    if (streamUrls.length >= 3) return;
    streamUrls.push(url);
    updateStreams();
}

function removeStream(url) {
    const index = streamUrls.indexOf(url);
    if (index > -1) {
        streamUrls.splice(index, 1);
        updateStreams();
    }
}

function updateStreams() {
    topVideos.innerHTML = '';
    mainVideo.innerHTML = '';
    
    streamUrls.forEach((url, index) => {
        const wrapper = createVideoWrapper(url, index);
        if (index === mainVideoIndex) {
            mainVideo.appendChild(wrapper);
        } else {
            wrapper.classList.add('small');
            topVideos.appendChild(wrapper);
        }
    });
}

function createVideoWrapper(url, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-wrapper';
    
    const video = document.createElement('video');
    video.id = `video-${index}`;
    video.controls = false;

    const controls = document.createElement('div');
    controls.className = 'video-controls';
    
    const playPauseBtn = document.createElement('button');
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    playPauseBtn.onclick = (e) => {
        e.stopPropagation();
        togglePlayPause(video, playPauseBtn);
    };

    const maximizeBtn = document.createElement('button');
    maximizeBtn.innerHTML = '<i class="fas fa-expand"></i>';
    maximizeBtn.onclick = (e) => {
        e.stopPropagation();
        switchMainVideo(index);
    };

    controls.appendChild(playPauseBtn);
    controls.appendChild(maximizeBtn);

    wrapper.appendChild(video);
    wrapper.appendChild(controls);

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
    }

    return wrapper;
}

function togglePlayPause(video, btn) {
    if (video.paused) {
        video.play();
        btn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        video.pause();
        btn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function switchMainVideo(index) {
    mainVideoIndex = index;
    updateStreams();
}

chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const message = this.value;
        if (message) {
            addChatMessage('You', message);
            this.value = '';
            // Here you would typically send the message to your chat backend
        }
    }
});

function addChatMessage(user, message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `<span class="chat-username">${user}:</span> ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add sample streams
sampleVideos.forEach(url => addStream(url));

// Simulating incoming chat messages
setInterval(() => {
    const users = ['User1', 'User2', 'User3'];
    const messages = ['Hello!', 'Great stream!', 'How are you doing?', 'This is awesome!'];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    addChatMessage(randomUser, randomMessage);
}, 5000);

// Navbar button functionality
addStreamBtn.addEventListener('click', () => {
    const url = prompt("Enter the stream URL:");
    if (url) addStream(url);
});

toggleChatBtn.addEventListener('click', () => {
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
});