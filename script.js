class DebateTimer {
    constructor() {
        // 游戏状态
        this.gameState = {
            isGameStarted: false,
            currentPlayer: null, // 'A' 或 'B'
            isFirstRound: true,
            gameEnded: false
        };
        
        // 计时器状态
        this.timers = {
            A: {
                time: 240, // 4分钟 = 240秒
                initialTime: 240,
                isRunning: false,
                interval: null
            },
            B: {
                time: 120, // 2分钟 = 120秒
                initialTime: 120,
                isRunning: false,
                interval: null
            }
        };
        
        // 初始化DOM元素
        this.initElements();
        // 绑定事件
        this.bindEvents();
        // 更新显示
        this.updateDisplay();
        // 创建提示音
        this.createNotificationSound();
    }
    
    initElements() {
        // 状态显示
        this.statusText = document.getElementById('statusText');
        
        // 计时器显示
        this.timerA = document.getElementById('timerA');
        this.timerB = document.getElementById('timerB');
        this.statusA = document.getElementById('statusA');
        this.statusB = document.getElementById('statusB');
        
        // 计时器容器
        this.containerA = this.timerA.closest('.timer-container');
        this.containerB = this.timerB.closest('.timer-container');
        
        // 个人控制按钮
        this.startA = document.getElementById('startA');
        this.pauseA = document.getElementById('pauseA');
        this.resetA = document.getElementById('resetA');
        this.startB = document.getElementById('startB');
        this.pauseB = document.getElementById('pauseB');
        this.resetB = document.getElementById('resetB');
        
        // 游戏控制按钮
        this.startGame = document.getElementById('startGame');
        this.resetGame = document.getElementById('resetGame');
        this.switchTurn = document.getElementById('switchTurn');
        this.rulesToggle = document.getElementById('rulesToggle');
        
        // 规则区域
        this.rulesSection = document.getElementById('rulesSection');
        
        // 音频元素
        this.timeUpSound = document.getElementById('timeUpSound');
    }
    
    bindEvents() {
        // 个人计时器控制
        this.startA.addEventListener('click', () => this.startTimer('A'));
        this.pauseA.addEventListener('click', () => this.pauseTimer('A'));
        this.resetA.addEventListener('click', () => this.resetTimer('A'));
        
        this.startB.addEventListener('click', () => this.startTimer('B'));
        this.pauseB.addEventListener('click', () => this.pauseTimer('B'));
        this.resetB.addEventListener('click', () => this.resetTimer('B'));
        
        // 游戏控制
        this.startGame.addEventListener('click', () => this.startDebateGame());
        this.resetGame.addEventListener('click', () => this.resetGame());
        this.switchTurn.addEventListener('click', () => this.switchPlayer());
        this.rulesToggle.addEventListener('click', () => this.toggleRules());
    }
    
    createNotificationSound() {
        // 创建一个简单的beep音效
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.playBeep = () => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
        };
    }
    
    formatTime(seconds) {
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.abs(seconds) % 60;
        const sign = seconds < 0 ? '-' : '';
        return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateDisplay() {
        // 更新计时器显示
        this.timerA.textContent = this.formatTime(this.timers.A.time);
        this.timerB.textContent = this.formatTime(this.timers.B.time);
        
        // 更新状态显示
        this.statusA.textContent = this.getPlayerStatus('A');
        this.statusB.textContent = this.getPlayerStatus('B');
        
        // 更新视觉状态
        this.updateVisualStates();
        
        // 更新按钮状态
        this.updateButtonStates();
    }
    
    getPlayerStatus(player) {
        if (this.gameState.gameEnded) {
            return this.timers[player].time <= 0 ? '时间用完' : '游戏结束';
        }
        
        if (!this.gameState.isGameStarted) {
            return '等待开始';
        }
        
        if (this.gameState.currentPlayer === player) {
            return this.timers[player].isRunning ? '发言中' : '准备发言';
        } else {
            return '等待中';
        }
    }
    
    updateVisualStates() {
        // 重置所有状态类
        this.containerA.className = 'timer-container left';
        this.containerB.className = 'timer-container right';
        
        // 当前发言者高亮
        if (this.gameState.currentPlayer === 'A' && this.timers.A.isRunning) {
            this.containerA.classList.add('active');
        } else if (this.gameState.currentPlayer === 'B' && this.timers.B.isRunning) {
            this.containerB.classList.add('active');
        }
        
        // 时间警告状态
        ['A', 'B'].forEach(player => {
            const timeLeft = this.timers[player].time;
            const totalTime = this.timers[player].initialTime;
            const container = player === 'A' ? this.containerA : this.containerB;
            
            if (timeLeft <= 0) {
                container.classList.add('danger');
            } else if (timeLeft <= totalTime * 0.1) { // 最后10%时间
                container.classList.add('danger');
            } else if (timeLeft <= totalTime * 0.2) { // 最后20%时间
                container.classList.add('warning');
            }
        });
    }
    
    updateButtonStates() {
        const gameStarted = this.gameState.isGameStarted;
        const gameEnded = this.gameState.gameEnded;
        
        // 游戏控制按钮
        this.startGame.disabled = gameStarted;
        this.switchTurn.disabled = !gameStarted || gameEnded;
        
        // 个人计时器按钮
        ['A', 'B'].forEach(player => {
            const isCurrentPlayer = this.gameState.currentPlayer === player;
            const isRunning = this.timers[player].isRunning;
            const hasTime = this.timers[player].time > 0;
            
            const startBtn = player === 'A' ? this.startA : this.startB;
            const pauseBtn = player === 'A' ? this.pauseA : this.pauseB;
            const resetBtn = player === 'A' ? this.resetA : this.resetB;
            
            if (gameStarted && !gameEnded) {
                startBtn.disabled = !isCurrentPlayer || isRunning || !hasTime;
                pauseBtn.disabled = !isCurrentPlayer || !isRunning;
                resetBtn.disabled = isRunning;
            } else {
                startBtn.disabled = gameStarted || gameEnded;
                pauseBtn.disabled = !isRunning;
                resetBtn.disabled = isRunning;
            }
        });
    }
    
    startTimer(player) {
        if (this.timers[player].isRunning || this.timers[player].time <= 0) return;
        
        this.timers[player].isRunning = true;
        this.timers[player].interval = setInterval(() => {
            this.timers[player].time--;
            this.updateDisplay();
            
            if (this.timers[player].time <= 0) {
                this.pauseTimer(player);
                this.onTimeUp(player);
            }
        }, 1000);
        
        this.updateDisplay();
    }
    
    pauseTimer(player) {
        if (!this.timers[player].isRunning) return;
        
        this.timers[player].isRunning = false;
        clearInterval(this.timers[player].interval);
        this.updateDisplay();
    }
    
    resetTimer(player) {
        this.pauseTimer(player);
        this.timers[player].time = this.timers[player].initialTime;
        this.updateDisplay();
    }
    
    onTimeUp(player) {
        this.playBeep();
        this.statusText.textContent = `${player}角时间用完！`;
        
        // 检查游戏是否结束
        if (this.timers.A.time <= 0 && this.timers.B.time <= 0) {
            this.endGame();
        } else {
            // 自动切换到另一个玩家（如果还有时间）
            const otherPlayer = player === 'A' ? 'B' : 'A';
            if (this.timers[otherPlayer].time > 0) {
                setTimeout(() => {
                    this.gameState.currentPlayer = otherPlayer;
                    this.updateDisplay();
                    this.updateStatusText();
                }, 1000);
            } else {
                this.endGame();
            }
        }
    }
    
    startDebateGame() {
        this.gameState.isGameStarted = true;
        this.gameState.currentPlayer = 'B'; // B角先开始提问
        this.gameState.gameEnded = false;
        this.gameState.isFirstRound = true;
        
        this.updateStatusText();
        this.updateDisplay();
    }
    
    switchPlayer() {
        if (!this.gameState.isGameStarted || this.gameState.gameEnded) return;
        
        // 暂停当前玩家的计时器
        if (this.gameState.currentPlayer) {
            this.pauseTimer(this.gameState.currentPlayer);
        }
        
        // 切换玩家
        this.gameState.currentPlayer = this.gameState.currentPlayer === 'A' ? 'B' : 'A';
        this.gameState.isFirstRound = false;
        
        this.updateStatusText();
        this.updateDisplay();
    }
    
    updateStatusText() {
        if (this.gameState.gameEnded) {
            this.statusText.textContent = '辩论结束';
            return;
        }
        
        if (!this.gameState.isGameStarted) {
            this.statusText.textContent = 'AB角辩论计时器 - 准备开始';
            return;
        }
        
        const currentPlayer = this.gameState.currentPlayer;
        if (currentPlayer === 'B' && this.gameState.isFirstRound) {
            this.statusText.textContent = 'B角提问阶段 - 累计计时2分钟';
        } else if (currentPlayer === 'A') {
            this.statusText.textContent = 'A角回答阶段 - 倒计时4分钟';
        } else if (currentPlayer === 'B') {
            this.statusText.textContent = 'B角提问阶段 - 累计计时2分钟';
        }
    }
    
    endGame() {
        this.gameState.gameEnded = true;
        this.gameState.currentPlayer = null;
        
        // 停止所有计时器
        this.pauseTimer('A');
        this.pauseTimer('B');
        
        this.statusText.textContent = '辩论结束！';
        this.playBeep();
        this.updateDisplay();
    }
    
    resetGame() {
        // 停止所有计时器
        this.pauseTimer('A');
        this.pauseTimer('B');
        
        // 重置游戏状态
        this.gameState = {
            isGameStarted: false,
            currentPlayer: null,
            isFirstRound: true,
            gameEnded: false
        };
        
        // 重置计时器
        this.timers.A.time = this.timers.A.initialTime;
        this.timers.B.time = this.timers.B.initialTime;
        
        this.updateStatusText();
        this.updateDisplay();
    }
    
    toggleRules() {
        const isHidden = this.rulesSection.classList.contains('hidden');
        
        if (isHidden) {
            this.rulesSection.classList.remove('hidden');
            this.rulesSection.classList.add('show');
            this.rulesToggle.textContent = '隐藏规则';
        } else {
            this.rulesSection.classList.remove('show');
            this.rulesSection.classList.add('hidden');
            this.rulesToggle.textContent = '查看规则';
        }
    }
}

// 页面加载完成后初始化计时器
document.addEventListener('DOMContentLoaded', () => {
    window.debateTimer = new DebateTimer();
});

// 防止页面刷新时丢失音频上下文
window.addEventListener('beforeunload', () => {
    if (window.debateTimer) {
        window.debateTimer.pauseTimer('A');
        window.debateTimer.pauseTimer('B');
    }
}); 