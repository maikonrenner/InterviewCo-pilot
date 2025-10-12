// Resume Builder Controller
document.addEventListener('DOMContentLoaded', function() {
    // Resume upload area
    const resumeUploadArea = document.getElementById('resumeUploadArea');
    const resumeFileInput = document.getElementById('resumeFileInput');
    const resumeFiles = document.getElementById('resumeFiles');

    // Job upload area
    const jobUploadArea = document.getElementById('jobUploadArea');
    const jobFileInput = document.getElementById('jobFileInput');
    const jobFiles = document.getElementById('jobFiles');
    const jobPasteArea = document.getElementById('jobPasteArea');
    const jobTextArea = document.getElementById('jobTextArea');
    const saveJobTextBtn = document.getElementById('saveJobTextBtn');

    // Toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    // Generate button
    const generateBtn = document.getElementById('generateSummaryBtn');

    // Setup resume upload
    if (resumeUploadArea && resumeFileInput) {
        setupUploadArea(resumeUploadArea, resumeFileInput, resumeFiles, 'resume');
    }

    // Setup job upload
    if (jobUploadArea && jobFileInput) {
        setupUploadArea(jobUploadArea, jobFileInput, jobFiles, 'job');
    }

    // Setup toggle buttons
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');

            // Update button states
            toggleButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Toggle areas
            if (mode === 'paste') {
                jobPasteArea.classList.add('active');
                jobPasteArea.style.display = 'block';
                jobUploadArea.style.display = 'none';
            } else {
                jobPasteArea.classList.remove('active');
                jobPasteArea.style.display = 'none';
                jobUploadArea.style.display = 'block';
            }
        });
    });

    // Save pasted job text
    if (saveJobTextBtn) {
        saveJobTextBtn.addEventListener('click', saveJobText);
    }

    // Generate summaries button
    if (generateBtn) {
        generateBtn.addEventListener('click', generateSummaries);
    }

    // Load existing summaries when page loads
    loadExistingSummaries();
});

function setupUploadArea(uploadArea, fileInput, filesContainer, type) {
    // Click to browse
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files, filesContainer, type);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files, filesContainer, type);
    });
}

function handleFiles(files, container, type) {
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();

    if (!validTypes.includes(fileExt)) {
        alert('Invalid file type. Please upload PDF, DOCX, or TXT files.');
        return;
    }

    // Create file item element
    const fileItem = createFileItem(file, type);
    container.innerHTML = '';
    container.appendChild(fileItem);

    // Upload file to server
    uploadFile(file, type);
}

function createFileItem(file, type) {
    const div = document.createElement('div');
    div.className = 'file-item';

    const fileSize = (file.size / 1024).toFixed(2) + ' KB';

    div.innerHTML = `
        <div class="file-info">
            <span class="file-icon">📄</span>
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
        </div>
        <div class="file-actions">
            <button class="btn-icon" onclick="removeFile('${type}')" title="Remove">❌</button>
        </div>
    `;

    return div;
}

function removeFile(type) {
    const container = type === 'resume' ?
        document.getElementById('resumeFiles') :
        document.getElementById('jobFiles');

    container.innerHTML = '';

    // Clear summary if exists
    const summaryId = type === 'resume' ? 'builderResumeSummary' : 'builderJobSummary';
    const summaryElement = document.getElementById(summaryId);
    if (summaryElement) {
        summaryElement.innerHTML = '<p class="empty-state">Upload a ' + (type === 'resume' ? 'resume' : 'job description') + ' to generate summary...</p>';
    }
}

function uploadFile(file, type) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    // Show loading state
    const summaryId = type === 'resume' ? 'builderResumeSummary' : 'builderJobSummary';
    const summaryElement = document.getElementById(summaryId);
    if (summaryElement) {
        summaryElement.innerHTML = '<p class="empty-state">📤 Uploading file...</p>';
    }

    // Upload to server
    fetch('/upload-document/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('File uploaded successfully:', data);
            summaryElement.innerHTML = '<p class="empty-state">✅ File uploaded! Click "Generate Summaries" to create analysis.</p>';

            // Store file info for versioning
            storeFileVersion(file, type, data.file_path);
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        summaryElement.innerHTML = '<p class="empty-state" style="color: #e74c3c;">❌ Upload failed: ' + error.message + '</p>';
    });
}

function storeFileVersion(file, type, filePath) {
    const versions = JSON.parse(localStorage.getItem('documentVersions') || '[]');

    versions.push({
        type: type,
        name: file.name,
        size: file.size,
        path: filePath,
        date: new Date().toISOString()
    });

    localStorage.setItem('documentVersions', JSON.stringify(versions));
    updateVersionsDisplay();
}

function saveJobText() {
    const jobText = document.getElementById('jobTextArea').value.trim();

    if (!jobText) {
        alert('Please enter job description text!');
        return;
    }

    const jobFiles = document.getElementById('jobFiles');
    const builderJobSummary = document.getElementById('builderJobSummary');

    // Show loading
    builderJobSummary.innerHTML = '<p class="empty-state">💾 Saving job description...</p>';

    // Send to backend
    fetch('/save-job-text/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ job_text: jobText })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Show saved indicator
            jobFiles.innerHTML = `
                <div class="file-item">
                    <div class="file-info">
                        <span class="file-icon">📝</span>
                        <div>
                            <div class="file-name">Job Description (Text)</div>
                            <div class="file-size">${jobText.length} characters</div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="btn-icon" onclick="clearJobText()" title="Clear">❌</button>
                    </div>
                </div>
            `;

            builderJobSummary.innerHTML = '<p class="empty-state">✅ Job description saved! Click "Generate Summaries" to create analysis.</p>';

            // Store in versions
            storeTextVersion(jobText, 'job');

            alert('✅ Job description saved successfully!');
        } else {
            throw new Error(data.message || 'Save failed');
        }
    })
    .catch(error => {
        console.error('Save error:', error);
        builderJobSummary.innerHTML = '<p class="empty-state" style="color: #e74c3c;">❌ Save failed: ' + error.message + '</p>';
        alert('❌ Failed to save job description: ' + error.message);
    });
}

