(function() {
    const urlInput = document.getElementById('gh-url');
    const xBtn = document.getElementById('clear-txt-btn');
    const historyGrid = document.getElementById('history');

    // 1. CLEAR TEXTBOX UTILITY
    window.checkInput = () => {
        xBtn.style.display = urlInput.value.length > 0 ? 'block' : 'none';
    };

    window.clearInput = () => {
        urlInput.value = '';
        checkInput();
        urlInput.focus();
    };

    // 2. STORAGE ENGINE
    function getStored() {
        return JSON.parse(localStorage.getItem('pro_repo_history') || '[]');
    }

    function parseGH(url) {
        try {
            const parts = url.split('/');
            const owner = parts[3];
            const name = parts[4];
            const file = parts.pop();
            return {
                fullName: `${owner}/${name}`,
                baseUrl: `https://github.com/${owner}/${name}`,
                fileName: file
            };
        } catch (e) {
            return { fullName: "Unknown Repo", baseUrl: "#", fileName: "Index" };
        }
    }

    function renderHistory() {
        const history = getStored();
        historyGrid.innerHTML = '';
        history.reverse().forEach(url => {
            const info = parseGH(url);
            const card = document.createElement('div');
            card.className = 'repo-card';
            card.innerHTML = `
                <div class="repo-info">
                    <a href="${info.baseUrl}" target="_blank" class="repo-name">
                        <i class="fa-brands fa-github"></i> ${info.fullName}
                    </a>
                    <span class="repo-url">${url}</span>
                    <div class="repo-stats">
                        <span><i class="fa-solid fa-file-code"></i> ${info.fileName}</span>
                        <span><i class="fa-solid fa-clock"></i> Saved</span>
                    </div>
                </div>
                <div class="repo-actions">
                    <button class="action-link" onclick="loadPreview('${url}')"><i class="fa-solid fa-play"></i> PREVIEW</button>
                    <button class="action-link" onclick="copyUrl('${url}')"><i class="fa-solid fa-copy"></i> COPY</button>
                    <a href="${info.baseUrl}" target="_blank" class="action-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> SOURCE</a>
                </div>
            `;
            historyGrid.appendChild(card);
        });
    }

    // 3. PREVIEW ENGINE (Opens in New Tab)
    window.loadPreview = (url) => {
        urlInput.value = url;
        checkInput();
        runPreview();
    };

    window.runPreview = function() {
        const url = urlInput.value.trim();
        if (!url) return;

        let history = getStored();
        if (!history.includes(url)) {
            history.push(url);
            localStorage.setItem('pro_repo_history', JSON.stringify(history));
            renderHistory();
        }

        const rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        const win = window.open('', '_blank');
        win.document.write('<html><body style="font-family:sans-serif; text-align:center; padding-top:20%"><h2>🚀 Building Preview...</h2></body></html>');

        fetch('https://api.codetabs.com/v1/proxy/?quest=' + rawUrl)
            .then(res => res.text())
            .then(html => {
                const baseTag = `<base href="${rawUrl}">`;
                const finalContent = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
                win.document.open();
                win.document.write(finalContent);
                win.document.close();
            })
            .catch(() => { win.close(); alert("Proxy Error. GitHub might be blocking the request."); });
    };

    // 4. MANAGEMENT TOOLS
    window.copyUrl = (url) => {
        navigator.clipboard.writeText(url);
        alert("URL copied to clipboard!");
    };

    window.exportData = () => {
        const blob = new Blob([localStorage.getItem('pro_repo_history')], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'github_dashboard_backup.json';
        a.click();
    };

    window.importData = (input) => {
        const reader = new FileReader();
        reader.onload = () => {
            localStorage.setItem('pro_repo_history', reader.result);
            renderHistory();
        };
        reader.readAsText(input.files[0]);
    };

    window.clearStorage = () => {
        if(confirm("Are you sure? This wipes all repository data.")) {
            localStorage.removeItem('pro_repo_history');
            renderHistory();
        }
    };

    renderHistory();
})();
