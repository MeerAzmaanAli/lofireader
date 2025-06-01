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
            // Convert markdown-like formatting to HTML with whitespace and font size support
            const formattedContent = content
                // Preserve multiple spaces
                .replace(/  +/g, match => '&nbsp;'.repeat(match.length))
                // Font size syntax: [size:20]text[/size] - with !important to override any other styles
                .replace(/\[size:(\d+)\](.*?)\[\/size\]/g, '<span style="font-size: $1px !important; display: inline-block;">$2</span>')
                // Bold
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                // Italic
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                // Headings with specific font sizes
                .replace(/^# (.*$)/gm, '<h1 style="font-size: 32px !important;">$1</h1>')
                .replace(/^## (.*$)/gm, '<h2 style="font-size: 24px !important;">$1</h2>')
                .replace(/^### (.*$)/gm, '<h3 style="font-size: 20px !important;">$1</h3>')
                // List items
                .replace(/^- (.*$)/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
                // Preserve line breaks with increased spacing
                .replace(/\n/g, '<br><br>')
                // Preserve indentation (4 spaces or tab)
                .replace(/^(\s{4}|\t)(.*$)/gm, '<div style="margin-left: 2em">$2</div>');
            
            // Wrap content in a div with increased line height and base font size
            const wrappedContent = `
                <div style="line-height: 1.8; letter-spacing: 0.3px;paragraph-spacing: 5px; font-size: 16px;">
                    ${formattedContent}
                </div>
            `;
            
            displayContent(wrappedContent);
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
            // Convert to HTML with custom options to preserve formatting
            const result = await mammoth.convertToHtml({ 
                arrayBuffer,
                transformDocument: (element) => {
                    // Handle different types of elements
                    if (element.type === "run") {
                        // Handle text runs with their formatting
                        if (element.styleId) {
                            // Get the style name from the style ID
                            const styleName = element.styleId.toLowerCase();
                            
                            // Handle different style types
                            if (styleName.includes('heading')) {
                                // Handle headings
                                if (styleName.includes('1')) {
                                    element.style.fontSize = '32px';
                                } else if (styleName.includes('2')) {
                                    element.style.fontSize = '24px';
                                } else if (styleName.includes('3')) {
                                    element.style.fontSize = '20px';
                                }
                            } else {
                                // Handle normal text with size
                                const sizeMatch = styleName.match(/size(\d+)/);
                                if (sizeMatch) {
                                    element.style.fontSize = `${sizeMatch[1]}px`;
                                }
                            }
                        }

                        // Handle direct formatting
                        if (element.fontSize) {
                            // Convert Word's font size (in half-points) to pixels
                            const sizeInPixels = Math.round(element.fontSize / 2);
                            element.style.fontSize = `${sizeInPixels}px`;
                        }

                        // Handle bold and italic
                        if (element.bold) {
                            element.style.fontWeight = 'bold';
                        }
                        if (element.italic) {
                            element.style.fontStyle = 'italic';
                        }
                    }

                    // Handle paragraphs
                    if (element.type === "paragraph") {
                        if (element.styleId) {
                            const styleName = element.styleId.toLowerCase();
                            if (styleName.includes('heading')) {
                                if (styleName.includes('1')) {
                                    element.style.fontSize = '32px';
                                } else if (styleName.includes('2')) {
                                    element.style.fontSize = '24px';
                                } else if (styleName.includes('3')) {
                                    element.style.fontSize = '20px';
                                }
                            }
                        }
                    }

                    return element;
                },
                styleMap: [
                    "p[style-name='Normal'] => p",
                    "p[style-name='Heading 1'] => h1",
                    "p[style-name='Heading 2'] => h2",
                    "p[style-name='Heading 3'] => h3",
                    "r[style-name='Strong'] => strong",
                    "r[style-name='Emphasis'] => em"
                ]
            });
            
            let content = result.value;
            
            // Add styling wrapper with increased line spacing and base font size
            content = `
                <div class="formatted-content" style="white-space: pre-wrap; line-height: 1.8; letter-spacing: 0.3px; font-size: 16px;">
                    ${content}
                </div>
            `;
            
            // Add a style block to ensure font sizes are preserved
            content = `
                <style>
                    .formatted-content * {
                        font-size: inherit;
                    }
                    .formatted-content h1 { font-size: 32px !important; }
                    .formatted-content h2 { font-size: 24px !important; }
                    .formatted-content h3 { font-size: 20px !important; }
                    .formatted-content p { font-size: 16px !important; }
                    .formatted-content span { display: inline-block; }
                </style>
                ${content}
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