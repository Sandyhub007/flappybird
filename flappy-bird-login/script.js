document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const showLeaderboardButton = document.getElementById('show-leaderboard');
    const backToGameButton = document.getElementById('back-to-game');

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    showRegisterLink.addEventListener('click', showRegister);
    showLoginLink.addEventListener('click', showLogin);
    showLeaderboardButton.addEventListener('click', showLeaderboard);
    backToGameButton.addEventListener('click', showGame);

    displayUsers(); // For debugging
});

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('https://your-backend-url/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('currentUser', JSON.stringify(data));
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('game-container').style.display = 'block';
            initGame();
            startGame();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error logging in:', err);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch('https://your-backend-url/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Registration successful. You can now log in.');
            showLogin();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Error registering:', err);
    }
}

function showRegister(e) {
    e.preventDefault();
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('register-container').style.display = 'block';
}

function showLogin(e) {
    if (e) e.preventDefault();
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
}

function displayUsers() {
    let users = JSON.parse(localStorage.getItem('flappyBirdUsers')) || [];
    console.log('Current users in localStorage:', users);
}

// Add your game initialization and other functions here
let canvas, ctx, bird, pipes, score, highScore, gameLoop, gameActive;

function initGame() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = 320;
    canvas.height = 480;

    bird = {
        x: 50,
        y: canvas.height / 2,
        velocity: 0,
        gravity: 0.5,
        jump: -10,
        width: 30,
        height: 20,
        speedBoost: false,
        invincible: false
    };

    pipes = [];
    powerUps = [];
    score = 0;
    highScore = JSON.parse(localStorage.getItem('currentUser')).highScore || 0;
    
    document.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('click', handleClick);
    
    createPipe();
    createPowerUp(); // Create the first power-up
    console.log('Game initialized');
}

function startGame() {
    gameActive = true;
    gameLoop = requestAnimationFrame(update);
    console.log('Game started');
}

function update() {
    if (!gameActive) return;

    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (bird.y + bird.height > canvas.height) {
        gameOver();
    }

    pipes.forEach(pipe => {
        pipe.x -= bird.speedBoost ? 4 : 2;

        if (pipe.x + pipe.width < 0) {
            pipes.shift();
            score++;
            createPipe();
        }

        if (!bird.invincible && checkCollision(pipe)) {
            gameOver();
        }
    });

    powerUps.forEach((powerUp, index) => {
        powerUp.x -= 2;

        if (powerUp.x + powerUp.width < 0) {
            powerUps.splice(index, 1);
            createPowerUp();
        }

        if (checkPowerUpCollision(powerUp)) {
            applyPowerUp(powerUp);
            powerUps.splice(index, 1);
            createPowerUp();
        }
    });

    draw();
    gameLoop = requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = '#87CEEB';  // Sky blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bird
    ctx.fillStyle = bird.invincible ? 'blue' : 'yellow'; // Change color if invincible
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);

    // Draw pipes
    ctx.fillStyle = 'green';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight, pipe.width, pipe.bottomHeight);
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
        if (powerUp.type === 'score') {
            ctx.fillStyle = 'red';
        } else if (powerUp.type === 'speed') {
            ctx.fillStyle = 'orange';
        } else if (powerUp.type === 'invincibility') {
            ctx.fillStyle = 'blue';
        }
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.textAlign = 'right';
    ctx.fillText(`High Score: ${highScore}`, canvas.width - 10, 30);
}

function createPipe() {
    const gap = 150;
    const minHeight = 50;
    const maxHeight = canvas.height - gap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    const bottomHeight = canvas.height - topHeight - gap;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomHeight: bottomHeight,
        width: 50,
        passed: false
    });
}

function checkCollision(pipe) {
    return (
        bird.x < pipe.x + pipe.width &&
        bird.x + bird.width > pipe.x &&
        (bird.y < pipe.topHeight || bird.y + bird.height > canvas.height - pipe.bottomHeight)
    );
}

async function gameOver() {
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        currentUser.highScore = highScore;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        await updateUserHighScore(currentUser);
    }
    
    // Show game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('Next game in 3 seconds...', canvas.width / 2, canvas.height / 2 + 50);

    setTimeout(() => {
        resetGame();
        startGame();
    }, 3000);
}

function resetGame() {
    score = 0;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes = [];
    createPipe();
}

function handleKeyDown(e) {
    if (e.code === 'Space' && gameActive) {
        e.preventDefault();
        bird.velocity = bird.jump;
    }
}

function handleClick() {
    if (gameActive) {
        bird.velocity = bird.jump;
    }
}

async function updateUserHighScore(user) {
    try {
        const response = await fetch('https://your-backend-url/api/users/highscore', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username, highScore: user.highScore })
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Error updating high score:', data.error);
        }
    } catch (err) {
        console.error('Error updating high score:', err);
    }
}

let powerUps = [];

function createPowerUp() {
    const powerUpTypes = ['score', 'speed', 'invincibility'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    const powerUp = {
        x: canvas.width,
        y: Math.random() * (canvas.height - 100) + 50, // Ensure power-ups are within reach
        width: 20,
        height: 20,
        type: type
    };
    powerUps.push(powerUp);
}

function checkPowerUpCollision(powerUp) {
    return (
        bird.x < powerUp.x + powerUp.width &&
        bird.x + bird.width > powerUp.x &&
        bird.y < powerUp.y + powerUp.height &&
        bird.y + bird.height > powerUp.y
    );
}

function applyPowerUp(powerUp) {
    if (powerUp.type === 'score') {
        score += 5; // Increase score by 5
    } else if (powerUp.type === 'speed') {
        bird.speedBoost = true;
        setTimeout(() => {
            bird.speedBoost = false;
        }, 5000); // Speed boost lasts for 5 seconds
    } else if (powerUp.type === 'invincibility') {
        bird.invincible = true;
        setTimeout(() => {
            bird.invincible = false;
        }, 5000); // Invincibility lasts for 5 seconds
    }
}

function showLeaderboard() {
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('leaderboard-container').style.display = 'block';
    populateLeaderboard();
}

function showGame() {
    document.getElementById('leaderboard-container').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
}

async function populateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard').getElementsByTagName('tbody')[0];
    leaderboard.innerHTML = ''; // Clear existing entries

    try {
        const response = await fetch('https://your-backend-url/api/users/leaderboard');
        const users = await response.json();
        users.forEach((user, index) => {
            const row = leaderboard.insertRow();
            const rankCell = row.insertCell(0);
            const usernameCell = row.insertCell(1);
            const highScoreCell = row.insertCell(2);

            rankCell.textContent = index + 1;
            usernameCell.textContent = user.username;
            highScoreCell.textContent = user.highScore;
        });
    } catch (err) {
        console.error('Error fetching leaderboard:', err);
    }
}
