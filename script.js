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

    generateRandomFileName(fileExtension) {
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        const randomStr = Math.random().toString(36).substring(2, 10);
        return `${timestamp}-${randomStr}${fileExtension}`;
    }

    getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 1).toLowerCase();
    }

    generateTimePath() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
    }

    async uploadToGitHub(filename, content, token, repo) {
        const [owner, repository] = repo.split('/');
        const fileExtension = this.getFileExtension(filename);
        const randomFileName = this.generateRandomFileName(`.${fileExtension}`);
        const timePath = this.generateTimePath();
        const path = `images/${timePath}/${randomFileName}`;
        
        const response = await fetch(`https://api.github.com/repos/${owner}/${repository}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload image ${randomFileName}`,
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
        
        let displayUrl = message;
        if (success) {
            const urlParts = message.split('/main/');
            if (urlParts.length > 1) {
                displayUrl = `https://image.wuaitech.workers.dev/${urlParts[1]}`;
            }
        }
        
        resultItem.innerHTML = `
            <strong>${filename}</strong>
            ${success 
                ? `<div class="url-box">
                    <p>图片URL：${displayUrl}</p>
                    <p>Markdown：![${filename}](${displayUrl})</p>
                   </div>`
                : `<p>错误：${message}</p>`
            }
        `;

        this.uploadResults.insertBefore(resultItem, this.uploadResults.firstChild);
    }
}

// 初始化上传器
new GitHubImageUploader(); 