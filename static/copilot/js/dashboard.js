// Dashboard Controller
let activityChart, languageChart, questionsChart, modelChart;

// Mock data storage (in-memory)
const sessionData = {
    sessions: [],
    totalInterviews: 0,
    totalQuestions: 0,
    avgDuration: 0,
    avgResponseTime: 0
};

// Initialize Dashboard
document.addEventListener('pageChanged', function(e) {
    if (e.detail.page === 'dashboard') {
        initializeDashboard();
    }
});

function initializeDashboard() {
    loadSessionData();
    updateMetrics();
    initializeCharts();
    updateSessionsTable();
}

// Load session data from localStorage
function loadSessionData() {
    const storedData = localStorage.getItem('interviewSessions');
    if (storedData) {
        const data = JSON.parse(storedData);
        sessionData.sessions = data.sessions || [];
        calculateMetrics();
    }
}

// Calculate metrics from session data
function calculateMetrics() {
    const sessions = sessionData.sessions;
    sessionData.totalInterviews = sessions.length;
    sessionData.totalQuestions = sessions.reduce((sum, s) => sum + (s.questions || 0), 0);

    if (sessions.length > 0) {
        sessionData.avgDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;
        sessionData.avgResponseTime = sessions.reduce((sum, s) => sum + (s.avgResponseTime || 0), 0) / sessions.length;
    }
}

// Update metric cards
function updateMetrics() {
    document.getElementById('totalInterviews').textContent = sessionData.totalInterviews;
    document.getElementById('avgDuration').textContent = Math.round(sessionData.avgDuration) + ' min';
    document.getElementById('totalQuestions').textContent = sessionData.totalQuestions;
    document.getElementById('avgResponseTime').textContent = sessionData.avgResponseTime.toFixed(1) + 's';
}

// Initialize all charts
function initializeCharts() {
    createActivityChart();
    createLanguageChart();
    createQuestionsChart();
    createModelChart();
}

// Activity Chart (Line Chart)
function createActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    // Destroy existing chart
    if (activityChart) activityChart.destroy();

    // Generate last 7 days
    const labels = [];
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        // Count sessions for this date
        const count = sessionData.sessions.filter(s => {
            const sessionDate = new Date(s.date);
            return sessionDate.toDateString() === date.toDateString();
        }).length;
        data.push(count);
    }

    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Interviews',
                data: data,
                borderColor: '#1da1f2',
                backgroundColor: 'rgba(29, 161, 242, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Language Distribution (Pie Chart)
