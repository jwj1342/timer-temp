class InterviewTimer {
    constructor() {
        this.currentPhase = 1; // 1: 谈话环节, 2: 总结环节
        this.isRunning = false;
        this.timeLeft = 0;
        this.interval = null;
        this.hasStarted = false;
        
        // 阶段配置
        this.phases = {
            1: {
                name: '谈话环节',
                duration: 240, // 4分钟
                description: '第一阶段：谈话环节'
            },
            2: {
                name: '总结环节',
                duration: 120, // 2分钟
                description: '第二阶段：总结环节'
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
            currentPhase: document.getElementById('currentPhase'),
            phaseInfo: document.getElementById('phaseInfo'),
            timerDisplay: document.getElementById('timerDisplay'),
            timeType: document.getElementById('timeType'),
            timeRemaining: document.getElementById('timeRemaining'),
            timerContainer: document.getElementById('timerContainer'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            nextBtn: document.getElementById('nextBtn'),
            resetBtn: document.getElementById('resetBtn'),
            warningSound: document.getElementById('warningSound'),
            endSound: document.getElementById('endSound')
        };
        
        // 进度元素
        this.progressElements = {
            phase1: document.getElementById('phase1'),
            phase2: document.getElementById('phase2')
        };
    }
    
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startTimer());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.elements.nextBtn.addEventListener('click', () => this.nextPhase());
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
    
    getCurrentPhaseConfig() {
        return this.phases[this.currentPhase];
    }
    
    startTimer() {
        if (!this.hasStarted) {
            // 第一次开始，初始化时间
            this.timeLeft = this.getCurrentPhaseConfig().duration;
            this.hasStarted = true;
        }
        
        if (this.timeLeft <= 0) {
            return;
        }
        
        this.isRunning = true;
        this.elements.timerContainer.classList.add('active');
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            // 30秒警告
            if (this.timeLeft === 30) {
                this.playWarningSound();
                this.elements.timerContainer.classList.add('warning');
            }
            
            // 10秒危险警告
            if (this.timeLeft === 10) {
                this.elements.timerContainer.classList.remove('warning');
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
        this.elements.timerContainer.classList.remove('active');
        this.updateButtonStates();
    }
    
    nextPhase() {
        this.pauseTimer();
        
        if (this.currentPhase < 2) {
            this.currentPhase++;
            this.timeLeft = this.getCurrentPhaseConfig().duration;
            this.hasStarted = false;
            
            // 清除警告状态
            this.elements.timerContainer.classList.remove('warning', 'danger', 'active');
            
            this.updateDisplay();
            this.updateProgressDisplay();
            this.updateButtonStates();
        }
    }
    
    resetTimer() {
        this.pauseTimer();
        this.currentPhase = 1;
        this.timeLeft = this.getCurrentPhaseConfig().duration;
        this.hasStarted = false;
        
        // 清除警告状态
        this.elements.timerContainer.classList.remove('warning', 'danger', 'active');
        
        this.updateDisplay();
        this.updateProgressDisplay();
        this.updateButtonStates();
    }
    
    onTimeUp() {
        this.pauseTimer();
        this.playEndSound();
        
        // 时间结束的视觉效果
        this.elements.timerContainer.classList.remove('warning', 'active');
        this.elements.timerContainer.classList.add('danger');
        
        // 显示时间结束
        this.elements.currentPhase.textContent = '时间结束！';
        this.elements.phaseInfo.textContent = this.currentPhase < 2 ? '请点击"下一阶段"继续' : '谈心谈话环节已全部结束';
        
        // 启用相关按钮
        if (this.currentPhase < 2) {
            this.elements.nextBtn.disabled = false;
        }
        
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
        
        // 更新阶段和状态
        const phaseConfig = this.getCurrentPhaseConfig();
        
        if (!this.hasStarted) {
            this.elements.currentPhase.textContent = phaseConfig.description;
            this.elements.phaseInfo.textContent = '准备开始';
        } else if (this.timeLeft <= 0) {
            this.elements.currentPhase.textContent = '时间结束！';
            this.elements.phaseInfo.textContent = this.currentPhase < 2 ? '请点击"下一阶段"继续' : '谈心谈话环节已全部结束';
        } else {
            this.elements.currentPhase.textContent = phaseConfig.description;
            if (this.isRunning) {
                this.elements.phaseInfo.textContent = `正在进行${phaseConfig.name}`;
            } else {
                this.elements.phaseInfo.textContent = `${phaseConfig.name}已暂停`;
            }
        }
        
        // 更新时间类型
        this.elements.timeType.textContent = phaseConfig.name;
        this.elements.timeRemaining.textContent = '剩余时间';
    }
    
    updateProgressDisplay() {
        // 重置所有进度项
        Object.values(this.progressElements).forEach(element => {
            element.className = 'progress-item';
        });
        
        // 设置当前阶段为激活状态
        for (let i = 1; i <= this.currentPhase; i++) {
            if (i < this.currentPhase) {
                this.progressElements[`phase${i}`].classList.add('completed');
            } else if (i === this.currentPhase) {
                this.progressElements[`phase${i}`].classList.add('active');
            }
        }
        
        // 如果全部完成
        if (this.currentPhase > 2 || (this.currentPhase === 2 && this.timeLeft <= 0 && this.hasStarted)) {
            this.progressElements.phase2.classList.remove('active');
            this.progressElements.phase2.classList.add('completed');
        }
    }
    
    updateButtonStates() {
        // 开始按钮
        this.elements.startBtn.disabled = this.isRunning || this.timeLeft <= 0;
        
        // 暂停按钮
        this.elements.pauseBtn.disabled = !this.isRunning;
        
        // 下一阶段按钮
        this.elements.nextBtn.disabled = this.isRunning || this.currentPhase >= 2 || !this.hasStarted || this.timeLeft > 0;
        
        // 重置按钮始终可用
        this.elements.resetBtn.disabled = false;
    }
}

// 初始化谈心谈话计时器
const interviewTimer = new InterviewTimer(); 