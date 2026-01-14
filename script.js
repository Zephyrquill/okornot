document.addEventListener('DOMContentLoaded', function() {
    const transferList = document.getElementById('transferList');
    const loading = document.getElementById('loading');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sortLikesBtn = document.getElementById('sortLikes');

    let transfers = [];
    let userVotes = JSON.parse(localStorage.getItem('transferVotes')) || {};

    // JSON'DAN VERİYİ ÇEK
    fetch('data/transfers.json')
        .then(response => {
            if (!response.ok) throw new Error('JSON dosyası bulunamadı');
            return response.json();
        })
        .then(data => {
            transfers = data;
            loading.style.display = 'none';
            displayTransfers(transfers);
        })
        .catch(error => {
            console.error('Hata:', error);
            loading.innerHTML = `<p style="color:#e74c3c">HATA: ${error.message}. data/transfers.json dosyasını kontrol et!</p>`;
        });

    // TRANSFER KARTI OLUŞTUR
    function displayTransfers(transfersToShow) {
        transferList.innerHTML = '';
        
        if (transfersToShow.length === 0) {
            transferList.innerHTML = '<div class="transfer-card"><p>Arama kriterlerine uygun transfer bulunamadı.</p></div>';
            return;
        }

        transfersToShow.forEach(transfer => {
            const hasVoted = userVotes[transfer.id] !== undefined;
            const userVote = userVotes[transfer.id];
            
            // Kaynak linklerini oluştur
            const sourcesHTML = transfer.verifiedSources && transfer.verifiedSources.length > 0 
                ? transfer.verifiedSources.map(source => `
                    <a href="${source.url}" target="_blank" class="source">
                        <i class="fas fa-${source.type === 'twitter' ? 'twitter' : 'newspaper'}"></i>
                        <span class="source-name">${source.name}</span>
                    </a>
                `).join('')
                : '<p>Kaynak linki henüz eklenmedi.</p>';

            // Transfer kartı HTML
            const card = document.createElement('div');
            card.className = 'transfer-card';
            card.innerHTML = `
                <div class="transfer-header">
                    <h2>${transfer.playerName}</h2>
                    <span class="age">${transfer.age} yaş</span>
                    <span class="position">${transfer.position}</span>
                    <span class="nationality">${transfer.nationality}</span>
                    <span class="status ${transfer.status}">${transfer.status.toUpperCase()}</span>
                </div>
                
                <div class="transfer-teams">
                    <div class="team from">
                        <div class="team-logo-placeholder">${transfer.fromTeam.charAt(0)}</div>
                        <span>${transfer.fromTeam}</span>
                    </div>
                    <div class="arrow">→</div>
                    <div class="team to">
                        <div class="team-logo-placeholder">${transfer.toTeam.charAt(0)}</div>
                        <span>${transfer.toTeam}</span>
                    </div>
                </div>
                
                <div class="transfer-details">
                    <div class="detail">
                        <span class="label">Bonservis:</span>
                        <span class="value">${transfer.transferFee || 'Açıklanmadı'}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Sözleşme:</span>
                        <span class="value">${transfer.contractYears || '?'} yıl</span>
                    </div>
                    <div class="detail">
                        <span class="label">Haftalık Maaş:</span>
                        <span class="value">${transfer.weeklyWage || 'Açıklanmadı'}</span>
                    </div>
                    <div class="detail">
                        <span class="label">Transfer Tarihi:</span>
                        <span class="value">${formatDate(transfer.transferDate)}</span>
                    </div>
                </div>
                
                <div class="sources">
                    <h4><i class="fas fa-link"></i> Doğrulayan Kaynaklar:</h4>
                    <div class="source-links">
                        ${sourcesHTML}
                    </div>
                </div>
                
                <div class="voting">
                    <button class="vote-btn like" data-id="${transfer.id}" ${hasVoted ? 'disabled' : ''}>
                        👍 OK <span class="count">${transfer.likes || 0}</span>
                        ${userVote === 'like' ? '<i class="fas fa-check"></i>' : ''}
                    </button>
                    <button class="vote-btn dislike" data-id="${transfer.id}" ${hasVoted ? 'disabled' : ''}>
                        👎 NOT OK <span class="count">${transfer.dislikes || 0}</span>
                        ${userVote === 'dislike' ? '<i class="fas fa-check"></i>' : ''}
                    </button>
                </div>
                
                <div class="vote-message" id="message-${transfer.id}" style="margin-top:15px; font-size:0.9em; color:#f1c40f;"></div>
            `;
            
            transferList.appendChild(card);
        });

        // OY BUTONLARINA TIKLAMA EKLE
        document.querySelectorAll('.vote-btn').forEach(button => {
            button.addEventListener('click', function() {
                const transferId = parseInt(this.getAttribute('data-id'));
                const voteType = this.classList.contains('like') ? 'like' : 'dislike';
                voteForTransfer(transferId, voteType);
            });
        });
    }

    // TARİH FORMATLAMA
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }

    // OYLAMA FONKSİYONU
    function voteForTransfer(transferId, voteType) {
        if (userVotes[transferId] !== undefined) {
            alert('Bu transfer için zaten oy kullandınız!');
            return;
        }

        // Yerel oyu kaydet
        userVotes[transferId] = voteType;
        localStorage.setItem('transferVotes', JSON.stringify(userVotes));
        
        // Arayüzü güncelle
        const voteBtnLike = document.querySelector(`.vote-btn.like[data-id="${transferId}"]`);
        const voteBtnDislike = document.querySelector(`.vote-btn.dislike[data-id="${transferId}"]`);
        const countLike = voteBtnLike.querySelector('.count');
        const countDislike = voteBtnDislike.querySelector('.count');
        const messageDiv = document.getElementById(`message-${transferId}`);
        
        if (voteType === 'like') {
            countLike.textContent = parseInt(countLike.textContent) + 1;
            voteBtnLike.innerHTML = `👍 OK <span class="count">${countLike.textContent}</span> <i class="fas fa-check"></i>`;
            voteBtnLike.disabled = true;
            messageDiv.textContent = 'OK oyu verdiniz!';
        } else {
            countDislike.textContent = parseInt(countDislike.textContent) + 1;
            voteBtnDislike.innerHTML = `👎 NOT OK <span class="count">${countDislike.textContent}</span> <i class="fas fa-check"></i>`;
            voteBtnDislike.disabled = true;
            messageDiv.textContent = 'NOT OK oyu verdiniz!';
        }
        
        // 3 saniye sonra mesajı temizle
        setTimeout(() => {
            messageDiv.textContent = '';
        }, 3000);
    }

    // FİLTRELEME
    searchInput.addEventListener('input', filterTransfers);
    statusFilter.addEventListener('change', filterTransfers);
    
    function filterTransfers() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusTerm = statusFilter.value;
        
        const filtered = transfers.filter(transfer => {
            const matchesSearch = 
                transfer.playerName.toLowerCase().includes(searchTerm) ||
                transfer.fromTeam.toLowerCase().includes(searchTerm) ||
                transfer.toTeam.toLowerCase().includes(searchTerm);
            
            const matchesStatus = !statusTerm || transfer.status === statusTerm;
            
            return matchesSearch && matchesStatus;
        });
        
        displayTransfers(filtered);
    }

    // SIRALAMA (En çok beğenilen)
    sortLikesBtn.addEventListener('click', () => {
        const sorted = [...transfers].sort((a, b) => {
            const likesA = a.likes || 0;
            const likesB = b.likes || 0;
            return likesB - likesA;
        });
        displayTransfers(sorted);
    });
});