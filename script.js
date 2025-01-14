class GitHubImageUploader {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.uploadResults = document.getElementById('uploadResults');
        this.tokenInput = document.getElementById('token');
        this.repoInput = document.getElementById('repo');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '#2c3e50';
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.style.borderColor = '#ddd';
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '#ddd';
            this.handleFiles(e.dataTransfer.files);
        });
    }

    async handleFiles(files) {
        const token = this.tokenInput.value.trim();
        const repo = this.repoInput.value.trim();

        if (!token || !repo) {
            this.showResult('错误', '请填写GitHub Token和仓库信息', false);
            return;
        }

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                this.showResult(file.name, '只能上传图片文件', false);
                continue;
            }

            try {
                const base64Data = await this.fileToBase64(file);
                const response = await this.uploadToGitHub(file.name, base64Data, token, repo);
                
                if (response.content) {
                    const imageUrl = response.content.download_url;
                    this.showResult(file.name, imageUrl, true);
                } else {
                    throw new Error('上传失败');
                }
            } catch (error) {
                this.showResult(file.name, error.message, false);
            }
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    async uploadToGitHub(filename, content, token, repo) {
        const [owner, repository] = repo.split('/');
        const path = `images/${Date.now()}-${filename}`;
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repository}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload ${filename}`,
                content: content
            })
        });

        if (!response.ok) {
            throw new Error(`上传失败: ${response.statusText}`);
        }

        return response.json();
    }

    showResult(filename, message, success) {
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${success ? 'success' : 'error'}`;
        
        resultItem.innerHTML = `
            <strong>${filename}</strong>
            ${success 
                ? `<div class="url-box">
                    <p>图片URL：${message}</p>
                    <p>Markdown：![${filename}](${message})</p>
                   </div>`
                : `<p>错误：${message}</p>`
            }
        `;

        this.uploadResults.insertBefore(resultItem, this.uploadResults.firstChild);
    }
}

// 初始化上传器
new GitHubImageUploader(); 