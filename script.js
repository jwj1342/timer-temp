class CaseStudyTimer {
    constructor() {
        // 游戏状态
        this.gameState = {
            isGameStarted: false,
            currentPhase: 1, // 1: B问A答, 2: A问B答
            currentSpeaker: null, // 当前发言者 'A' 或 'B'
            gameEnded: false,
            phaseEnded: false
        };
        
        // 阶段配置
        this.phaseConfig = {
            1: { // 第一阶段：B问A答
                questioner: 'B',
                answerer: 'A',
                questionTime: 120, // 2分钟
                answerTime: 240    // 4分钟
            },
            2: { // 第二阶段：A问B答
                questioner: 'A',
                answerer: 'B',
                questionTime: 120, // 2分钟
                answerTime: 240    // 4分钟
            }
        };
        
        const initialConfig = this.phaseConfig[1];
        // 计时器状态
        this.timers = {
            A: {
                time: initialConfig.answerTime,
                isRunning: false,
                interval: null,
                role: 'answerer', // 当前角色：questioner 或 answerer
                totalTime: initialConfig.answerTime    // 总分配时间
            },
            B: {
                time: initialConfig.questionTime,
                isRunning: false,
                interval: null,
                role: 'questioner',
                totalTime: initialConfig.questionTime
            }
        };
        
        // 初始化
        this.initElements();
        this.bindEvents();
        this.updateDisplay();
        this.createNotificationSound();
    }
    
    initElements() {
        // 状态显示
        this.statusText = document.getElementById('statusText');
        this.phaseInfo = document.getElementById('phaseInfo');
        
        // 阶段进度
        this.phase1 = document.getElementById('phase1');
        this.phase2 = document.getElementById('phase2');
        
        // 计时器显示
        this.timerA = document.getElementById('timerA');
        this.timerB = document.getElementById('timerB');
        this.containerA = document.getElementById('containerA');
        this.containerB = document.getElementById('containerB');
        
        // 角色状态
        this.roleActionA = document.getElementById('roleActionA');
        this.roleActionB = document.getElementById('roleActionB');
        this.timeTypeA = document.getElementById('timeTypeA');
        this.timeTypeB = document.getElementById('timeTypeB');
        this.timeLimitA = document.getElementById('timeLimitA');
        this.timeLimitB = document.getElementById('timeLimitB');
        
        // 控制按钮
        this.startA = document.getElementById('startA');
        this.pauseA = document.getElementById('pauseA');
        this.startB = document.getElementById('startB');
        this.pauseB = document.getElementById('pauseB');
        
        // 主控制按钮
        this.startGame = document.getElementById('startGame');
        this.switchTurn = document.getElementById('switchTurn');
        this.nextPhase = document.getElementById('nextPhase');
        this.resetGame = document.getElementById('resetGame');
        
        // 规则
        this.rulesToggle = document.getElementById('rulesToggle');
        this.rulesContent = document.getElementById('rulesContent');
        
        // 音频
        this.timeUpSound = document.getElementById('timeUpSound');
    }
    
    bindEvents() {
        // 个人计时器控制
        this.startA.addEventListener('click', () => this.startTimer('A'));
        this.pauseA.addEventListener('click', () => this.pauseTimer('A'));
        this.startB.addEventListener('click', () => this.startTimer('B'));
        this.pauseB.addEventListener('click', () => this.pauseTimer('B'));
        
        // 主控制
        this.startGame.addEventListener('click', () => this.startGame_());
        this.switchTurn.addEventListener('click', () => this.switchSpeaker());
        this.nextPhase.addEventListener('click', () => this.nextPhase_());
        this.resetGame.addEventListener('click', () => this.resetGame_());
        
        // 规则切换
        this.rulesToggle.addEventListener('click', () => this.toggleRules());
    }
    
    createNotificationSound() {
        // 创建beep音效
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
    
    updatePhaseDisplay() {
        // 更新阶段进度显示
        this.phase1.className = 'phase-step';
        this.phase2.className = 'phase-step';
        
        if (this.gameState.currentPhase === 1) {
            this.phase1.classList.add('active');
        } else if (this.gameState.currentPhase === 2) {
            this.phase1.classList.add('completed');
            this.phase2.classList.add('active');
        } else if (this.gameState.gameEnded) {
            this.phase1.classList.add('completed');
            this.phase2.classList.add('completed');
        }
    }
    
    updateRoleDisplay() {
        const currentPhaseConfig = this.phaseConfig[this.gameState.currentPhase];
        if (!currentPhaseConfig) return;

        ['A', 'B'].forEach(player => {
            const isQuestionerForThisPlayerInThisPhase = (player === currentPhaseConfig.questioner);
            
            const timeType = isQuestionerForThisPlayerInThisPhase ? '提问时间' : '答题时间';
            const timeLimit = isQuestionerForThisPlayerInThisPhase ? '2分钟' : '4分钟';

            document.getElementById(`timeType${player}`).textContent = timeType;
            document.getElementById(`timeLimit${player}`).textContent = timeLimit;
            // .role and .totalTime are set by setupPhase/resetGame/constructor
        });
    }
    
    updateActionDisplay() {
        ['A', 'B'].forEach(player => {
            const actionElement = document.getElementById(`roleAction${player}`);
            
            if (!this.gameState.isGameStarted) {
                actionElement.textContent = '等待中';
            } else if (this.gameState.gameEnded) {
                actionElement.textContent = '比赛结束';
            } else if (this.gameState.phaseEnded) {
                actionElement.textContent = '阶段结束';
            } else {
                if (this.gameState.currentSpeaker === player) {
                    if (this.timers[player].isRunning) {
                        actionElement.textContent = this.timers[player].role === 'questioner' ? '提问中' : '回答中';
                    } else {
                        actionElement.textContent = this.timers[player].role === 'questioner' ? '准备提问' : '准备回答';
                    }
                } else {
                    actionElement.textContent = '等待中';
                }
            }
        });
    }
    
    updateVisualStates() {
        // 重置容器状态
        this.containerA.className = 'timer-container';
        this.containerB.className = 'timer-container';
        
        // 当前发言者高亮
        if (this.gameState.currentSpeaker && this.timers[this.gameState.currentSpeaker].isRunning) {
            const container = this.gameState.currentSpeaker === 'A' ? this.containerA : this.containerB;
            container.classList.add('active');
        }
        
        // 时间警告状态
        ['A', 'B'].forEach(player => {
            const timeLeft = this.timers[player].time;
            const totalTime = this.timers[player].totalTime;
            const container = player === 'A' ? this.containerA : this.containerB;
            
            if (timeLeft <= 0) {
                container.classList.add('danger');
            } else if (timeLeft <= totalTime * 0.1) { // 最后10%
                container.classList.add('danger');
            } else if (timeLeft <= totalTime * 0.2) { // 最后20%
                container.classList.add('warning');
            }
        });
    }
    
    updateButtonStates() {
        const gameStarted = this.gameState.isGameStarted;
        const gameEnded = this.gameState.gameEnded;
        const phaseEnded = this.gameState.phaseEnded;
    
        this.startGame.disabled = gameStarted;
        this.switchTurn.disabled = !gameStarted || gameEnded || phaseEnded || this.gameState.currentSpeaker === null; // Disable switch if no one is speaking/paused
        
        // 允许在比赛进行中随时点击"下一阶段"来强制结束当前阶段
        this.nextPhase.disabled = !gameStarted || gameEnded; 
        
        if (this.gameState.currentPhase === 2 && (phaseEnded || (!gameEnded && gameStarted))) { // 如果是第二阶段且已结束，或比赛开始但未结束（允许强制结束）
            this.nextPhase.textContent = '结束比赛';
        } else {
            this.nextPhase.textContent = '下一阶段';
        }
        if (gameEnded) {
            this.nextPhase.disabled = true; // 游戏结束后最终禁用
            this.nextPhase.textContent = '下一阶段'; // 或者恢复默认文本
        }
    
        ['A', 'B'].forEach(player => {
            const isRunning = this.timers[player].isRunning;
            const hasTime = this.timers[player].time > 0;
    
            const startBtn = player === 'A' ? this.startA : this.startB;
            const pauseBtn = player === 'A' ? this.pauseA : this.pauseB;
    
            if (gameStarted && !gameEnded && !phaseEnded) {
                if (this.gameState.currentSpeaker === null) { // No one is active, player whose role it is can start
                    const currentPhaseConfig = this.phaseConfig[this.gameState.currentPhase];
                    const isPlayerQuestioner = player === currentPhaseConfig.questioner;
                    const isPlayerAnswerer = player === currentPhaseConfig.answerer;
                    // Allow starting if it's their designated role in the current Q/A pair, or if just generally open.
                    // Simplified: if currentSpeaker is null, anyone with time can start. User manages who *should* start.
                    startBtn.disabled = isRunning || !hasTime || (this.timers.A.isRunning || this.timers.B.isRunning);
                } else if (this.gameState.currentSpeaker === player) { // This player had paused themselves
                    startBtn.disabled = isRunning || !hasTime; 
                } else { // The other player is the currentSpeaker (active or paused)
                    startBtn.disabled = true; 
                }
                pauseBtn.disabled = !(this.gameState.currentSpeaker === player && isRunning);
            } else {
                startBtn.disabled = true;
                pauseBtn.disabled = true;
            }
        });
    }
    
    updateStatusText() {
        if (!this.gameState.isGameStarted) {
            this.statusText.textContent = '案例研讨计时器 - 准备开始';
            this.phaseInfo.textContent = '等待开始比赛';
        } else if (this.gameState.gameEnded) {
            this.statusText.textContent = '案例研讨计时器 - 比赛结束';
            this.phaseInfo.textContent = '所有阶段已完成';
        } else if (this.gameState.phaseEnded) {
            this.statusText.textContent = `第${this.gameState.currentPhase}阶段已结束`;
            this.phaseInfo.textContent = this.gameState.currentPhase < 2 ? '准备进入下一阶段' : '比赛即将结束';
        } else {
            const config = this.phaseConfig[this.gameState.currentPhase];
            const questioner = config.questioner;
            const answerer = config.answerer;
            this.statusText.textContent = `第${this.gameState.currentPhase}阶段 - ${questioner}问${answerer}答`;
            
            if (this.gameState.currentSpeaker) {
                const role = this.timers[this.gameState.currentSpeaker].role;
                const action = role === 'questioner' ? '提问' : '回答';
                this.phaseInfo.textContent = `当前：${this.gameState.currentSpeaker}角${action}`;
            } else {
                this.phaseInfo.textContent = '等待开始发言';
            }
        }
    }
    
    updateDisplay() {
        // 更新时间显示
        this.timerA.textContent = this.formatTime(this.timers.A.time);
        this.timerB.textContent = this.formatTime(this.timers.B.time);
        
        // 更新各种状态
        this.updatePhaseDisplay();
        this.updateRoleDisplay();
        this.updateActionDisplay();
        this.updateVisualStates();
        this.updateButtonStates();
        this.updateStatusText();
    }
    
    startTimer(player) {
        // Cannot start if: already running, no time, or another player is paused (currentSpeaker is set to other player)
        if (this.timers[player].isRunning || this.timers[player].time <= 0 || 
            (this.gameState.currentSpeaker !== null && this.gameState.currentSpeaker !== player)) {
            return;
        }
    
        // Pause any other running timer before starting this one.
        // (Should not be needed if currentSpeaker logic is correct, but good for safety)
        this.pauseAllTimers(player); 
    
        this.gameState.currentSpeaker = player;
        this.timers[player].isRunning = true;
        this.timers[player].interval = setInterval(() => {
            this.timers[player].time--;
            this.updateDisplay();
            if (this.timers[player].time <= 0) {
                this.onTimeUp(player);
            }
        }, 1000);
        this.updateDisplay();
    }
    
    pauseTimer(player) {
        if (!this.timers[player].isRunning) return;
        clearInterval(this.timers[player].interval);
        this.timers[player].isRunning = false;
        // this.gameState.currentSpeaker remains 'player' so they can resume.
        this.updateDisplay();
    }
    
    pauseAllTimers(exceptPlayer = null) {
        ['A', 'B'].forEach(p => {
            if (p !== exceptPlayer && this.timers[p].isRunning) {
                clearInterval(this.timers[p].interval);
                this.timers[p].isRunning = false;
                // If we are pausing an active speaker because 'exceptPlayer' is starting,
                // currentSpeaker will be updated by startTimer.
            }
        });
    }
    
    onTimeUp(player) {
        this.pauseTimer(player);
        this.playBeep();
        
        // 检查是否需要结束阶段
        this.checkPhaseEnd();
    }
    
    checkPhaseEnd() {
        const config = this.phaseConfig[this.gameState.currentPhase];
        const questionerTime = this.timers[config.questioner].time;
        const answererTime = this.timers[config.answerer].time;
        
        // 如果两方时间都用完，阶段结束
        if (questionerTime <= 0 && answererTime <= 0) {
            this.endPhase();
        }
    }
    
    endPhase() {
        this.pauseAllTimers();
        this.gameState.phaseEnded = true;
        this.gameState.currentSpeaker = null; 
        this.updateDisplay();
    }
    
    startGame_() {
        this.gameState.isGameStarted = true;
        this.gameState.gameEnded = false; // Ensure gameEnded is false
        this.gameState.currentPhase = 1;
        this.setupPhase(1);
        // currentSpeaker is set to null by setupPhase
        this.updateDisplay();
    }
    
    setupPhase(phase) {
        const config = this.phaseConfig[phase];
        
        this.gameState.currentPhase = phase;
        this.gameState.phaseEnded = false;
        this.gameState.currentSpeaker = null;
        
        // Set roles and times based on WHO is questioner/answerer in this phase
        this.timers[config.questioner].time = config.questionTime;
        this.timers[config.questioner].totalTime = config.questionTime;
        this.timers[config.questioner].role = 'questioner';

        this.timers[config.answerer].time = config.answerTime;
        this.timers[config.answerer].totalTime = config.answerTime;
        this.timers[config.answerer].role = 'answerer';
        
        this.pauseAllTimers();
        this.updateDisplay();
    }
    
    switchSpeaker() {
        if (this.gameState.gameEnded || this.gameState.phaseEnded) return;
    
        const speakerWhoPaused = this.gameState.currentSpeaker;
        if (speakerWhoPaused && this.timers[speakerWhoPaused].isRunning) {
             this.pauseTimer(speakerWhoPaused); // Pauses them, currentSpeaker remains their ID
        }
        // Explicitly open the floor
        this.gameState.currentSpeaker = null; 
        this.updateDisplay();
    }
    
    nextPhase_() {
        // 如果当前阶段尚未结束（例如，用户强制跳转），则先结束当前阶段
        if (!this.gameState.phaseEnded && this.gameState.isGameStarted) {
            this.endPhase(); 
            // endPhase 会调用 updateDisplay，按钮状态会更新。
            // 如果在endPhase后游戏应该结束（比如第二阶段结束），后续逻辑会处理。
        }

        if (this.gameState.currentPhase >= 2) {
            this.endGame();
            return;
        }
        
        this.setupPhase(this.gameState.currentPhase + 1);
    }
    
    endGame() {
        this.pauseAllTimers();
        this.gameState.gameEnded = true;
        this.gameState.currentSpeaker = null;
        this.updateDisplay();
    }
    
    resetGame_() {
        this.pauseAllTimers();
        
        this.gameState = {
            isGameStarted: false,
            currentPhase: 1,
            currentSpeaker: null,
            gameEnded: false,
            phaseEnded: false
        };
        
        const phase1Config = this.phaseConfig[1];
        this.timers[phase1Config.answerer].time = phase1Config.answerTime;
        this.timers[phase1Config.answerer].totalTime = phase1Config.answerTime;
        this.timers[phase1Config.answerer].role = 'answerer'; // A is answerer

        this.timers[phase1Config.questioner].time = phase1Config.questionTime;
        this.timers[phase1Config.questioner].totalTime = phase1Config.questionTime;
        this.timers[phase1Config.questioner].role = 'questioner'; // B is questioner
        
        this.updateDisplay();
    }
    
    toggleRules() {
        const isHidden = this.rulesContent.classList.contains('hidden');
        
        if (isHidden) {
            this.rulesContent.classList.remove('hidden');
            this.rulesToggle.textContent = '隐藏规则 ▲';
        } else {
            this.rulesContent.classList.add('hidden');
            this.rulesToggle.textContent = '查看规则 ▼';
        }
    }
}

// 初始化计时器
document.addEventListener('DOMContentLoaded', () => {
    window.caseStudyTimer = new CaseStudyTimer(); // Assign to window object
});

// 防止页面刷新时丢失音频上下文
window.addEventListener('beforeunload', () => {
    if (window.caseStudyTimer) { // Check if instance exists
        // Pause timers if they are running
        if (window.caseStudyTimer.timers.A.isRunning) {
            window.caseStudyTimer.pauseTimer('A');
        }
        if (window.caseStudyTimer.timers.B.isRunning) {
            window.caseStudyTimer.pauseTimer('B');
        }
    }
}); 