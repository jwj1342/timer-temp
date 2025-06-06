class PlayerTimer {
    constructor(playerType) {
        this.playerType = playerType; // 'A' 或 'B'
        this.currentRound = 1;
        this.currentRole = null; // 'questioner' 或 'answerer'
        this.isRunning = false;
        this.timeLeft = 0;
        this.interval = null;
        this.hasStarted = false;
        
        // 比赛配置
        this.rounds = {
            1: { // A1问B1答
                questioner: 'A',
                answerer: 'B',
                questionTime: 120, // 2分钟
                answerTime: 240    // 4分钟
            },
            2: { // B1问A1答
                questioner: 'B',
                answerer: 'A',
                questionTime: 120,
                answerTime: 240
            },
            3: { // A2问B2答
                questioner: 'A',
                answerer: 'B',
                questionTime: 120,
                answerTime: 240
            },
            4: { // B2问A2答
                questioner: 'B',
                answerer: 'A',
                questionTime: 120,
                answerTime: 240
            }
        };
        
        this.initElements();
        this.bindEvents();
        this.updateDisplay();
        this.updateProgressDisplay();
        this.createAudioContext();
    }
    
    initElements() {
        this.elements = {
            currentRole: document.getElementById('currentRole'),
            phaseInfo: document.getElementById('phaseInfo'),
            timerDisplay: document.getElementById('timerDisplay'),
            timeType: document.getElementById('timeType'),
            timeRemaining: document.getElementById('timeRemaining'),
            timerContainer: document.getElementById('timerContainer'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            switchBtn: document.getElementById('switchBtn'),
            nextBtn: document.getElementById('nextBtn'),
            resetBtn: document.getElementById('resetBtn'),
            warningSound: document.getElementById('warningSound'),
            endSound: document.getElementById('endSound')
        };
        
        // 进度元素
        this.progressElements = {
            round1: document.getElementById('round1'),
            round2: document.getElementById('round2'),
            round3: document.getElementById('round3'),
            round4: document.getElementById('round4')
        };
    }
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startTimer());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.elements.switchBtn.addEventListener('click', () => this.switchRole());
        this.elements.nextBtn.addEventListener('click', () => this.nextRound());
        this.elements.resetBtn.addEventListener('click', () => this.resetTimer());
    }
    
    createAudioContext() {
        // 创建音频上下文用于播放提示音
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建警告音（滴滴声）
            this.createWarningSound = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            };
            
            // 创建结束音
            this.createEndSound = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = 400;
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 1.5);
            };
        } catch (e) {
            console.log('音频上下文创建失败，使用HTML音频元素');
        }
    }
    
    getCurrentRoundConfig() {
        return this.rounds[this.currentRound];
    }
    
    getMyRole() {
        const roundConfig = this.getCurrentRoundConfig();
        if (this.playerType === roundConfig.questioner) {
            return 'questioner';
        } else {
            return 'answerer';
        }
    }
    
    getMyTime() {
        const roundConfig = this.getCurrentRoundConfig();
        const myRole = this.getMyRole();
        return myRole === 'questioner' ? roundConfig.questionTime : roundConfig.answerTime;
    }
    
    startTimer() {
        if (!this.hasStarted) {
            // 第一次开始，初始化当前角色
            this.currentRole = this.getMyRole();
            this.timeLeft = this.getMyTime();
            this.hasStarted = true;
        }
        
        if (this.timeLeft <= 0) {
            return;
        }
        
        this.isRunning = true;
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            // 30秒警告，持续5秒
            if (this.timeLeft === 30) {
                this.playWarningSound();
                this.elements.timerContainer.classList.add('warning');
            }
            
            // 25秒时移除警告状态（30秒警告持续5秒）
            if (this.timeLeft === 25) {
                this.elements.timerContainer.classList.remove('warning');
            }
            
            // 10秒危险警告
            if (this.timeLeft === 10) {
                this.elements.timerContainer.classList.add('danger');
            }
            
            // 倒计时最后10秒的滴滴声
            if (this.timeLeft <= 10 && this.timeLeft > 0) {
                this.playWarningSound();
            }
            
            // 时间结束
            if (this.timeLeft <= 0) {
                this.onTimeUp();
            }
        }, 1000);
        
        this.updateButtonStates();
    }
    
    pauseTimer() {
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.updateButtonStates();
    }
    
    switchRole() {
        if (this.isRunning) {
            this.pauseTimer();
        }
        
        // 切换角色
        const roundConfig = this.getCurrentRoundConfig();
        if (this.currentRole === 'questioner') {
            this.currentRole = 'answerer';
            this.timeLeft = roundConfig.answerTime;
        } else {
            this.currentRole = 'questioner';
            this.timeLeft = roundConfig.questionTime;
        }
        
        // 清除警告状态
        this.elements.timerContainer.classList.remove('warning', 'danger');
        
        this.updateDisplay();
        this.updateButtonStates();
    }
    
    nextRound() {
        this.pauseTimer();
        
        if (this.currentRound < 4) {
            this.currentRound++;
            this.currentRole = this.getMyRole();
            this.timeLeft = this.getMyTime();
            this.hasStarted = false;
            
            // 清除警告状态
            this.elements.timerContainer.classList.remove('warning', 'danger');
            
            this.updateDisplay();
            this.updateProgressDisplay();
            this.updateButtonStates();
        }
    }
    
    resetTimer() {
        this.pauseTimer();
        this.currentRound = 1;
        this.currentRole = this.getMyRole();
        this.timeLeft = this.getMyTime();
        this.hasStarted = false;
        
        // 清除警告状态
        this.elements.timerContainer.classList.remove('warning', 'danger');
        
        this.updateDisplay();
        this.updateProgressDisplay();
        this.updateButtonStates();
    }
    
    onTimeUp() {
        this.pauseTimer();
        this.playEndSound();
        
        // 时间结束的视觉效果
        this.elements.timerContainer.classList.remove('warning');
        this.elements.timerContainer.classList.add('danger');
        
        // 显示时间结束
        this.elements.currentRole.textContent = '时间结束！';
        this.elements.phaseInfo.textContent = '请切换角色或进入下一环节';
        
        // 启用相关按钮
        this.elements.switchBtn.disabled = false;
        this.elements.nextBtn.disabled = false;
        
        this.updateButtonStates();
    }
    
    playWarningSound() {
        if (this.createWarningSound) {
            try {
                this.createWarningSound();
            } catch (e) {
                console.log('播放警告音失败');
            }
        }
    }
    
    playEndSound() {
        if (this.createEndSound) {
            try {
                this.createEndSound();
            } catch (e) {
                console.log('播放结束音失败');
            }
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(Math.abs(seconds) / 60);
        const secs = Math.abs(seconds) % 60;
        const sign = seconds < 0 ? '-' : '';
        return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateDisplay() {
        // 更新计时器显示
        this.elements.timerDisplay.textContent = this.formatTime(this.timeLeft);
        
        // 更新角色和状态
        const roundConfig = this.getCurrentRoundConfig();
        const isMyTurn = (this.playerType === roundConfig.questioner && this.currentRole === 'questioner') ||
                        (this.playerType === roundConfig.answerer && this.currentRole === 'answerer');
        
        if (!this.hasStarted) {
            this.elements.currentRole.textContent = '等待开始';
            this.elements.phaseInfo.textContent = `第${this.currentRound}轮 - 准备就绪`;
        } else if (this.timeLeft <= 0) {
            this.elements.currentRole.textContent = '时间结束！';
            this.elements.phaseInfo.textContent = '请切换角色或进入下一环节';
        } else {
            if (isMyTurn) {
                if (this.isRunning) {
                    this.elements.currentRole.textContent = this.currentRole === 'questioner' ? '正在提问' : '正在回答';
                } else {
                    this.elements.currentRole.textContent = this.currentRole === 'questioner' ? '准备提问' : '准备回答';
                }
                this.elements.timerContainer.classList.add('active');
            } else {
                this.elements.currentRole.textContent = '等待对方';
                this.elements.timerContainer.classList.remove('active');
            }
            this.elements.phaseInfo.textContent = `第${this.currentRound}轮 - ${this.getRoundDescription()}`;
        }
        
        // 更新时间类型
        this.elements.timeType.textContent = this.currentRole === 'questioner' ? '提问时间' : '答题时间';
        this.elements.timeRemaining.textContent = '剩余时间';
    }
    
    getRoundDescription() {
        const roundConfig = this.getCurrentRoundConfig();
        return `${roundConfig.questioner}问${roundConfig.answerer}答`;
    }
    
    updateProgressDisplay() {
        // 重置所有进度项
        Object.values(this.progressElements).forEach(element => {
            element.className = 'progress-item';
        });
        
        // 设置当前轮次为激活状态
        for (let i = 1; i <= this.currentRound; i++) {
            if (i < this.currentRound) {
                this.progressElements[`round${i}`].classList.add('completed');
            } else if (i === this.currentRound) {
                this.progressElements[`round${i}`].classList.add('active');
            }
        }
    }
    
    updateButtonStates() {
        // 开始按钮
        this.elements.startBtn.disabled = this.isRunning || this.timeLeft <= 0;
        
        // 暂停按钮
        this.elements.pauseBtn.disabled = !this.isRunning;
        
        // 切换角色按钮
        this.elements.switchBtn.disabled = this.isRunning || !this.hasStarted;
        
        // 下一环节按钮
        this.elements.nextBtn.disabled = this.isRunning || this.currentRound >= 4;
        
        // 重置按钮始终可用
        this.elements.resetBtn.disabled = false;
    }
} 