function clearJobText() {
    document.getElementById('jobTextArea').value = '';
    document.getElementById('jobFiles').innerHTML = '';
    document.getElementById('builderJobSummary').innerHTML = '<p class="empty-state">Upload a job description to generate summary...</p>';
}

function storeTextVersion(text, type) {
    const versions = JSON.parse(localStorage.getItem('documentVersions') || '[]');

    versions.push({
        type: type,
        name: type === 'job' ? 'Job Description (Text)' : 'Resume (Text)',
        size: text.length + ' chars',
        path: 'text',
        date: new Date().toISOString()
    });

    localStorage.setItem('documentVersions', JSON.stringify(versions));
    updateVersionsDisplay();
}

function loadExistingSummaries() {
    // Try to load existing summaries from the server
    fetch('/get-summaries/')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update builder summaries
            if (data.resume_summary && data.resume_summary !== 'Loading...') {
                document.getElementById('builderResumeSummary').innerHTML = `<p>${data.resume_summary}</p>`;
            }
            if (data.job_summary && data.job_summary !== 'Loading...') {
                document.getElementById('builderJobSummary').innerHTML = `<p>${data.job_summary}</p>`;
            }

            // Update interview page summaries
            if (document.getElementById('resumeSummary') && data.resume_summary) {
                document.getElementById('resumeSummary').textContent = data.resume_summary;
            }
            if (document.getElementById('jobSummary') && data.job_summary) {
                document.getElementById('jobSummary').textContent = data.job_summary;
            }
        }
    })
    .catch(error => {
        console.log('No existing summaries found:', error);
    });
}

function updateVersionsDisplay() {
    const versionsGrid = document.getElementById('versionsGrid');
    if (!versionsGrid) return;

    const versions = JSON.parse(localStorage.getItem('documentVersions') || '[]');

    if (versions.length === 0) {
        versionsGrid.innerHTML = '<div class="empty-state-card"><p>No versions yet. Upload documents to start tracking versions.</p></div>';
        return;
    }

    versionsGrid.innerHTML = '';

    versions.reverse().slice(0, 6).forEach((version, index) => {
        const card = document.createElement('div');
        card.className = 'version-card';

        const date = new Date(version.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="version-header">
                <span class="version-title">${version.type === 'resume' ? '📄' : '💼'} ${version.name}</span>
            </div>
            <div class="version-date">${formattedDate}</div>
        `;

        versionsGrid.appendChild(card);
    });
}

// Make function available globally
window.clearJobText = clearJobText;

function generateSummaries() {
    const generateBtn = document.getElementById('generateSummaryBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ Generating...';

    // Update UI to show loading
    document.getElementById('builderResumeSummary').innerHTML = '<p class="empty-state">🔄 Generating resume summary...</p>';
    document.getElementById('builderJobSummary').innerHTML = '<p class="empty-state">🔄 Generating job description summary...</p>';

    fetch('/generate-summaries/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update resume summary
            if (data.resume_summary) {
                document.getElementById('builderResumeSummary').innerHTML =
                    `<p>${data.resume_summary}</p>`;
            }

            // Update job summary
            if (data.job_summary) {
                document.getElementById('builderJobSummary').innerHTML =
                    `<p>${data.job_summary}</p>`;
            }

            // Also update the interview page summaries
            if (document.getElementById('resumeSummary')) {
                document.getElementById('resumeSummary').textContent = data.resume_summary || 'No resume uploaded';
            }
            if (document.getElementById('jobSummary')) {
                document.getElementById('jobSummary').textContent = data.job_summary || 'No job description uploaded';
            }

            alert('✅ Summaries generated successfully!');
        } else {
            throw new Error(data.message || 'Generation failed');
        }
    })
    .catch(error => {
        console.error('Generation error:', error);
        alert('❌ Failed to generate summaries: ' + error.message);
        document.getElementById('builderResumeSummary').innerHTML =
            '<p class="empty-state" style="color: #e74c3c;">❌ Generation failed</p>';
        document.getElementById('builderJobSummary').innerHTML =
            '<p class="empty-state" style="color: #e74c3c;">❌ Generation failed</p>';
    })
    .finally(() => {
        generateBtn.disabled = false;
        generateBtn.textContent = '🔄 Generate Summaries';
    });
}

// Copy to clipboard functionality
document.addEventListener('DOMContentLoaded', function() {
    const copyButtons = document.querySelectorAll('.summary-actions button');

    copyButtons.forEach(btn => {
        if (btn.textContent.includes('Copy')) {
            btn.addEventListener('click', function() {
                const summaryCard = this.closest('.summary-card');
                const summaryContent = summaryCard.querySelector('.summary-content');
                const text = summaryContent.textContent.trim();

                if (text && !text.includes('Upload')) {
                    navigator.clipboard.writeText(text).then(() => {
                        const originalText = this.textContent;
                        this.textContent = '✅ Copied!';
                        setTimeout(() => {
                            this.textContent = originalText;
                        }, 2000);
                    });
                }
            });
        }
    });
});

// Initialize versions display when page loads
document.addEventListener('pageChanged', function(e) {
    if (e.detail.page === 'resume-builder') {
        updateVersionsDisplay();
    }
});