function createLanguageChart() {
    const ctx = document.getElementById('languageChart');
    if (!ctx) return;

    if (languageChart) languageChart.destroy();

    // Count languages
    const languageCounts = {};
    sessionData.sessions.forEach(s => {
        const lang = s.language || 'English';
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    const labels = Object.keys(languageCounts);
    const data = Object.values(languageCounts);

    // Default data if no sessions
    const defaultLabels = ['English', 'Portuguese', 'French', 'Spanish'];
    const defaultData = labels.length > 0 ? data : [45, 30, 15, 10];

    languageChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length > 0 ? labels : defaultLabels,
            datasets: [{
                data: defaultData,
                backgroundColor: [
                    '#1da1f2',
                    '#27ae60',
                    '#e74c3c',
                    '#f39c12',
                    '#9b59b6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Most Frequent Questions (Bar Chart)
function createQuestionsChart() {
    const ctx = document.getElementById('questionsChart');
    if (!ctx) return;

    if (questionsChart) questionsChart.destroy();

    // Mock data for frequent questions
    const labels = [
        'SQL Constraints',
        'Python Functions',
        'Data Structures',
        'API Design',
        'Testing'
    ];
    const data = [45, 38, 32, 28, 24];

    questionsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Frequency',
                data: data,
                backgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// AI Model Performance (Bar Chart)
function createModelChart() {
    const ctx = document.getElementById('modelChart');
    if (!ctx) return;

    if (modelChart) modelChart.destroy();

    // Count model usage
    const modelCounts = {};
    sessionData.sessions.forEach(s => {
        const model = s.model || 'gpt-4o';
        modelCounts[model] = (modelCounts[model] || 0) + 1;
    });

    const labels = Object.keys(modelCounts);
    const data = Object.values(modelCounts);

    // Default data
    const defaultLabels = ['GPT-4o', 'GPT-4', 'GPT-3.5-turbo'];
    const defaultData = labels.length > 0 ? data : [65, 25, 10];

    modelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : defaultLabels,
            datasets: [{
                label: 'Usage Count',
                data: defaultData,
                backgroundColor: [
                    '#27ae60',
                    '#1da1f2',
                    '#f39c12'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Update sessions table
function updateSessionsTable() {
    const tbody = document.getElementById('sessionsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (sessionData.sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No sessions yet. Start your first interview!</td></tr>';
        return;
    }

    // Show last 10 sessions
    const recentSessions = sessionData.sessions.slice(-10).reverse();

    recentSessions.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(session.date).toLocaleDateString()}</td>
            <td>${session.company || '-'}</td>
            <td>${session.position || '-'}</td>
            <td>${session.duration || 0} min</td>
            <td>${session.questions || 0}</td>
            <td>${session.language || 'English'}</td>
            <td>${session.model || 'gpt-4o'}</td>
            <td><span class="badge badge-success">Completed</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Export to CSV
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.querySelector('.btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }
});

function exportToCSV() {
    if (sessionData.sessions.length === 0) {
        alert('No data to export!');
        return;
    }

    // CSV headers
    let csv = 'Date,Company,Position,Duration (min),Questions,Language,Model,Status\n';

    // Add rows
    sessionData.sessions.forEach(session => {
        csv += `${new Date(session.date).toLocaleDateString()},`;
        csv += `${session.company || '-'},`;
        csv += `${session.position || '-'},`;
        csv += `${session.duration || 0},`;
        csv += `${session.questions || 0},`;
        csv += `${session.language || 'English'},`;
        csv += `${session.model || 'gpt-4o'},`;
        csv += `Completed\n`;
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Helper function to add a session (called from interview.js)
function addSessionToAnalytics(sessionInfo) {
    sessionData.sessions.push({
        date: new Date().toISOString(),
        company: sessionInfo.company || '-',
        position: sessionInfo.position || '-',
        duration: sessionInfo.duration || 0,
        questions: sessionInfo.questions || 0,
        language: sessionInfo.language || 'English',
        model: sessionInfo.model || 'gpt-4o',
        avgResponseTime: sessionInfo.avgResponseTime || 0
    });

    // Save to localStorage
    localStorage.setItem('interviewSessions', JSON.stringify(sessionData));

    // Refresh dashboard if it's active
    if (document.getElementById('dashboard-page').classList.contains('active')) {
        initializeDashboard();
    }
}

// Make function available globally
window.addSessionToAnalytics = addSessionToAnalytics;

// Interview Details Section
function loadInterviewDetails() {
    const container = document.getElementById('interviewDetailsContainer');
    if (!container) return;

    // Get interview QA data from localStorage
    const qaData = localStorage.getItem('interviewQAHistory');

    if (!qaData) {
        // Show sample data
        container.innerHTML = getSampleInterviewDetails();
        return;
    }

    try {
        const questions = JSON.parse(qaData);
        if (questions.length === 0) {
            container.innerHTML = getSampleInterviewDetails();
            return;
        }

        // Render actual QA data
        container.innerHTML = '';
        questions.forEach((qa, index) => {
            const qaCard = createQACard(qa, index);
            container.appendChild(qaCard);
        });
    } catch (e) {
        console.error('Error loading interview details:', e);
        container.innerHTML = getSampleInterviewDetails();
    }
}

function createQACard(qa, index) {
    const card = document.createElement('div');
    card.className = 'interview-qa-card';

    const timestamp = qa.timestamp ? new Date(qa.timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }) : 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
        <div class="qa-timestamp">${timestamp}</div>
        <div class="qa-question">
            <div class="qa-question-label">Pergunta</div>
            <p class="qa-question-text">${qa.question || 'N/A'}</p>
        </div>
        <div class="qa-responses">
            <div class="qa-response-box ai-suggestion">
                <div class="qa-response-label ai">Sugestão da IA</div>
                <p class="qa-response-text">${qa.aiResponse || 'N/A'}</p>
            </div>
            <div class="qa-response-box candidate-answer">
                <div class="qa-response-label candidate">Resposta do Candidato</div>
                <p class="qa-response-text">${qa.candidateResponse || 'N/A'}</p>
            </div>
        </div>
    `;

    return card;
}

function getSampleInterviewDetails() {
    return `
        <div class="interview-qa-card">
            <div class="qa-timestamp">Hoje, 14:32</div>
            <div class="qa-question">
                <div class="qa-question-label">Pergunta</div>
                <p class="qa-question-text">Como você lidaria com registros duplicados em uma tabela SQL?</p>
            </div>
            <div class="qa-responses">
                <div class="qa-response-box ai-suggestion">
                    <div class="qa-response-label ai">Sugestão da IA</div>
                    <p class="qa-response-text">Você pode usar uma consulta GROUP BY com HAVING COUNT(*) > 1 para identificar duplicatas, ou utilizar ROW_NUMBER() OVER (PARTITION BY) para deletar duplicatas mantendo apenas uma ocorrência. Também é importante considerar adicionar constraints UNIQUE para prevenir duplicatas no futuro.</p>
                </div>
                <div class="qa-response-box candidate-answer">
                    <div class="qa-response-label candidate">Resposta do Candidato</div>
                    <p class="qa-response-text">Eu usaria uma CTE com ROW_NUMBER() para identificar e remover duplicatas. Primeiro, criaria uma partição pelos campos que identificam a duplicata, numeraria as linhas, e depois deletaria onde o número da linha é maior que 1. Também adicionaria uma constraint UNIQUE para evitar o problema no futuro.</p>
                </div>
            </div>
        </div>

        <div class="interview-qa-card">
            <div class="qa-timestamp">Hoje, 14:38</div>
            <div class="qa-question">
                <div class="qa-question-label">Pergunta</div>
                <p class="qa-question-text">Explique a diferença entre Promise.all() e Promise.race() em JavaScript.</p>
            </div>
            <div class="qa-responses">
                <div class="qa-response-box ai-suggestion">
                    <div class="qa-response-label ai">Sugestão da IA</div>
                    <p class="qa-response-text">Promise.all() espera que todas as promises sejam resolvidas e retorna um array com todos os resultados, ou rejeita se qualquer uma falhar. Promise.race() retorna assim que a primeira promise for resolvida ou rejeitada, ignorando as demais. Use all() quando precisa de todos os resultados, e race() quando quer o primeiro resultado disponível.</p>
                </div>
                <div class="qa-response-box candidate-answer">
                    <div class="qa-response-label candidate">Resposta do Candidato</div>
                    <p class="qa-response-text">Promise.all() aguarda todas as promises terminarem e retorna um array com os resultados de todas. Se uma falhar, rejeita imediatamente. Já Promise.race() retorna o resultado da primeira promise que resolver ou rejeitar, sendo útil para implementar timeouts ou quando você só precisa da resposta mais rápida.</p>
                </div>
            </div>
        </div>

        <div class="interview-qa-card">
            <div class="qa-timestamp">Hoje, 14:45</div>
            <div class="qa-question">
                <div class="qa-question-label">Pergunta</div>
                <p class="qa-question-text">Como você implementaria um sistema de cache distribuído?</p>
            </div>
            <div class="qa-responses">
                <div class="qa-response-box ai-suggestion">
                    <div class="qa-response-label ai">Sugestão da IA</div>
                    <p class="qa-response-text">Sugiro usar Redis como camada de cache distribuído com estratégias como LRU (Least Recently Used) para invalidação. Implemente cache-aside pattern onde a aplicação verifica o cache primeiro, e se não encontrar, busca no banco de dados e popula o cache. Configure TTL apropriado e considere cache warming para dados frequentes. Para consistência, use pub/sub para invalidação de cache em múltiplas instâncias.</p>
                </div>
                <div class="qa-response-box candidate-answer">
                    <div class="qa-response-label candidate">Resposta do Candidato</div>
                    <p class="qa-response-text">Eu implementaria usando Redis como solução de cache. Usaria o padrão cache-aside onde primeiro verifico o cache, se não encontrar busco no DB e atualizo o cache. Configuraria TTL baseado na frequência de acesso dos dados. Para manter consistência entre instâncias, usaria Redis pub/sub para broadcast de invalidações quando dados forem atualizados.</p>
                </div>
            </div>
        </div>
    `;
}

// Session filter handler
document.addEventListener('DOMContentLoaded', function() {
    const sessionFilter = document.getElementById('interviewSessionFilter');
    if (sessionFilter) {
        sessionFilter.addEventListener('change', function(e) {
            if (e.target.value === 'recent') {
                // Show only most recent session
                // This would filter the localStorage data
                loadInterviewDetails();
            } else {
                // Show all sessions
                loadInterviewDetails();
            }
        });
    }
});

// Load interview details when dashboard is active
document.addEventListener('pageChanged', function(e) {
    if (e.detail.page === 'dashboard') {
        setTimeout(() => {
            loadInterviewDetails();
        }, 100);
    }
});

// Initial load if dashboard is already active
if (document.getElementById('dashboard-page')?.classList.contains('active')) {
    setTimeout(() => {
        loadInterviewDetails();
    }, 100);
}
