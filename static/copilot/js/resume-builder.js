// Loading Spinner Helper Functions
function showLoader(message) {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    if (overlay && messageEl) {
        messageEl.textContent = message || 'Processing...';
        overlay.style.display = 'flex';
    }
}

function hideLoader() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Language Storage Functions
function saveDetectedLanguage(type, language, language_code) {
    const languageData = JSON.parse(localStorage.getItem('detectedLanguage') || '{}');

    if (type === 'resume') {
        languageData.resume_language = language;
        languageData.resume_language_code = language_code;
    } else if (type === 'job') {
        languageData.job_language = language;
        languageData.job_language_code = language_code;
    }

    localStorage.setItem('detectedLanguage', JSON.stringify(languageData));
    console.log('Language saved:', languageData);
}

function getDetectedLanguage() {
    return JSON.parse(localStorage.getItem('detectedLanguage') || '{}');
}

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

    // Interview details inputs
    const builderCompanyName = document.getElementById('builderCompanyName');
    const builderJobTitle = document.getElementById('builderJobTitle');

    // Toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    // Generate button
    const generateBtn = document.getElementById('generateSummaryBtn');

    // Load existing interview details
    loadInterviewDetails();

    // Save interview details to localStorage on change
    if (builderCompanyName) {
        builderCompanyName.addEventListener('input', saveInterviewDetails);
    }
    if (builderJobTitle) {
        builderJobTitle.addEventListener('input', saveInterviewDetails);
    }

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

    // Show loader with appropriate message
    if (type === 'resume') {
        showLoader('Generating Resume Summary... (This may take up to 30 seconds)');
    } else {
        showLoader('Analyzing Job Description... (This may take up to 30 seconds)');
    }

    // Upload to server
    fetch('/upload-document/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            console.log('File uploaded successfully:', data);

            // Save detected language if present
            if (data.language && data.language_code) {
                saveDetectedLanguage(type, data.language, data.language_code);
            }

            // Show summary element
            const summaryId = type === 'resume' ? 'builderResumeSummary' : 'builderJobSummary';
            const summaryElement = document.getElementById(summaryId);

            // If resume with generated summary
            if (type === 'resume' && data.resume_summary) {
                summaryElement.innerHTML = `<p>${data.resume_summary}</p>`;

                // Update interview page summary
                const resumeSummaryElement = document.getElementById('resumeSummary');
                if (resumeSummaryElement) {
                    resumeSummaryElement.textContent = data.resume_summary;
                }

                alert('✅ Resume uploaded and summary generated automatically!');
            }
            // If job description with extracted data
            else if (type === 'job' && data.company && data.position) {
                // Auto-fill company and position fields
                const companyInput = document.getElementById('builderCompanyName');
                const positionInput = document.getElementById('builderJobTitle');

                if (companyInput) companyInput.value = data.company;
                if (positionInput) positionInput.value = data.position;

                // Save to localStorage
                saveInterviewDetails();

                // Display job summary if available
                if (data.job_summary) {
                    summaryElement.innerHTML = `<p>${data.job_summary}</p>`;

                    // Update interview page summary
                    const jobSummaryElement = document.getElementById('jobSummary');
                    if (jobSummaryElement) {
                        jobSummaryElement.textContent = data.job_summary;
                    }
                } else {
                    summaryElement.innerHTML = '<p class="empty-state">✅ File uploaded and analyzed! Company and position extracted automatically.</p>';
                }

                // Add to interviews list
                addInterviewToList(data.company, data.position);

                alert(`✅ Extracted:\n🏢 Company: ${data.company}\n💼 Position: ${data.position}`);
            } else {
                summaryElement.innerHTML = '<p class="empty-state">✅ File uploaded successfully!</p>';
            }

            // Store file info for versioning
            storeFileVersion(file, type, data.file_path);
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    })
    .catch(error => {
        hideLoader();
        console.error('Upload error:', error);
        const summaryId = type === 'resume' ? 'builderResumeSummary' : 'builderJobSummary';
        const summaryElement = document.getElementById(summaryId);
        if (summaryElement) {
            summaryElement.innerHTML = '<p class="empty-state" style="color: #e74c3c;">❌ Upload failed: ' + error.message + '</p>';
        }
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

    // Show loader
    showLoader('Analyzing Job Description... (This may take up to 30 seconds)');

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
        hideLoader();
        if (data.success) {
            // Save detected language if present
            if (data.language && data.language_code) {
                saveDetectedLanguage('job', data.language, data.language_code);
            }

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

            // Auto-fill company and position fields
            if (data.company && data.position) {
                const companyInput = document.getElementById('builderCompanyName');
                const positionInput = document.getElementById('builderJobTitle');

                if (companyInput) companyInput.value = data.company;
                if (positionInput) positionInput.value = data.position;

                // Save to localStorage
                saveInterviewDetails();

                // Display job summary if available
                if (data.job_summary) {
                    builderJobSummary.innerHTML = `<p>${data.job_summary}</p>`;

                    // Update interview page summary
                    const jobSummaryElement = document.getElementById('jobSummary');
                    if (jobSummaryElement) {
                        jobSummaryElement.textContent = data.job_summary;
                    }
                } else {
                    builderJobSummary.innerHTML = '<p class="empty-state">✅ Job description saved and analyzed!</p>';
                }

                // Add to interviews list
                addInterviewToList(data.company, data.position);

                alert(`✅ Extracted:\n🏢 Company: ${data.company}\n💼 Position: ${data.position}`);
            } else {
                builderJobSummary.innerHTML = '<p class="empty-state">✅ Job description saved!</p>';
            }

            // Store in versions
            storeTextVersion(jobText, 'job');
        } else {
            throw new Error(data.message || 'Save failed');
        }
    })
    .catch(error => {
        hideLoader();
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
            // Save detected languages if present
            if (data.resume_language && data.resume_language_code) {
                saveDetectedLanguage('resume', data.resume_language, data.resume_language_code);
            }
            if (data.job_language && data.job_language_code) {
                saveDetectedLanguage('job', data.job_language, data.job_language_code);
            }

            // Update builder summaries - only if they're not "No ... found" messages
            if (data.resume_summary &&
                data.resume_summary !== 'Loading...' &&
                !data.resume_summary.includes('No resume found')) {
                document.getElementById('builderResumeSummary').innerHTML = `<p>${data.resume_summary}</p>`;
            }
            if (data.job_summary &&
                data.job_summary !== 'Loading...' &&
                !data.job_summary.includes('No job description found')) {
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
    const clearAllBtn = document.getElementById('clearAllVersionsBtn');

    if (!versionsGrid) return;

    const versions = JSON.parse(localStorage.getItem('documentVersions') || '[]');

    if (versions.length === 0) {
        versionsGrid.innerHTML = '<div class="empty-state-card"><p>No versions yet. Upload documents to start tracking versions.</p></div>';
        if (clearAllBtn) clearAllBtn.style.display = 'none';
        return;
    }

    // Show clear all button if there are versions
    if (clearAllBtn) clearAllBtn.style.display = 'block';

    versionsGrid.innerHTML = '';

    // Get the last 6 versions (most recent first)
    const recentVersions = versions.slice(-6).reverse();

    recentVersions.forEach((version, displayIndex) => {
        // Calculate actual index in the full versions array
        const actualIndex = versions.length - displayIndex - 1;

        const card = document.createElement('div');
        card.className = 'version-card';

        const date = new Date(version.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="version-header">
                <span class="version-title">${version.type === 'resume' ? '📄' : '💼'} ${version.name}</span>
                <button class="version-delete-btn" onclick="deleteVersion(${actualIndex})" title="Delete this version">🗑️</button>
            </div>
            <div class="version-date">${formattedDate}</div>
        `;

        versionsGrid.appendChild(card);
    });
}

function deleteVersion(index) {
    if (!confirm('Are you sure you want to delete this version?')) {
        return;
    }

    const versions = JSON.parse(localStorage.getItem('documentVersions') || '[]');

    // Remove the version at the specified index
    versions.splice(index, 1);

    // Save back to localStorage
    localStorage.setItem('documentVersions', JSON.stringify(versions));

    // Update the display
    updateVersionsDisplay();
}

function clearAllVersions() {
    if (!confirm('Are you sure you want to delete ALL document versions? This cannot be undone.')) {
        return;
    }

    // Clear all versions from localStorage
    localStorage.setItem('documentVersions', JSON.stringify([]));

    // Update the display
    updateVersionsDisplay();

    // Show success message
    alert('✅ All document versions have been cleared!');
}

// Save interview details to localStorage
function saveInterviewDetails() {
    const companyName = document.getElementById('builderCompanyName').value.trim();
    const jobTitle = document.getElementById('builderJobTitle').value.trim();

    const interviewDetails = {
        company: companyName,
        position: jobTitle
    };

    localStorage.setItem('interviewDetails', JSON.stringify(interviewDetails));
    console.log('💾 Interview details saved:', interviewDetails);
}

// Load interview details from localStorage
function loadInterviewDetails() {
    const interviewDetails = JSON.parse(localStorage.getItem('interviewDetails') || '{}');

    const companyInput = document.getElementById('builderCompanyName');
    const jobInput = document.getElementById('builderJobTitle');

    if (companyInput && interviewDetails.company) {
        companyInput.value = interviewDetails.company;
    }

    if (jobInput && interviewDetails.position) {
        jobInput.value = interviewDetails.position;
    }
}

// Add interview to list
function addInterviewToList(company, position) {
    const interviews = JSON.parse(localStorage.getItem('savedInterviews') || '[]');

    // Check if already exists
    const exists = interviews.some(i => i.company === company && i.position === position);
    if (exists) {
        console.log('Interview already in list');
        updateInterviewsTable();
        return;
    }

    // Add new interview
    interviews.push({
        company: company,
        position: position,
        date: new Date().toISOString(),
        status: 'Pending'
    });

    localStorage.setItem('savedInterviews', JSON.stringify(interviews));
    console.log('✅ Interview added to list:', { company, position });

    // Update table display
    updateInterviewsTable();
}

// Update interviews table display
function updateInterviewsTable() {
    const tableBody = document.getElementById('interviewsTableBody');
    const clearAllBtn = document.getElementById('clearAllInterviewsBtn');

    if (!tableBody) return;

    const interviews = JSON.parse(localStorage.getItem('savedInterviews') || '[]');

    // Show/hide clear all button
    if (clearAllBtn) {
        clearAllBtn.style.display = interviews.length > 0 ? 'block' : 'none';
    }

    if (interviews.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No interviews registered yet.</td></tr>';
        return;
    }

    tableBody.innerHTML = '';

    // Show last 10 interviews
    const recentInterviews = interviews.slice(-10).reverse();

    recentInterviews.forEach((interview, index) => {
        const actualIndex = interviews.length - index - 1;
        const row = document.createElement('tr');
        const date = new Date(interview.date);

        row.innerHTML = `
            <td>${date.toLocaleDateString()}</td>
            <td>${interview.company}</td>
            <td>${interview.position}</td>
            <td class="actions-cell">
                <button class="btn-icon-sm" onclick="deleteInterview(${actualIndex})" title="Delete">🗑️</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Delete interview from list
function deleteInterview(index) {
    if (!confirm('Are you sure you want to delete this interview?')) {
        return;
    }

    const interviews = JSON.parse(localStorage.getItem('savedInterviews') || '[]');
    interviews.splice(index, 1);
    localStorage.setItem('savedInterviews', JSON.stringify(interviews));

    updateInterviewsTable();
    alert('✅ Interview deleted successfully!');
}

// Clear all interviews
function clearAllInterviews() {
    if (!confirm('Are you sure you want to delete ALL interviews? This cannot be undone.')) {
        return;
    }

    localStorage.setItem('savedInterviews', JSON.stringify([]));
    updateInterviewsTable();
    alert('✅ All interviews have been cleared!');
}

// Make functions available globally
window.clearJobText = clearJobText;
window.deleteVersion = deleteVersion;
window.clearAllVersions = clearAllVersions;
window.deleteInterview = deleteInterview;
window.clearAllInterviews = clearAllInterviews;

function generateSummaries() {
    const generateBtn = document.getElementById('generateSummaryBtn');
    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ Generating...';

    // Show loader
    showLoader('Generating Summaries... (This may take up to 30 seconds)');

    fetch('/generate-summaries/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoader();
        if (data.success) {
            // Save detected languages if present
            if (data.resume_language && data.resume_language_code) {
                saveDetectedLanguage('resume', data.resume_language, data.resume_language_code);
            }
            if (data.job_language && data.job_language_code) {
                saveDetectedLanguage('job', data.job_language, data.job_language_code);
            }

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
        hideLoader();
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

// Initialize versions display and interviews table when page loads
document.addEventListener('pageChanged', function(e) {
    if (e.detail.page === 'resume-builder') {
        updateVersionsDisplay();
        loadInterviewDetails();
        updateInterviewsTable();
    }
});
