document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
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

    // PDF state
    let currentPdf = null;
    let currentPage = 1;
    let totalPages = 1;

    // Audio state
    let isPlaying = false;

    // Event Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
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
            displayContent(content);
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
            // Use raw text conversion instead of HTML
            const result = await mammoth.extractRawText({ arrayBuffer });
            let content = result.value;
            
            // Process the content to preserve formatting
            let formattedText = '';
            
            // Split content into lines and process each line
            const lines = content.split('\n');
            let inList = false;
            
            for (let line of lines) {
                line = line.trim();
                
                // Skip empty lines
                if (!line) {
                    if (formattedText) formattedText += '\n';
                    continue;
                }
                
                // Check for bullet points and list markers
                if (line.match(/^[•\-\*○▪\d+\.]\s/) || line.match(/^\d+\)\s/)) {
                    if (!inList && formattedText) formattedText += '\n';
                    inList = true;
                    formattedText += line + '\n';
                } else {
                    if (inList) {
                        formattedText += '\n';
                        inList = false;
                    }
                    if (formattedText) formattedText += '\n';
                    formattedText += line;
                }
            }
            
            // Clean up formatting
            formattedText = formattedText
                .replace(/\n{3,}/g, '\n\n')  // Replace 3 or more newlines with 2
                .replace(/\n\s*\n/g, '\n\n')  // Remove spaces between newlines
                .trim();  // Remove leading/trailing whitespace
            
            displayContent(formattedText);
            
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
            textContent.textContent = content;
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
        
        backgroundMusic.src = `assets/music/${musicSelect.value}`;
        backgroundMusic.currentTime = currentTime;
        
        if (wasPlaying) {
            backgroundMusic.play();
        }
    }

    // Handle background change
    function handleBackgroundChange() {
        const selectedBg = backgroundSelect.value;
        const encodedBg = encodeURIComponent(selectedBg);
        backgroundGif.src = `assets/gif/${encodedBg}`;
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