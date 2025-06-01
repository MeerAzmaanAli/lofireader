document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const newUploadBtn = document.getElementById('new-upload-btn');
    const uploadArea = document.getElementById('upload-area');
    const uploadSection = document.getElementById('upload-section');
    const textContainer = document.getElementById('text-container');
    const textContent = document.getElementById('text-content');
    const playPauseBtn = document.getElementById('play-pause');
    const volumeSlider = document.getElementById('volume-slider');
    const backgroundMusic = document.getElementById('background-music');
    const backgroundGif = document.getElementById('background-gif');
    const musicSelect = document.getElementById('music-select');
    const backgroundSelect = document.getElementById('background-select');
    const pdfControls = document.getElementById('pdf-controls');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    // Create loading spinners
    const bgLoadingSpinner = document.querySelector('.bg-loading');
    bgLoadingSpinner.style.display = 'none';

    const audioLoadingSpinner = document.createElement('div');
    audioLoadingSpinner.className = 'loading-spinner audio-loading';
    audioLoadingSpinner.innerHTML = `
        <div class="spinner"></div>
    `;
    document.querySelector('.audio-controls').appendChild(audioLoadingSpinner);
    audioLoadingSpinner.style.display = 'none';

    // PDF state
    let currentPdf = null;
    let currentPage = 1;
    let totalPages = 1;

    // Audio state
    let isPlaying = false;

    // Event Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    newUploadBtn.addEventListener('click', () => {
        // Show upload section with animation
        textContainer.style.opacity = '0';
        setTimeout(() => {
            textContainer.hidden = true;
            uploadSection.style.display = 'block';
            requestAnimationFrame(() => {
                uploadSection.style.opacity = '1';
            });
            // Reset file input to allow selecting the same file again
            fileInput.value = '';
        }, 300);
    });
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    playPauseBtn.addEventListener('click', togglePlayPause);
    volumeSlider.addEventListener('input', handleVolumeChange);
    musicSelect.addEventListener('change', handleMusicChange);
    backgroundSelect.addEventListener('change', handleBackgroundChange);
    prevPageBtn.addEventListener('click', () => changePage(-1));
    nextPageBtn.addEventListener('click', () => changePage(1));

    // Handle file selection
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.type === 'text/plain') {
                readTextFile(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                readWordFile(file);
            } else {
                alert('Please select a valid .txt or .docx file');
            }
        }
    }

    // Handle drag and drop
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    }

    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        uploadArea.style.borderColor = 'rgba(255, 255, 255, 0.3)';

        const file = event.dataTransfer.files[0];
        if (file) {
            if (file.type === 'text/plain') {
                readTextFile(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                readWordFile(file);
            } else {
                alert('Please drop a valid .txt or .docx file');
            }
        }
    }

    // Read and display text file
    function readTextFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            // Convert markdown-like formatting to HTML
            const formattedContent = content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                .replace(/^# (.*$)/gm, '<h1>$1</h1>') // H1
                .replace(/^## (.*$)/gm, '<h2>$1</h2>') // H2
                .replace(/^### (.*$)/gm, '<h3>$1</h3>') // H3
                .replace(/^- (.*$)/gm, '<li>$1</li>') // List items
                .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>') // Wrap list items in ul
                .replace(/\n\n/g, '<br><br>'); // Paragraphs
            
            displayContent(formattedContent);
            pdfControls.hidden = true;
            // Start playing music when user interacts
            if (!isPlaying) {
                backgroundMusic.play().catch(error => {
                    console.log('Autoplay prevented:', error);
                });
            }
        };
        reader.readAsText(file);
    }

    // Read and display Word file
    async function readWordFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            // Convert to HTML instead of raw text
            const result = await mammoth.convertToHtml({ arrayBuffer });
            let content = result.value;
            
            // Add some basic styling to the HTML content
            content = `
                <div class="formatted-content">
                    ${content}
                </div>
            `;
            
            displayContent(content);
            
            // Start playing music when user interacts
            if (!isPlaying) {
                backgroundMusic.play().catch(error => {
                    console.log('Autoplay prevented:', error);
                });
            }
        } catch (error) {
            console.error('Error loading Word file:', error);
            alert('Error loading Word file. Please try another file.');
        }
    }

    // Display content with animation
    function displayContent(content) {
        uploadSection.style.opacity = '0';
        setTimeout(() => {
            uploadSection.style.display = 'none';
            textContainer.hidden = false;
            textContent.innerHTML = content; // Changed from textContent to innerHTML
            textContainer.style.opacity = '0';
            requestAnimationFrame(() => {
                textContainer.style.opacity = '1';
            });
        }, 300);
    }

    // Change PDF page
    function changePage(delta) {
        const newPage = currentPage + delta;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            displayPdfPage();
            updatePageInfo();
        }
    }

    // Update page information
    function updatePageInfo() {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    // Update page navigation buttons
    function updatePageButtons() {
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    // Audio controls
    function togglePlayPause() {
        if (isPlaying) {
            backgroundMusic.pause();
            playPauseBtn.querySelector('.play-icon').style.display = 'inline';
            playPauseBtn.querySelector('.pause-icon').style.display = 'none';
        } else {
            backgroundMusic.play();
            playPauseBtn.querySelector('.play-icon').style.display = 'none';
            playPauseBtn.querySelector('.pause-icon').style.display = 'inline';
        }
        isPlaying = !isPlaying;
    }

    function handleVolumeChange() {
        const volume = volumeSlider.value / 100;
        backgroundMusic.volume = volume;
    }

    // Handle music change
    function handleMusicChange() {
        const currentTime = backgroundMusic.currentTime;
        const wasPlaying = isPlaying;
        
        // Show audio loading spinner
        audioLoadingSpinner.style.display = 'flex';
        
        // Create a new audio element to preload
        const tempAudio = new Audio();
        tempAudio.oncanplaythrough = () => {
            backgroundMusic.src = `assets/music/${musicSelect.value}`;
            backgroundMusic.currentTime = currentTime;
            
            if (wasPlaying) {
                backgroundMusic.play();
            }
            audioLoadingSpinner.style.display = 'none';
        };
        tempAudio.onerror = () => {
            console.error('Failed to load audio file');
            audioLoadingSpinner.style.display = 'none';
        };
        tempAudio.src = `assets/music/${musicSelect.value}`;
    }

    // Handle background change
    function handleBackgroundChange() {
        const selectedBg = backgroundSelect.value;
        const encodedBg = encodeURIComponent(selectedBg);
        
        // Show loading spinner
        bgLoadingSpinner.style.display = 'flex';
        
        // Create a new image to preload
        const tempImage = new Image();
        tempImage.onload = () => {
            backgroundGif.src = `assets/gif/${encodedBg}`;
            bgLoadingSpinner.style.display = 'none';
        };
        tempImage.onerror = () => {
            console.error('Failed to load background image');
            bgLoadingSpinner.style.display = 'none';
        };
        tempImage.src = `assets/gif/${encodedBg}`;
    }

    // Initialize volume
    backgroundMusic.volume = volumeSlider.value / 100;

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && isPlaying) {
            backgroundMusic.pause();
        } else if (!document.hidden && isPlaying) {
            backgroundMusic.play();
        }
    });
}); 